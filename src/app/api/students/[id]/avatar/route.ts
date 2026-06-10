// POST /api/students/[id]/avatar — Parent met à jour l'avatar de son enfant
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const { avatar } = await req.json()

    if (!avatar || typeof avatar !== "string" || !avatar.startsWith("data:image")) {
      return NextResponse.json({ error: "Image invalide" }, { status: 400 })
    }
    if (avatar.length > 700_000) {
      return NextResponse.json({ error: "Image trop grande (max 500KB)" }, { status: 400 })
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { childrenLinks: { where: { studentId: id, isVerified: true } } },
    })

    if (!parent || parent.childrenLinks.length === 0) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const student = await prisma.student.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!student) return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 })

    await prisma.user.update({
      where: { id: student.userId },
      data: { avatar },
    })

    return NextResponse.json({ success: true, avatar })
  } catch (e: any) {
    console.error("[STUDENT AVATAR UPLOAD]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
