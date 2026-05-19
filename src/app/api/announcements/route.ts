// src/app/api/announcements/route.ts — with notifications to targets
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { announcementSchema } from "@/lib/validations/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page  = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "100")
  const role  = session.user.role

  const where: Record<string,unknown> = { isPublished: true }

  // ADMIN sees all. TEACHER sees all (to manage). Others see only targeted to their role.
  if (!["ADMIN","TEACHER"].includes(role)) {
    where.targetRoles = { has: role }
  }
  where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      include: {
        author:       { select: { fullName: true, role: true } },
        targetGroups: { include: { group: { select: { id: true, name: true } } } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.announcement.count({ where }),
  ])

  return NextResponse.json({ announcements, total, page, limit })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

  const parsed = announcementSchema.safeParse(body)
  if (!parsed.success) {
    const errors = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`).join("; ")
    return NextResponse.json({ error: errors || "Données invalides" }, { status: 400 })
  }

  const { targetGroupIds, ...data } = parsed.data

  // Create announcement
  const announcement = await prisma.announcement.create({
    data: {
      title:       data.title,
      titleAr:     data.titleAr,
      content:     data.content,
      contentAr:   data.contentAr,
      type:        data.type,
      targetRoles: data.targetRoles,
      isPinned:    data.isPinned,
      isPublished: data.isPublished,
      expiresAt:   data.expiresAt ? new Date(data.expiresAt) : null,
      schoolId:    session.user.schoolId,
      createdBy:   session.user.id,
      targetGroups: targetGroupIds.length > 0 ? {
        create: targetGroupIds.map(groupId => ({ groupId })),
      } : undefined,
    },
  })

  // ── Send notifications to target users ──
  if (data.isPublished) {
    const targetUserIds: string[] = []

    // If groups specified, only users in those groups; else all users matching roles
    if (targetGroupIds.length > 0) {
      const students = await prisma.student.findMany({
        where: { groupId: { in: targetGroupIds } },
        include: {
          user: { select: { id: true, role: true } },
          parentLinks: { where: { isVerified: true }, include: { parent: { include: { user: { select: { id: true } } } } } },
          teacher: { include: { user: { select: { id: true, role: true } } } },
        },
      })
      students.forEach(s => {
        if (data.targetRoles.includes("STUDENT")) targetUserIds.push(s.user.id)
        if (data.targetRoles.includes("PARENT")) {
          s.parentLinks.forEach(l => targetUserIds.push(l.parent.user.id))
        }
        if (data.targetRoles.includes("TEACHER") && s.teacher) {
          targetUserIds.push(s.teacher.user.id)
        }
      })
    } else {
      // Broadcast to all users matching the roles
      const users = await prisma.user.findMany({
        where: { role: { in: data.targetRoles as any[] }, isActive: true },
        select: { id: true },
      })
      users.forEach(u => targetUserIds.push(u.id))
    }

    const uniqueIds = [...new Set(targetUserIds)].filter(id => id !== session.user.id)
    if (uniqueIds.length > 0) {
      const TYPE_EMOJI: Record<string, string> = { GENERAL:"📢", EVENT:"📅", ACHIEVEMENT:"🏆", URGENT:"⚠️" }
      await prisma.notification.createMany({
        data: uniqueIds.map(userId => ({
          userId,
          schoolId: session.user.schoolId,
          type:    "announcement",
          title:   `${TYPE_EMOJI[data.type] ?? "📢"} ${data.title}`,
          titleAr: data.titleAr ?? undefined,
          message: data.content.length > 200 ? data.content.slice(0, 200) + "…" : data.content,
          data: { announcementId: announcement.id, type: data.type },
        })),
      })
    }
  }

  return NextResponse.json({ announcement, notified: data.isPublished }, { status: 201 })
}
