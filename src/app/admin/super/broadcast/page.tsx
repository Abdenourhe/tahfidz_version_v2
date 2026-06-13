// src/app/admin/super/broadcast/page.tsx
// Redirection temporaire vers le dashboard superadmin

import { redirect } from "next/navigation"

export default function SuperAdminBroadcastPage() {
  redirect("/admin/super/dashboard")
}
