// src/app/api/students/export/route.ts — CSV export of students filtered by group/teacher
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const groupId    = searchParams.get("groupId")
  const teacherId  = searchParams.get("teacherId")

  const where: Record<string, unknown> = {}

  // Teachers can only export their own students
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 })
    where.teacherId = teacher.id
  } else {
    // Admin can filter by teacher or group
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
  const ctx = []
  if (teacherId) {
    const t = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: { select: { fullName: true } } } })
    if (t) ctx.push(`Enseignant: ${t.user.fullName}`)
  }
  if (groupId) {
    const g = await prisma.group.findUnique({ where: { id: groupId } })
    if (g) ctx.push(`Groupe: ${g.name}`)
  }
  if (session.user.role === "TEACHER") ctx.push(`Mes élèves`)

  // Build CSV (Excel-compatible: BOM + ; separator)
  const SEP = ";"
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

  const BOM = "\uFEFF"
  const lines = [
    escape(`Liste des élèves — TAHFIDZ`),
    ...ctx.map(c => escape(c)),
    escape(`Total: ${students.length} élèves`),
    escape(`Généré le: ${new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}`),
    "",
    headers.map(escape).join(SEP),
    ...rows,
  ]

  const csv = BOM + lines.join("\r\n")
  const fname = `eleves_${groupId || teacherId || "tous"}_${new Date().toISOString().split("T")[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  })
}
