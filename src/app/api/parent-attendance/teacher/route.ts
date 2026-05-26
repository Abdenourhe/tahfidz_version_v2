// src/app/api/parent-attendance/teacher/route.ts
// GET: Teacher views parent-marked attendances for their students

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!teacher) return NextResponse.json({ attendances: [] })

    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get("groupId")
    const dateStr = searchParams.get("date")

    const where: Record<string, unknown> = {
      student: { teacherId: teacher.id },
    }
    if (groupId) {
      where.student = { teacherId: teacher.id, groupId }
    }
    if (dateStr) {
      const d = new Date(dateStr + "T00:00:00Z")
      where.date = { gte: d, lte: new Date(d.getTime() + 24 * 60 * 60 * 1000) }
    }

    const attendances = await prisma.parentAttendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        parent: { select: { fullName: true } },
      },
      orderBy: { date: "desc" },
      take: 100,
    })

    return NextResponse.json({ attendances })
  } catch (error: any) {
    console.error("[TEACHER ATTENDANCE]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
