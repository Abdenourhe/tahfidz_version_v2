// src/app/api/admin/school/route.ts
// GET: Check for pending update request
// PATCH: Admin requests an update to their school info (pending superadmin validation)

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const schoolId = session.user.schoolId
    if (!schoolId) return NextResponse.json({ error: "École non trouvée" }, { status: 404 })

    const pending = await prisma.schoolUpdateRequest.findFirst({
      where: { schoolId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ pending })
  } catch (error: any) {
    console.error("[ADMIN SCHOOL GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

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

    // Check if there's already a pending request for this school
    const existingPending = await prisma.schoolUpdateRequest.findFirst({
      where: { schoolId, status: "PENDING" },
    })
    if (existingPending) {
      return NextResponse.json({ error: "Une demande de modification est déjà en attente de validation" }, { status: 409 })
    }

    // Create the pending update request
    const request = await prisma.schoolUpdateRequest.create({
      data: {
        schoolId,
        requestedBy: session.user.id,
        name: name || null,
        nameAr: nameAr || null,
        address: address || null,
        city: city || null,
        country: country || null,
        phone: phone || null,
      },
    })

    // Fetch school name for notification
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    })

    // Notify superadmins
    const superadmins = await prisma.user.findMany({
      where: { role: "SUPERADMIN", isActive: true },
      select: { id: true },
    })
    if (superadmins.length > 0) {
      await prisma.notification.createMany({
        data: superadmins.map(sa => ({
          schoolId,
          userId: sa.id,
          type: "SCHOOL_UPDATE_REQUESTED",
          title: `Modification école en attente: ${school?.name || "École"}`,
          titleAr: `تعديل مدرسة قيد الانتظار: ${school?.name || "École"}`,
          message: `L'admin de ${school?.name || "l'école"} a demandé une modification des informations. Veuillez valider ou rejeter.`,
          messageAr: `طلب مسؤول ${school?.name || "المدرسة"} تعديل المعلومات. يرجى التحقق أو الرفض.`,
          data: { requestId: request.id, schoolId, url: "/admin/super/school-updates" },
        })),
      })
    }

    return NextResponse.json({ message: "Demande envoyée pour validation", request })
  } catch (error: any) {
    console.error("[ADMIN SCHOOL PATCH]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
