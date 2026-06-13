// src/app/admin/super/schools/page.tsx
// Redirection temporaire vers le dashboard superadmin

import { redirect } from "next/navigation"

export default function SuperAdminSchoolsPage() {
  redirect("/admin/super/dashboard")
}
