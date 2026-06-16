// src/app/parent/child/page.tsx
// Redirection vers le dashboard parent (les enfants sont listés là-bas)

import { redirect } from "next/navigation"

export default function ParentChildIndexPage() {
  redirect("/parent/dashboard")
}
