// src/app/admin/certificate-templates/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CertificateManager } from "@/components/certificate/CertificateManager"

export default async function CertificateTemplatesPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) redirect("/login")

  return (
    <div className="space-y-6">
      <CertificateManager />
    </div>
  )
}
