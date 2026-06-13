// src/app/admin/super/requests/page.tsx
// Redirection temporaire vers le dashboard superadmin

import { redirect } from "next/navigation"

export default function SuperAdminRequestsPage() {
  redirect("/admin/super/dashboard")
}
