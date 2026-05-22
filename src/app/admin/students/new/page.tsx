"use client"
// src/app/admin/students/new/page.tsx — Wrapper vers StudentForm (mode create)

import { StudentForm } from "@/components/admin/student-form"

export default function NewStudentPage() {
  return <StudentForm mode="create" />
}
