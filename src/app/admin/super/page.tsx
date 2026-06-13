// src/app/admin/super/page.tsx
// Redirection vers le dashboard superadmin

import { redirect } from "next/navigation"

export default function SuperAdminIndexPage() {
  redirect("/admin/super/dashboard")
}
