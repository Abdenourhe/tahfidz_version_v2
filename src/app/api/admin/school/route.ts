// src/app/api/admin/school/route.ts
// PATCH: Admin updates their own school info

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const schoolId = session.user.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: "École non trouvée" }, { status: 404 })
    }

    const body = await req.json()
    const { name, nameAr, address, city, country, phone } = body

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(nameAr !== undefined ? { nameAr: nameAr || null } : {}),
        ...(address !== undefined ? { address: address || null } : {}),
        ...(city !== undefined ? { city: city || null } : {}),
        ...(country !== undefined ? { country: country || "DZ" } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
      },
    })

    return NextResponse.json({ school: updated })
  } catch (error: any) {
    console.error("[ADMIN SCHOOL PATCH]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
