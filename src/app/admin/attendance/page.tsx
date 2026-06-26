// src/app/admin/attendance/page.tsx
// Server Component : charge les infos de l'école et rend le client.

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AttendanceClient from "./AttendanceClient"

export default async function AdminAttendancePage() {
  const session = await auth()

  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) redirect("/login")

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      nameAr: true,
      logo: true,
      address: true,
      city: true,
      country: true,
      phone: true,
    },
  })

  return <AttendanceClient school={school} />
}
