// src/app/api/admins/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Prevent deleting self
  if ((await params).id === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 })
  }

  // Ensure at least one admin remains
  const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } })
  if (adminCount <= 1) {
    return NextResponse.json({ error: "Au moins un administrateur doit rester actif" }, { status: 400 })
  }

  // Soft delete
  await prisma.user.update({
    where: { id: (await params).id },
    data:  { isActive: false },
  })

  await prisma.auditLog.create({
    data: {
      schoolId:   session.user.schoolId,
      userId:     session.user.id,
      action:     "deactivate",
      entityType: "admin",
      entityId:   (await params).id,
    } as any,
  })

  return NextResponse.json({ success: true })
}
