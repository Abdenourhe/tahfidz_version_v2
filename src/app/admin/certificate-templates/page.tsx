// src/app/admin/certificate-templates/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { readFile } from "fs/promises"
import { join } from "path"
import { CertificateTemplateEditor } from "@/components/admin/certificate"

export default async function CertificateTemplatesPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) redirect("/login")

  let templates = {}
  try {
    const raw = await readFile(join(process.cwd(), "src", "data", "certificateTemplates.json"), "utf-8")
    templates = JSON.parse(raw)
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