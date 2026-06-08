import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const schoolId = session.user.schoolId

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        studentCode: true,
        emergencyPhone: true,
        dateOfBirth: true,
        address: true,
        city: true,
        postalCode: true,
        medicalNotes: true,
        currentSurahNote: true,
        nationality: true,
        spokenLanguages: true,
        user: {
          select: {
            fullName: true,
            fullNameAr: true,
            email: true,
            phone: true,
            gender: true,
            createdAt: true,
            isActive: true,
            avatar: true,
          },
        },
        group: {
          select: {
            name: true,
            level: true,
            schedule: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
        parentLinks: {
          where: { isVerified: true },
          include: {
            parent: {
              include: {
                user: {
                  select: { fullName: true, email: true, phone: true },
                },
              },
            },
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 })
    }

    // Vérifier que l'élève appartient à l'école de l'utilisateur connecté
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, logo: true, address: true, city: true, phone: true },
    })

    const invite = await prisma.parentInvite.findUnique({
      where: { studentId: id },
      select: { code: true, used: true },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const inviteUrl = invite && !invite.used
      ? `${appUrl}/parent/register?invite=${invite.code}&student=${student.studentCode}`
      : null

    return NextResponse.json({ student, school, inviteUrl })
  } catch (error: any) {
    console.error("[PRINT REGISTRATION CARD]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
