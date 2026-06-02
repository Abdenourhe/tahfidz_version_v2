// src/app/teacher/messages/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { TeacherMessagesClient } from "@/components/teacher/messages/TeacherMessagesClient"

export default async function TeacherMessagesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "TEACHER") redirect("/login")

  return <TeacherMessagesClient />
}
