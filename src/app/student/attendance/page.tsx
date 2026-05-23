// src/app/student/attendance/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudentAttendanceClient } from "@/components/student/StudentAttendanceClient"

export default async function StudentAttendancePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      attendances: {
        orderBy: { date: "desc" },
        take: 60,
      },
    },
  })

  if (!student) redirect("/login")

  const attendances = student.attendances
  const total = attendances.length
  const present = attendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length
  const absent = attendances.filter(a => a.status === "ABSENT").length
  const excused = attendances.filter(a => a.status === "EXCUSED").length
  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  const byMonth: Record<string, typeof attendances> = {}
  for (const att of attendances) {
    const key = new Date(att.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(att)
  }

  return (
    <StudentAttendanceClient
      attendances={attendances}
      total={total}
      present={present}
      absent={absent}
      excused={excused}
      rate={rate}
      byMonth={byMonth}
    />
  )
}