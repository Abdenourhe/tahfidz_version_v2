// src/app/api/admin/school-updates/route.ts
// GET: List pending school update requests (superadmin)
// PATCH: Approve or reject a request (superadmin)

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const requests = await prisma.schoolUpdateRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    })

    const schoolIds = [...new Set(requests.map(r => r.schoolId))]
    const userIds = [...new Set(requests.map(r => r.requestedBy))]

    const [schools, users] = await Promise.all([
      prisma.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true, name: true, slug: true } }),
      prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } }),
    ])

    const enriched = requests.map(r => {
      const newValues: Record<string, any> = {}
      if (r.name != null) newValues.name = r.name
      if (r.nameAr != null) newValues.nameAr = r.nameAr
      if (r.address != null) newValues.address = r.address
      if (r.city != null) newValues.city = r.city
      if (r.country != null) newValues.country = r.country
      if (r.phone != null) newValues.phone = r.phone
      return {
        ...r,
        newValues,
        school: schools.find(s => s.id === r.schoolId) || { name: "Inconnue", slug: "" },
        requester: users.find(u => u.id === r.requestedBy) || { fullName: null, email: "Inconnu" },
      }
    })

    return NextResponse.json({ requests: enriched })
  } catch (error: any) {
    console.error("[SCHOOL UPDATES GET]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { requestId, approved, rejectionReason } = body as { requestId: string; approved: boolean; rejectionReason?: string }

    const request = await prisma.schoolUpdateRequest.findUnique({
      where: { id: requestId },
    })
    if (!request) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
    }
    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Demande déjà traitée" }, { status: 400 })
    }

    if (approved) {
      await prisma.school.update({
        where: { id: request.schoolId },
        data: {
          ...(request.name !== null && request.name !== undefined ? { name: request.name } : {}),
          ...(request.nameAr !== null && request.nameAr !== undefined ? { nameAr: request.nameAr } : {}),
          ...(request.address !== null && request.address !== undefined ? { address: request.address } : {}),
          ...(request.city !== null && request.city !== undefined ? { city: request.city } : {}),
          ...(request.country !== null && request.country !== undefined ? { country: request.country } : {}),
          ...(request.phone !== null && request.phone !== undefined ? { phone: request.phone } : {}),
        },
      })
    }

    await prisma.schoolUpdateRequest.update({
      where: { id: requestId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        rejectionReason: rejectionReason || null,
        processedAt: new Date(),
      },
    })

    const school = await prisma.school.findUnique({ where: { id: request.schoolId }, select: { name: true } })
    const schoolName = school?.name || "École"

    await prisma.notification.create({
      data: {
        schoolId: request.schoolId,
        userId: request.requestedBy,
        type: approved ? "SCHOOL_UPDATE_APPROVED" : "SCHOOL_UPDATE_REJECTED",
        title: approved
          ? `Modification approuvée: ${schoolName}`
          : `Modification rejetée: ${schoolName}`,
        titleAr: approved
          ? `تمت الموافقة على التعديل: ${schoolName}`
          : `تم رفض التعديل: ${schoolName}`,
        message: approved
          ? `Votre demande de modification des informations de ${schoolName} a été approuvée.`
          : `Votre demande de modification des informations de ${schoolName} a été rejetée.${rejectionReason ? ` Motif: ${rejectionReason}` : ""}`,
        messageAr: approved
          ? `تمت الموافقة على طلب تعديل معلومات ${schoolName}.`
          : `تم رفض طلب تعديل معلومات ${schoolName}.${rejectionReason ? ` السبب: ${rejectionReason}` : ""}`,
        data: { requestId, approved, url: "/admin/settings" },
      },
    })

    return NextResponse.json({ message: approved ? "Modifications approuvées" : "Modifications rejetées" })
  } catch (error: any) {
    console.error("[SCHOOL UPDATES PATCH]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
