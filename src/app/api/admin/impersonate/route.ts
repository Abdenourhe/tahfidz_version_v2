// src/app/api/admin/impersonate/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

// POST — Créer une session d'impersonation
export async function POST(request: Request) {
  try {
    // Vérifier que c'est un SUPERADMIN
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { schoolId } = await request.json()
    if (!schoolId) {
      return NextResponse.json({ error: "schoolId required" }, { status: 400 })
    }

    // Récupérer l'école et son admin
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        users: {
          where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
          take: 1,
        }
      }
    })

    if (!school?.users[0]) {
      return NextResponse.json({ error: "No admin found" }, { status: 404 })
    }

    const admin = school.users[0]

    // Créer les cookies
    const cookieStore = await cookies()

    // Cookie 1 : ID de l'école (httpOnly = sécurisé)
    cookieStore.set("impersonate_school_id", schoolId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 heure
      path: "/"
    })

    // Cookie 2 : Infos pour l'affichage (accessible par JS)
    cookieStore.set("impersonate_info", JSON.stringify({
      schoolName: school.name,
      schoolSlug: school.slug,
      adminEmail: admin.email,
      adminName: admin.fullName,
      originalAdmin: session.user.email,
      startedAt: new Date().toISOString()
    }), {
      httpOnly: false, // ← Accessible par le banner
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
      path: "/"
    })

    // Logger dans l'audit
    await fetch(`${process.env.NEXTAUTH_URL || ""}/api/admin/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "IMPERSONATE",
        target: school.name,
        targetId: school.id,
        targetType: "SCHOOL",
        details: { adminEmail: admin.email, originalAdmin: session.user.email }
      })
    }).catch(() => {}) // Silencieux si échoue

    return NextResponse.json({
      success: true,
      redirectUrl: "/admin/dashboard", 
      school: { id: school.id, name: school.name, slug: school.slug }
    })

  } catch (error) {
    console.error("Impersonate error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE — Arrêter l'impersonation
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("impersonate_school_id")
  cookieStore.delete("impersonate_info")

  return NextResponse.json({ success: true })
}