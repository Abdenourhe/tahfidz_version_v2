// src/middleware.ts — Protection routes
import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register-school",
  "/forgot-password",
  "/parent/register",
  "/api/register-school",
  "/api/forgot-password",
  "/api/auth",
]

const ROLE_ROUTES = [
  { prefix: "/admin/super",         allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/schools",   allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/health",    allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/audit",     allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/broadcast", allowed: ["SUPERADMIN"] },
  { prefix: "/admin",               allowed: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/teacher",             allowed: ["TEACHER", "ADMIN", "SUPERADMIN"] },
  { prefix: "/parent",              allowed: ["PARENT", "ADMIN", "SUPERADMIN"] },
  { prefix: "/student",             allowed: ["STUDENT", "ADMIN", "SUPERADMIN"] },
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Routes publiques
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Vérification JWT via getToken (Edge-compatible)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET!, secureCookie: true })

  if (!token) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  const role = (token.role as string) ?? ""

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
}

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
