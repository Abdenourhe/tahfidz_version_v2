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
  "/api/contact",
  "/api/site-config/landing/plans",
  "/api/site-config",
]

const PROTECTED_PAGES = ["/privacy", "/terms", "/security", "/updates", "/docs"]

const ROLE_ROUTES: Array<{ prefix: string; allowed: string[]; api?: boolean }> = [
  // SuperAdmin
  { prefix: "/admin/super",       allowed: ["SUPERADMIN"] },
  { prefix: "/api/admin/super", allowed: ["SUPERADMIN"], api: true },
  { prefix: "/api/admin/schools", allowed: ["SUPERADMIN"], api: true },
  { prefix: "/superadmin",        allowed: ["SUPERADMIN"] },
  // Admin
  { prefix: "/admin",             allowed: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/api/admins",        allowed: ["ADMIN", "SUPERADMIN"], api: true },
  { prefix: "/api/students",      allowed: ["ADMIN", "SUPERADMIN", "TEACHER", "PARENT"], api: true },
  { prefix: "/api/teachers",      allowed: ["ADMIN", "SUPERADMIN", "TEACHER"], api: true },
  { prefix: "/api/groups",        allowed: ["ADMIN", "SUPERADMIN", "TEACHER"], api: true },
  { prefix: "/api/announcements", allowed: ["ADMIN", "SUPERADMIN", "TEACHER"], api: true },
  { prefix: "/api/evaluations",   allowed: ["ADMIN", "SUPERADMIN", "TEACHER", "STUDENT", "PARENT"], api: true },
  { prefix: "/api/parents",       allowed: ["ADMIN", "SUPERADMIN"], api: true },
  { prefix: "/api/attendance",    allowed: ["ADMIN", "SUPERADMIN", "TEACHER", "PARENT"], api: true },
  { prefix: "/api/progress",      allowed: ["ADMIN", "SUPERADMIN", "TEACHER", "STUDENT", "PARENT"], api: true },
  { prefix: "/api/halaqa",        allowed: ["ADMIN", "SUPERADMIN", "TEACHER", "STUDENT", "PARENT"], api: true },
  { prefix: "/api/library",       allowed: ["ADMIN", "SUPERADMIN", "TEACHER", "STUDENT", "PARENT"], api: true },
  // Teacher
  { prefix: "/teacher",           allowed: ["TEACHER", "ADMIN", "SUPERADMIN"] },
  { prefix: "/api/teacher",       allowed: ["TEACHER", "ADMIN", "SUPERADMIN"], api: true },
  // Parent
  { prefix: "/parent",            allowed: ["PARENT", "ADMIN", "SUPERADMIN"] },
  { prefix: "/api/parent",        allowed: ["PARENT", "ADMIN", "SUPERADMIN", "TEACHER"], api: true },
  // Student
  { prefix: "/student",           allowed: ["STUDENT", "ADMIN", "SUPERADMIN"] },
  { prefix: "/api/student",       allowed: ["STUDENT", "ADMIN", "SUPERADMIN", "TEACHER", "PARENT"], api: true },
  // Public API pages (must remain authenticated but not restricted by role prefix)
  { prefix: "/api/admin",         allowed: ["ADMIN", "SUPERADMIN"], api: true },
  { prefix: "/api/superadmin",    allowed: ["SUPERADMIN"], api: true },
]

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isApi = pathname.startsWith("/api/")

  if (PROTECTED_PAGES.includes(pathname) && !session?.user) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }

  if (!session?.user) {
    if (isApi) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  const role = session.user.role ?? ""

  // API routes: require explicit role authorization
  if (isApi) {
    for (const { prefix, allowed } of ROLE_ROUTES) {
      if (pathname.startsWith(prefix)) {
        if (!allowed.includes(role)) {
          return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
        }
        return NextResponse.next()
      }
    }
    // Unknown API route: still require authentication (handled above) but allow through
    return NextResponse.next()
  }

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
