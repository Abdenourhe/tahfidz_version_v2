// src/app/api/announcements/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id: (await params).id },
    include: {
      targetGroups: { include: { group: { select: { id: true, name: true } } } },
      author: { select: { fullName: true } },
    },
  })

  if (!announcement) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  return NextResponse.json({ announcement })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const { targetGroupIds, ...data } = body

  // Remove existing group links then recreate
  await prisma.groupAnnouncement.deleteMany({ where: { announcementId: (await params).id } })

  const announcement = await prisma.announcement.update({
    where: { id: (await params).id },
    data: {
      ...data,
      ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : { expiresAt: null }),
      targetGroups: targetGroupIds?.length > 0
        ? { create: targetGroupIds.map((groupId: string) => ({ groupId })) }
        : undefined,
    },
  })

  return NextResponse.json({ announcement })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  await prisma.groupAnnouncement.deleteMany({ where: { announcementId: (await params).id } })
  await prisma.announcement.delete({ where: { id: (await params).id } })

  return NextResponse.json({ success: true })
}
