// src/app/admin/settings/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient"

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { name: true, logo: true, directorSignature: true, teacherSignature: true },
  })

  return (
    <AdminSettingsClient
      user={{
        name: (session.user as any).name ?? session.user.email ?? "",
        email: session.user.email ?? "",
      }}
      school={school ?? undefined}
    />
  )
}
