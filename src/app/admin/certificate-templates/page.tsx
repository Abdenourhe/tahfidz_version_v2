// src/app/admin/certificate-templates/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CertificateTemplateEditor } from "@/components/admin/certificate"

export default async function CertificateTemplatesPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) redirect("/login")

  let templates = {}
  try {
    const rows = await prisma.certificateTemplate.findMany()
    const obj: Record<string, any> = {}
    for (const row of rows) {
      obj[row.level] = row.config
    }
    templates = obj
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Modèles de certificats</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personnalisez les certificats selon le niveau</p>
      </div>
      <CertificateTemplateEditor initialTemplates={templates} />
    </div>
  )
}