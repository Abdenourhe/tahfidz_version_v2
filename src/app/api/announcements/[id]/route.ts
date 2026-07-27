// src/app/api/announcements/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.schoolId || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const schoolId = session.user.schoolId

  const announcement = await prisma.announcement.findUnique({
    where: { id: (await params).id, schoolId },
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
  if (!session?.user?.schoolId || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const schoolId = session.user.schoolId

  const body = await req.json()
  const { targetGroupIds, ...data } = body

  const existing = await prisma.announcement.findUnique({
    where: { id: (await params).id, schoolId },
  })
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  if (targetGroupIds?.length > 0) {
    const validGroups = await prisma.group.count({
      where: { id: { in: targetGroupIds }, schoolId },
    })
    if (validGroups !== targetGroupIds.length) {
      return NextResponse.json({ error: "Groupe(s) cible invalide(s)" }, { status: 400 })
    }
  }

  // Remove existing group links then recreate
  await prisma.groupAnnouncement.deleteMany({ where: { announcementId: (await params).id, announcement: { schoolId } } })

  const announcement = await prisma.announcement.update({
    where: { id: (await params).id, schoolId },
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
  if (!session?.user?.schoolId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const schoolId = session.user.schoolId

  const existing = await prisma.announcement.findUnique({
    where: { id: (await params).id, schoolId },
  })
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  await prisma.groupAnnouncement.deleteMany({ where: { announcementId: (await params).id, announcement: { schoolId } } })
  await prisma.announcement.delete({ where: { id: (await params).id, schoolId } })

  return NextResponse.json({ success: true })
}
