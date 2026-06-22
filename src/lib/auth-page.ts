// src/lib/auth-page.ts
// Helper pour protéger une page server-side (NextAuth v5).

import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}
