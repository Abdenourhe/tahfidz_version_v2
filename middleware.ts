// middleware.ts — Protection des routes TAHFIDZ (NextAuth v5)
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register-school",
  "/forgot-password",
  "/reset-password",
  "/parent/register",
  "/api/register-school",
  "/api/forgot-password",
  "/api/reset-password",
  "/api/auth",
  "/api/health",
  "/api/internal",
]

const PROTECTED_PAGES = ["/privacy", "/terms", "/security", "/updates", "/docs"]

const ROLE_ROUTES: Array<{ prefix: string; allowed: string[] }> = [
  { prefix: "/admin/super",       allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/schools", allowed: ["SUPERADMIN"] },
  { prefix: "/superadmin",        allowed: ["SUPERADMIN"] },
  { prefix: "/admin",             allowed: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/teacher",           allowed: ["TEACHER", "ADMIN", "SUPERADMIN"] },
  { prefix: "/parent",            allowed: ["PARENT", "ADMIN", "SUPERADMIN"] },
  { prefix: "/student",           allowed: ["STUDENT", "ADMIN", "SUPERADMIN"] },
]

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (PROTECTED_PAGES.includes(pathname) && !session?.user) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (!session?.user) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  const role = session.user.role ?? ""

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
