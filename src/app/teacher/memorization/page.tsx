// src/app/teacher/memorization/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TeacherMemorizationPanel from "@/components/teacher/TeacherMemorizationPanel"

export default async function TeacherMemorizationPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/login")
  }

  return <TeacherMemorizationPanel />
}
