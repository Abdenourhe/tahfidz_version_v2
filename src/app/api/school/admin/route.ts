// src/app/api/school/admin/route.ts
// GET: Retourne l'administrateur principal de l'école de l'utilisateur connecté

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const admin = await prisma.user.findFirst({
      where: {
        schoolId: session.user.schoolId,
        role: { in: ["ADMIN", "SUPERADMIN"] },
        isActive: true,
      },
      select: { id: true, fullName: true, fullNameAr: true, email: true, role: true },
      orderBy: { role: "asc", createdAt: "asc" },
    })

    if (!admin) {
      return NextResponse.json({ error: "Aucun administrateur trouvé" }, { status: 404 })
    }

    return NextResponse.json({ admin })
  } catch (error: any) {
    console.error("[SCHOOL ADMIN GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
