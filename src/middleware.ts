// src/middleware.ts — TEMPORAIREMENT DESACTIVE pour test Vercel
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  console.log("[middleware]", req.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads|public).*)",
  ],
}
