// src/app/admin/super/feedbacks/page.tsx
// Redirection temporaire vers le dashboard superadmin

import { redirect } from "next/navigation"

export default function SuperAdminFeedbacksPage() {
  redirect("/admin/super/dashboard")
}
