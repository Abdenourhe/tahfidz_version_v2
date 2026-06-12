// src/app/api/library/collections/[id]/enroll/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canManageLibrary } from "@/lib/library/permissions"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || !canManageLibrary(session.user as any)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const collection = await prisma.libraryCollection.findUnique({ where: { id } })
    if (!collection) return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })
    if (collection.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }) }

    const { studentId, action } = body as { studentId?: string; action?: "enroll" | "unenroll" }
    if (!studentId || !action) {
      return NextResponse.json({ error: "studentId et action requis" }, { status: 400 })
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, user: { schoolId: session.user.schoolId } },
    })
    if (!student) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })

    if (action === "enroll") {
      await prisma.libraryCollectionEnrollment.upsert({
        where: { collectionId_studentId: { collectionId: id, studentId } },
        update: { status: "ACTIVE" },
        create: { collectionId: id, studentId, status: "ACTIVE" },
      })
    } else {
      await prisma.libraryCollectionEnrollment.deleteMany({
        where: { collectionId: id, studentId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[LIBRARY ENROLL POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
