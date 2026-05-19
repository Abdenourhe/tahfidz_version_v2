// src/app/admin/certificate-templates/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { readFile } from "fs/promises"
import { join } from "path"
import { CertificateTemplateEditorI18n } from "@/components/admin/CertificateTemplateEditorI18n"

export default async function CertificateTemplatesPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) redirect("/login")

  let templates = {}
  try {
    const raw = await readFile(join(process.cwd(), "src", "data", "certificateTemplates.json"), "utf-8")
    templates = JSON.parse(raw)
  } catch {}

  return <CertificateTemplateEditorI18n initialTemplates={templates} />
}