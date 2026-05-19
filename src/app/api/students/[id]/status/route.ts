// src/app/api/students/[id]/status/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const { isActive } = body

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive doit être un booléen" }, { status: 400 })
  }

  const student = await prisma.student.findUnique({
    where: { id: (await params).id },
    include: { user: { select: { id: true, fullName: true } } },
  })

  if (!student) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  await prisma.user.update({
    where: { id: student.userId },
    data: { isActive },
  })

  await prisma.auditLog.create({
    data: {
      schoolId: session.user.schoolId,
      userId: session.user.id,
      action: isActive ? "activate" : "deactivate",
      entityType: "student",
      entityId: (await params).id,
      newValues: { isActive },
    },
  })

  return NextResponse.json({ success: true, isActive })
}
