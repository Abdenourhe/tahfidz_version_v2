// src/app/admin/super/health/page.tsx
// Redirection temporaire vers le dashboard superadmin

import { redirect } from "next/navigation"

export default function SuperAdminHealthPage() {
  redirect("/admin/super/dashboard")
}
