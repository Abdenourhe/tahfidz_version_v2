// src/app/api/maqra/evaluate/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const evalSchema = z.object({
  sessionId: z.string().min(1),
  studentId: z.string().min(1),
  tajweedScore: z.number().min(0).max(100).optional(),
  memorizationScore: z.number().min(0).max(100).optional(),
  fluencyScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: userId, role } = session.user
    const body = await req.json()
    const parsed = evalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const maqraSession = await prisma.maqraSession.findUnique({
      where: { id: data.sessionId },
    })
    if (!maqraSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    const isTeacher = maqraSession.teacherId === userId
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role)
    if (!isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const evaluation = await prisma.maqraEvaluation.upsert({
      where: {
        sessionId_studentId: {
          sessionId: data.sessionId,
          studentId: data.studentId,
        },
      },
      update: {
        tajweedScore: data.tajweedScore,
        memorizationScore: data.memorizationScore,
        fluencyScore: data.fluencyScore,
        notes: data.notes,
      },
      create: {
        sessionId: data.sessionId,
        studentId: data.studentId,
        tajweedScore: data.tajweedScore,
        memorizationScore: data.memorizationScore,
        fluencyScore: data.fluencyScore,
        notes: data.notes,
      },
    })

    return NextResponse.json({ evaluation }, { status: 200 })
  } catch (error: any) {
    console.error("[MAQRA EVALUATE ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
