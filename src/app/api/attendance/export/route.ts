// src/app/api/attendance/export/route.ts
// Export CSV des présences (un groupe ou tous les groupes) — sécurisé par tenant.

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const STATUS_LABELS: Record<string, Record<string, string>> = {
  PRESENT: { fr: "Présent", en: "Present", ar: "حاضر" },
  ABSENT:  { fr: "Absent",  en: "Absent",  ar: "غائب" },
  LATE:    { fr: "Retard",  en: "Late",    ar: "متأخر" },
  EXCUSED: { fr: "Excusé",  en: "Excused", ar: "معذور" },
}

function escCell(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function fmtDate(d: Date, locale: string) {
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "fr-FR", {
    day: "2-digit",
    month: "short",
  })
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const role = session.user.role
  if (!["ADMIN", "TEACHER"].includes(role)) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
  }

  const schoolId = session.user.schoolId
  if (!schoolId) {
    return NextResponse.json({ error: "École non trouvée" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get("groupId")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const allGroups = searchParams.get("allGroups") === "true"
  const locale = ["fr", "en", "ar"].includes(searchParams.get("locale") || "")
    ? (searchParams.get("locale") as "fr" | "en" | "ar")
    : "fr"

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "Période requise" }, { status: 400 })
  }

  const fromDate = new Date(dateFrom)
  const toDate = new Date(dateTo)
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Dates invalides" }, { status: 400 })
  }
  if (fromDate > toDate) {
    return NextResponse.json({ error: "Date de début après date de fin" }, { status: 400 })
  }

  // ── Groupes autorisés ────────────────────────────────────────────────────
  let allowedGroupIds: string[] = []

  if (role === "ADMIN") {
    const groups = await prisma.group.findMany({
      where: { schoolId, isActive: true },
      select: { id: true },
    })
    allowedGroupIds = groups.map(g => g.id)
  } else {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!teacher) {
      return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 })
    }
    const groups = await prisma.group.findMany({
      where: { teacherId: teacher.id, schoolId, isActive: true },
      select: { id: true },
    })
    allowedGroupIds = groups.map(g => g.id)
  }

  if (allowedGroupIds.length === 0) {
    return NextResponse.json({ error: "Aucun groupe disponible" }, { status: 404 })
  }

  let targetGroupIds = allowedGroupIds
  if (!allGroups && groupId) {
    if (!allowedGroupIds.includes(groupId)) {
      return NextResponse.json({ error: "Groupe non autorisé" }, { status: 403 })
    }
    targetGroupIds = [groupId]
  }

  // ── Récupération des données ─────────────────────────────────────────────
  const groups = await prisma.group.findMany({
    where: { id: { in: targetGroupIds } },
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { name: "asc" },
  })

  const studentGroups = await prisma.studentGroup.findMany({
    where: {
      groupId: { in: targetGroupIds },
      student: { user: { isActive: true } },
    },
    include: {
      student: {
        include: {
          user: { select: { fullName: true, fullNameAr: true } },
        },
      },
    },
  })

  const studentsByGroup: Record<string, typeof studentGroups[number]["student"][]> = {}
  studentGroups.forEach((sg) => {
    if (!sg.student) return
    if (!studentsByGroup[sg.groupId]) studentsByGroup[sg.groupId] = []
    studentsByGroup[sg.groupId].push(sg.student)
  })

  const attendances = await prisma.attendance.findMany({
    where: {
      groupId: { in: targetGroupIds },
      date: { gte: fromDate, lte: toDate },
    },
    orderBy: { date: "asc" },
  })

  // Fallback : élèves dont le groupe principal est dans targetGroupIds
  const fallbackStudents = await prisma.student.findMany({
    where: {
      groupId: { in: targetGroupIds },
      user: { isActive: true },
    },
    include: {
      user: { select: { fullName: true, fullNameAr: true } },
    },
  })

  fallbackStudents.forEach((s) => {
    if (!s.groupId) return
    if (!studentsByGroup[s.groupId]) studentsByGroup[s.groupId] = []
    if (!studentsByGroup[s.groupId].some((existing) => existing.id === s.id)) {
      studentsByGroup[s.groupId].push(s)
    }
  })

  // Fallback ultime : élèves ayant des présences dans ces groupes
  const studentIdsFromAttendances = new Set(attendances.map(a => a.studentId))
  if (studentIdsFromAttendances.size > 0) {
    const attendanceStudents = await prisma.student.findMany({
      where: {
        id: { in: Array.from(studentIdsFromAttendances) },
        user: { isActive: true },
      },
      include: {
        user: { select: { fullName: true, fullNameAr: true } },
      },
    })
    const attendanceStudentsById = new Map(attendanceStudents.map(s => [s.id, s]))
    attendances.forEach((a) => {
      const s = attendanceStudentsById.get(a.studentId)
      if (!s || !a.groupId) return
      if (!studentsByGroup[a.groupId]) studentsByGroup[a.groupId] = []
      if (!studentsByGroup[a.groupId].some((existing: typeof s) => existing.id === s.id)) {
        studentsByGroup[a.groupId].push(s)
      }
    })
  }

  // ── Construction du CSV ──────────────────────────────────────────────────
  const SEP = ";"
  const BOM = "\uFEFF"
  const lines: string[] = []

  groups.forEach(g => {
    // En-tête métier
    lines.push(escCell(`${g.name} — ${g.teacher.user.fullName}`))

    const groupStudents = studentsByGroup[g.id] || []
    const groupAttendances = attendances.filter(a => a.groupId === g.id)

    // Dates présentes dans ce groupe
    const dateSet = new Set<string>()
    groupStudents.forEach(s => {
      groupAttendances
        .filter(a => a.studentId === s.id)
        .forEach(a => dateSet.add(toDateKey(new Date(a.date))))
    })
    const dateList = Array.from(dateSet).sort()

    if (dateList.length === 0 || groupStudents.length === 0) {
      lines.push(escCell("Aucune donnée"))
      lines.push("")
      return
    }

    const headers = [
      "Nom",
      "Nom arabe",
      ...dateList.map(d => fmtDate(new Date(`${d}T12:00:00`), locale)),
      "Présences",
      "Absences",
      "Retards",
      "Excusés",
      "Taux %",
    ]
    lines.push(headers.map(escCell).join(SEP))

    groupStudents.forEach(s => {
      const dateMap = new Map<string, string>()
      let present = 0, absent = 0, late = 0, excused = 0

      groupAttendances
        .filter(a => a.studentId === s.id)
        .forEach(a => {
          const key = toDateKey(new Date(a.date))
          dateMap.set(key, STATUS_LABELS[a.status]?.[locale] ?? a.status)
          if (a.status === "PRESENT") present++
          else if (a.status === "ABSENT") absent++
          else if (a.status === "LATE") late++
          else if (a.status === "EXCUSED") excused++
        })

      const total = present + absent + late + excused
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

      const row = [
        s.user.fullName,
        s.user.fullNameAr || "",
        ...dateList.map(d => dateMap.get(d) || "—"),
        present,
        absent,
        late,
        excused,
        `${rate}%`,
      ]
      lines.push(row.map(escCell).join(SEP))
    })

    lines.push("")
  })

  const csv = BOM + lines.join("\r\n")
  const suffix = allGroups ? "tous_groupes" : groups[0]?.name.replace(/\s+/g, "_") || "groupe"
  const fname = `presences_${suffix}_${toDateKey(fromDate)}_${toDateKey(toDate)}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  })
}
