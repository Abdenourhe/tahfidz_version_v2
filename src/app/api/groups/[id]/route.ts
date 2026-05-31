// src/app/api/groups/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const patchSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  nameAr:      z.string().nullable().optional(),
  level:       z.string().optional(),
  maxCapacity: z.number().int().min(1).max(100).optional(),
  teacherId:   z.string().optional(),
  isActive:    z.boolean().optional(),
  schedule:    z.record(z.string()).optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const group = await prisma.group.findUnique({
    where: { id: (await params).id },
    include: {
      teacher: { include: { user: { select: { fullName: true, email: true } } } },
      students: { include: { user: { select: { fullName: true } } } },
      _count: { select: { students: true } },
    },
  })
  if (!group) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json({ group })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const groupId = (await params).id
  const existing = await prisma.group.findUnique({ where: { id: groupId } })
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: parsed.data,
  })

  // Audit log — CORRIGÉ avec tous les champs requis
  await prisma.auditLog.create({
    data: {
      schoolId: session.user.schoolId,
      userId: session.user.id,
      action: "UPDATE_GROUP",
      actorId: session.user.id,
      actorRole: session.user.role,
      actorEmail: session.user.email || "admin@system.local",
      actorName: session.user.name || session.user.email || "Administrateur",
      entityType: "group",
      entityId: groupId,
      targetType: "group",
      targetId: groupId,
      targetName: updated.name,
      oldValues: { name: existing.name, nameAr: existing.nameAr },
      newValues: parsed.data,
    },
  })

  return NextResponse.json({ group: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const groupId = (await params).id
  const studentCount = await prisma.student.count({ where: { groupId } })
  if (studentCount > 0) {
    return NextResponse.json({ error: `Impossible : ${studentCount} élève(s) dans ce groupe. Transférez-les d'abord.` }, { status: 400 })
  }

  const existing = await prisma.group.findUnique({ where: { id: groupId } })
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  await prisma.group.delete({ where: { id: groupId } })

  // Audit log
  await prisma.auditLog.create({
    data: {
      schoolId: session.user.schoolId,
      userId: session.user.id,
      action: "DELETE_GROUP",
      actorId: session.user.id,
      actorRole: session.user.role,
      actorEmail: session.user.email || "admin@system.local",
      actorName: session.user.name || session.user.email || "Administrateur",
      entityType: "group",
      entityId: groupId,
      targetType: "group",
      targetId: groupId,
      targetName: existing.name,
    },
  })

  return NextResponse.json({ success: true })
}