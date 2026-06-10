// src/app/api/messages/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendMail, isMailConfigured } from "@/lib/mail"
import { NextResponse } from "next/server"
import { z } from "zod"

const sendSchema = z.object({
  toUserId: z.string().uuid(),
  subject:  z.string().min(1).max(200),
  body:     z.string().min(1).max(5000),
  replyToId: z.string().uuid().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "all"
  const otherUserId = searchParams.get("otherUserId")

  let where: any = { deletedAt: null }

  if (type === "sent") {
    where = { ...where, fromUserId: session.user.id }
  } else if (type === "inbox") {
    where = { ...where, toUserId: session.user.id }
  } else if (type === "conversation" && otherUserId) {
    where = {
      ...where,
      schoolId: session.user.schoolId,
      OR: [
        { fromUserId: session.user.id, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: session.user.id },
      ],
    }
  } else {
    where = {
      ...where,
      OR: [{ fromUserId: session.user.id }, { toUserId: session.user.id }],
    }
  }

  const rawMessages = await prisma.directMessage.findMany({
    where,
    include: {
      fromUser: { select: { fullName: true, role: true } },
      toUser:   { select: { fullName: true, role: true } },
      replyTo:  { select: { body: true, deletedAt: true, fromUser: { select: { fullName: true } } } },
      reactions: { select: { emoji: true, userId: true } },
    },
    orderBy: { sentAt: "desc" },
    take: 100,
  })

  // Masquer le contenu des messages supprimés dans les citations
  const messages = rawMessages.map(m => ({
    ...m,
    replyTo: m.replyTo && m.replyTo.deletedAt
      ? { body: "Message supprimé", fromUser: m.replyTo.fromUser }
      : m.replyTo,
  }))

  const unreadCount = await prisma.directMessage.count({
    where: { toUserId: session.user.id, isRead: false, deletedAt: null },
  })

  return NextResponse.json({ messages, unreadCount })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { toUserId, subject, body: msgBody, replyToId } = parsed.data
  const toUser = await prisma.user.findUnique({ where: { id: toUserId }, select: { id:true, fullName:true, email:true } })
  if (!toUser) return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 })

  const fromUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { fullName:true, role:true } })
  const toUserWithPrefs = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id:true, fullName:true, email:true, role:true, messageNotifications:true },
  })
  if (!toUserWithPrefs) return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 })

  const message = await prisma.directMessage.create({
    data: {
      schoolId: session.user.schoolId,
      fromUserId: session.user.id,
      toUserId,
      subject,
      body: msgBody,
      replyToId,
    }
  })

  // Notification conditionnelle selon les préférences du destinataire
  if (toUserWithPrefs.messageNotifications) {
    const redirectUrl = toUserWithPrefs.role === "TEACHER"
      ? "/teacher/messages"
      : "/parent/dashboard"

    await prisma.notification.create({
      data: {
        schoolId: session.user.schoolId,
        userId: toUserId, type: "direct_message",
        title: `Nouveau message : ${subject}`,
        titleAr: `رسالة جديدة : ${subject}`,
        message: `De : ${fromUser?.fullName ?? "Inconnu"}\n${msgBody.slice(0,150)}${msgBody.length>150?"…":""}`,
        data: { messageId: message.id, fromUserId: session.user.id, url: redirectUrl },
      },
    })
  }

  if (toUserWithPrefs.email && isMailConfigured()) {
    try {
      await sendMail({
        to: toUserWithPrefs.email,
        subject: `[TAHFIDZ] ${subject}`,
        html: `<div style="font-family:sans-serif;padding:24px;max-width:560px;"><h2>📬 Nouveau message</h2><p><strong>De :</strong> ${fromUser?.fullName ?? "Inconnu"}</p><p><strong>Objet :</strong> ${subject}</p><div style="background:#f9fafb;padding:16px;border-radius:8px;white-space:pre-wrap;">${msgBody}</div><p style="margin-top:20px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background:#1D9E75;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Voir sur TAHFIDZ</a></p></div>`,
      })
    } catch(e) { console.error("Email error:", e) }
  }

  return NextResponse.json({ message }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const otherUserId = searchParams.get("otherUserId")
  if (!otherUserId) return NextResponse.json({ error: "otherUserId requis" }, { status: 400 })
  await prisma.directMessage.deleteMany({
    where: {
      schoolId: session.user.schoolId,
      deletedAt: null,
      OR: [
        { fromUserId: session.user.id, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: session.user.id },
      ],
    },
  })
  return NextResponse.json({ success: true })
}
