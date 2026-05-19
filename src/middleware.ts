// src/middleware.ts — Simplifié, PAS de jwtVerify
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
  "/login",
  "/register-school",
  "/api/register-school",
  "/api/auth",
]

const ROLE_ROUTES = [
  { prefix: "/admin/super",         allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/schools",   allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/health",    allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/audit",     allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/broadcast", allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/impersonate", allowed: ["SUPERADMIN"] },
  { prefix: "/admin",               allowed: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/teacher",             allowed: ["TEACHER", "ADMIN", "SUPERADMIN"] },
  { prefix: "/parent",              allowed: ["PARENT", "ADMIN", "SUPERADMIN"] },
  { prefix: "/student",             allowed: ["STUDENT", "ADMIN", "SUPERADMIN"] },
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Routes publiques
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Pas de session → login
  if (!session?.user) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  const role = session.user.role ?? ""

  // 🔴 BLOCAGE : Si en mode impersonation, INTERDIRE /admin/super
  // (pour éviter que l'admin impersonné retourne au super admin)
  const impersonateInfo = req.cookies.get("impersonate_info")?.value
  if (impersonateInfo && pathname.startsWith("/admin/super")) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url))
  }

  // Protection par rôle
  for (const { prefix, allowed } of ROLE_ROUTES) {
    if (pathname.startsWith(prefix)) {
      if (!allowed.includes(role)) {
        return NextResponse.redirect(new URL(getDashboard(role), req.url))
      }
      return NextResponse.next()
    }
  }

  return NextResponse.next()
})

function getDashboard(role: string): string {
  switch (role) {
    case "SUPERADMIN": return "/admin/super"
    case "ADMIN":      return "/admin/dashboard"
    case "TEACHER":    return "/teacher/dashboard"
    case "PARENT":     return "/parent/dashboard"
    case "STUDENT":    return "/student/dashboard"
    default:           return "/login"
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads|public).*)",
  ],
}
