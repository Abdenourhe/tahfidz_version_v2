"use client"
// src/app/admin/students/[id]/edit/page.tsx — Wrapper vers StudentForm (mode edit)

import { use } from "react"
import { StudentForm } from "@/components/admin/student-form"

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <StudentForm mode="edit" studentId={id} />
}
