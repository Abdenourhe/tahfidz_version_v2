// src/app/teacher/attendance/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TeacherAttendanceValidation from "@/components/teacher/TeacherAttendanceValidation"

export default async function TeacherAttendancePage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  return <TeacherAttendanceValidation />
}
