// src/app/admin/super/audit/page.tsx
// Redirection temporaire vers le dashboard superadmin

import { redirect } from "next/navigation"

export default function SuperAdminAuditPage() {
  redirect("/admin/super/dashboard")
}
