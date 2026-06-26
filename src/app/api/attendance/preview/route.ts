// src/app/api/attendance/preview/route.ts
// Retourne une matrice élèves × dates pour l'aperçu et les exports pro.

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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

  // ── Restriction des groupes selon le rôle ────────────────────────────────
  let allowedGroupIds: string[] = []

  if (role === "ADMIN") {
    const groups = await prisma.group.findMany({
      where: { schoolId, isActive: true },
      select: { id: true },
    })
    allowedGroupIds = groups.map(g => g.id)
  } else {
    // TEACHER
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

  // Si un groupId est demandé, vérifier qu'il est autorisé
  let targetGroupIds = allowedGroupIds
  if (groupId && groupId !== "all") {
    if (!allowedGroupIds.includes(groupId)) {
      return NextResponse.json({ error: "Groupe non autorisé" }, { status: 403 })
    }
    targetGroupIds = [groupId]
  }

  // ── Récupération des groupes avec élèves et présences ────────────────────
  const groups = await prisma.group.findMany({
    where: { id: { in: targetGroupIds } },
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      students: {
        where: { user: { isActive: true } },
        include: {
          user: { select: { id: true, fullName: true, fullNameAr: true } },
          attendances: {
            where: {
              date: { gte: fromDate, lte: toDate },
            },
            orderBy: { date: "asc" },
          },
        },
        orderBy: { user: { fullName: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  })

  // ── Construction de la liste complète des dates de la période ────────────
  const dateList: string[] = []
  const cursor = new Date(fromDate)
  while (cursor <= toDate) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`
    dateList.push(key)
    cursor.setDate(cursor.getDate() + 1)
  }

  // ── Construction de la réponse ───────────────────────────────────────────
  const result = groups.map(g => {
    const students = g.students.map(s => {
      const dates: Record<string, string> = {}
      let present = 0
      let absent = 0
      let late = 0
      let excused = 0

      s.attendances.forEach(a => {
        const d = new Date(a.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        dates[key] = a.status
        if (a.status === "PRESENT") present++
        else if (a.status === "ABSENT") absent++
        else if (a.status === "LATE") late++
        else if (a.status === "EXCUSED") excused++
      })

      const total = present + absent + late + excused
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

      return {
        id: s.id,
        fullName: s.user.fullName,
        fullNameAr: s.user.fullNameAr || null,
        dates,
        stats: { present, absent, late, excused, total, rate },
      }
    })

    return {
      id: g.id,
      name: g.name,
      teacherName: g.teacher.user.fullName,
      students,
    }
  })

  return NextResponse.json({ groups: result, dateList })
}
