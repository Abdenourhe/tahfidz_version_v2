// src/app/api/students/route.ts
// GET (liste + ?export=true) | POST (création)
// Fusion de : route.ts + export/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// ═════════════════════════════════════════════════════════════════════════════
// GET — Liste des élèves OU export CSV (query param ?export=true)
// ═════════════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const exportMode = searchParams.get("export") === "true"
  const groupId   = searchParams.get("groupId")  || undefined
  const teacherId = searchParams.get("teacherId") || undefined
  const status    = searchParams.get("status") || ""

  // ════════════════════════════════════════════════════════════════════════════
  // EXPORT CSV
  // ════════════════════════════════════════════════════════════════════════════
  if (exportMode) {
    const where: Record<string, unknown> = {}

    // Teachers can only export their own students
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
      if (!teacher) return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 })
      where.teacherId = teacher.id
    } else {
      // Admin can filter by teacher or group
      if (session.user.role === "ADMIN") {
        where.user = { schoolId: session.user.schoolId }
      }
      if (teacherId) where.teacherId = teacherId
      if (groupId)   where.groupId   = groupId
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user:    { select: { fullName: true, fullNameAr: true, email: true, phone: true, gender: true, isActive: true } },
        group:   { select: { name: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
        parentLinks: {
          where: { isVerified: true },
          include: { parent: { include: { user: { select: { fullName: true, phone: true, email: true } } } } },
          take: 1,
        },
        memorizationProgress: {
          where: { status: "MEMORIZED" },
          select: { id: true },
        },
        _count: { select: { memorizedSurahs: true, attendances: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    })

    // Get filter context for header
    const ctx: string[] = []
    if (teacherId) {
      const t = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: { select: { fullName: true } } } })
      if (t) ctx.push(`Enseignant: ${t.user.fullName}`)
    }
    if (groupId) {
      const g = await prisma.group.findUnique({ where: { id: groupId } })
      if (g) ctx.push(`Groupe: ${g.name}`)
    }
    if (session.user.role === "TEACHER") ctx.push("Mes élèves")

    const SEP    = ";"
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`

    const headers = [
      "Code élève", "Nom complet", "Nom arabe", "Email", "Téléphone élève", "Genre", "Statut",
      "Groupe", "Enseignant",
      "Sourates mémorisées", "Étoiles", "Streak", "Présences",
      "Parent (nom)", "Parent (téléphone)", "Parent (email)",
    ]

    const rows = students.map(s => {
      const parent = s.parentLinks[0]?.parent
      return [
        s.studentCode,
        s.user.fullName,
        s.user.fullNameAr ?? "",
        s.user.email,
        s.user.phone ?? "",
        s.user.gender ?? "",
        s.user.isActive ? "Actif" : "Inactif",
        s.group?.name ?? "Sans groupe",
        s.teacher?.user.fullName ?? "Sans enseignant",
        s._count.memorizedSurahs,
        s.totalStars,
        s.currentStreak,
        s._count.attendances,
        parent?.user.fullName ?? "",
        parent?.user.phone ?? "",
        parent?.user.email ?? "",
      ].map(escape).join(SEP)
    })

    const BOM   = "﻿"
    const lines = [
      escape("Liste des élèves — TAHFIDZ"),
      ...ctx.map(c => escape(c)),
      escape(`Total: ${students.length} élèves`),
      escape(`Généré le: ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`),
      "",
      headers.map(escape).join(SEP),
      ...rows,
    ]

    const csv   = BOM + lines.join("\r\n")
    const fname = `eleves_${groupId || teacherId || "tous"}_${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LISTE JSON
  // ════════════════════════════════════════════════════════════════════════════
  try {
    const schoolId = session.user.schoolId
    const where: Record<string, unknown> = { user: { schoolId } }

    // Teacher ne voit que SES élèves
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } })
      if (teacher) where.teacherId = teacher.id
    }

    if (status === "active")   where.user = { schoolId, isActive: true }
    if (status === "inactive") where.user = { schoolId, isActive: false }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, fullNameAr: true, email: true, phone: true, gender: true, avatar: true, isActive: true, createdAt: true } },
        group:   { select: { id: true, name: true, level: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
        parentLinks: { include: { parent: { include: { user: { select: { fullName: true } } } } }, where: { isVerified: true } },
        _count: { select: { memorizedSurahs: true } },
      },
      orderBy: { user: { createdAt: "desc" } },
    })

    return NextResponse.json({ students, total: students.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// POST — Créer un élève
// ═════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const {
      fullName, fullNameAr, email, password, gender, dateOfBirth,
      phone, emergencyPhone, groupId, teacherId,
      address, city, postalCode, medicalNotes, currentSurahNote,
      nationality, spokenLanguages, photo,
    } = body

    const schoolId = session.user.schoolId

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Nom, email et mot de passe sont requis" }, { status: 400 })
    }

    const existingUser = await prisma.user.findFirst({ where: { email, schoolId } })
    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé dans cette école" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    async function generateStudentCode(tx: any) {
      const year = new Date().getFullYear()
      const prefix = `TAH-${year}-`
      const last = await tx.student.findFirst({
        where: { studentCode: { startsWith: prefix }, user: { schoolId } },
        orderBy: { studentCode: "desc" },
      })
      let num = 1
      if (last) {
        const match = last.studentCode.match(new RegExp(`^${prefix}([0-9]+)$`))
        if (match) num = parseInt(match[1], 10) + 1
      }
      return `${prefix}${String(num).padStart(4, "0")}`
    }

    let result: any
    let retries = 0
    const maxRetries = 5

    while (retries < maxRetries) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              fullName, fullNameAr: fullNameAr || null, email, password: hashedPassword,
              gender: gender || null, role: "STUDENT", phone: phone || null,
              avatar: photo || null, isActive: true, schoolId,
            },
          })

          const studentCode = await generateStudentCode(tx)

          const student = await tx.student.create({
            data: {
              userId: user.id, studentCode,
              groupId: groupId || null, teacherId: teacherId || null,
              emergencyPhone: emergencyPhone || null,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              address: address || null, city: city || null,
              postalCode: postalCode || null, medicalNotes: medicalNotes || null,
              currentSurahNote: currentSurahNote || null,
              nationality: nationality || null,
              spokenLanguages: spokenLanguages || null,
            },
            include: { user: true, group: true, teacher: { include: { user: true } } },
          })

          // Générer l'invitation parent
          const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase()
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 30)

          await tx.parentInvite.create({
            data: {
              code: inviteCode,
              studentId: student.id,
              schoolId,
              expiresAt,
            },
          })

          return { student, inviteCode, studentCode }
        })
        break
      } catch (err: any) {
        // Si erreur de contrainte unique sur studentCode, réessayer
        if (err.message?.includes("Unique constraint") && err.message?.includes("studentCode")) {
          retries++
          continue
        }
        throw err
      }
    }

    if (!result) {
      return NextResponse.json({ error: "Impossible de générer un code élève unique après plusieurs tentatives" }, { status: 500 })
    }

    const inviteUrl = `${APP_URL}/parent/register?invite=${result.inviteCode}&student=${result.studentCode}`

    return NextResponse.json({
      message: "Élève créé avec succès",
      student: result.student,
      studentCode: result.studentCode,
      inviteUrl,
      qrValue: inviteUrl,
    }, { status: 201 })

  } catch (error: any) {
    console.error("[STUDENT POST ERROR]", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la création" }, { status: 500 })
  }
}