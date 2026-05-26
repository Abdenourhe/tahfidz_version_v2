// src/app/api/parent-attendance/alerts/route.ts
// GET: Admin views unvalidated absence alerts

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const alerts = await prisma.parentAttendance.findMany({
      where: {
        status: "ABSENT",
        validatedBy: null,
        student: { user: { schoolId: session.user.schoolId } },
      },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        parent: { select: { fullName: true } },
      },
      orderBy: { date: "desc" },
      take: 20,
    })

    return NextResponse.json({ alerts })
  } catch (error: any) {
    console.error("[ATTENDANCE ALERTS]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
