// src/app/api/attendance/export/route.ts — Excel-compatible with BOM + semicolons
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN","TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const groupId  = searchParams.get("groupId")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo   = searchParams.get("dateTo")
  if (!groupId) return NextResponse.json({ error: "groupId requis" }, { status: 400 })

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { teacher: { include: { user: { select: { fullName: true } } } } },
  })

  const students = await prisma.student.findMany({
    where: { groupId },
    include: {
      user: { select: { fullName: true, fullNameAr: true, email: true, phone: true } },
      parentLinks: {
        where: { isVerified: true },
        include: { parent: { include: { user: { select: { fullName: true, phone: true, email: true } } } } },
        take: 1,
      },
      attendances: {
        where: {
          groupId,
          ...(dateFrom || dateTo ? {
            date: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo   ? { lte: new Date(dateTo) }   : {}),
            },
          } : {}),
        },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { user: { fullName: "asc" } },
  })

  const STATUS_FR: Record<string, string> = {
    PRESENT: "Présent", ABSENT: "Absent", LATE: "Retard", EXCUSED: "Excusé",
  }

  const allDates = [...new Set(
    students.flatMap(s => s.attendances.map(a => new Date(a.date).toLocaleDateString("fr-FR")))
  )].sort()

  const SEP = ";"

  const escCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`

  const headers = [
    "Nom complet", "Nom arabe", "Email", "Téléphone élève",
    "Parent", "Téléphone parent", "Email parent",
    "Présences + retards", "Absences", "Retards", "Excusés", "Taux %",
    ...allDates.map(d => `Présence ${d}`),
  ]

  const rows = students.map(student => {
    const parent  = student.parentLinks[0]?.parent
    const attMap  = new Map(student.attendances.map(a => [new Date(a.date).toLocaleDateString("fr-FR"), a.status]))
    const present = student.attendances.filter(a => a.status === "PRESENT").length
    const absent  = student.attendances.filter(a => a.status === "ABSENT").length
    const late    = student.attendances.filter(a => a.status === "LATE").length
    const excused = student.attendances.filter(a => a.status === "EXCUSED").length
    const total   = student.attendances.length
    const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    return [
      student.user.fullName,
      student.user.fullNameAr || "",
      student.user.email,
      student.user.phone || "",
      parent?.user.fullName || "",
      parent?.user.phone || "",
      parent?.user.email || "",
      present + late,
      absent,
      late,
      excused,
      `${rate}%`,
      ...allDates.map(d => STATUS_FR[attMap.get(d) ?? ""] ?? "—"),
    ].map(escCell)
  })

  const BOM = "\uFEFF"
  const lines = [
    escCell(`Rapport de présences — ${group?.name ?? groupId}`),
    escCell(`Enseignant: ${group?.teacher.user.fullName ?? "—"}`),
    escCell(`Généré le: ${new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}`),
    "",
    headers.map(escCell).join(SEP),
    ...rows.map(r => r.join(SEP)),
  ]

  const csv = BOM + lines.join("\r\n")
  const fname = `presences_${(group?.name ?? groupId).replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  })
}
