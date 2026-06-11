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
      include: {
        school: { select: { name: true, slug: true } },
        requester: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ requests })
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
      include: { school: { select: { name: true } } },
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

    await prisma.notification.create({
      data: {
        schoolId: request.schoolId,
        userId: request.requestedBy,
        type: approved ? "SCHOOL_UPDATE_APPROVED" : "SCHOOL_UPDATE_REJECTED",
        title: approved
          ? `Modification approuvée: ${request.school.name}`
          : `Modification rejetée: ${request.school.name}`,
        titleAr: approved
          ? `تمت الموافقة على التعديل: ${request.school.name}`
          : `تم رفض التعديل: ${request.school.name}`,
        message: approved
          ? `Votre demande de modification des informations de ${request.school.name} a été approuvée.`
          : `Votre demande de modification des informations de ${request.school.name} a été rejetée.${rejectionReason ? ` Motif: ${rejectionReason}` : ""}`,
        messageAr: approved
          ? `تمت الموافقة على طلب تعديل معلومات ${request.school.name}.`
          : `تم رفض طلب تعديل معلومات ${request.school.name}.${rejectionReason ? ` السبب: ${rejectionReason}` : ""}`,
        data: { requestId, approved, url: "/admin/settings" },
      },
    })

    return NextResponse.json({ message: approved ? "Modifications approuvées" : "Modifications rejetées" })
  } catch (error: any) {
    console.error("[SCHOOL UPDATES PATCH]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
