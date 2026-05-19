// src/app/api/admin/schools/route.ts — Super-Admin uniquement
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") return null
  return session
}

function makeSlug(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const l1 = letters[Math.floor(Math.random() * 26)]
  const l2 = letters[Math.floor(Math.random() * 26)]
  const digits = String(Math.floor(10000 + Math.random() * 90000))
  return `${l1}${l2}-${digits}`
}

function autoPlan(total: number) {
  if (total >= 200) return "ENTERPRISE"
  if (total >= 50)  return "PRO"
  return "FREE"
}

// GET — écoles actives + toutes les demandes
export async function GET() {
  if (!await requireSuperAdmin()) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const [schools, requests] = await Promise.all([
    prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
        users: {
          select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
          orderBy: { role: "asc" },
        },
      },
    }),
    (prisma as any).schoolRequest.findMany({
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
  ])

  return NextResponse.json({ schools, requests })
}

// POST — créer une école directement (sans demande)
export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const { schoolName, schoolSlug, plan, address, city, country, phone, adminEmail, adminName, adminPassword } = await req.json()

  if (!schoolName || !schoolSlug || !adminEmail || !adminName || !adminPassword) {
    return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
  }
  if (adminPassword.length < 8) {
    return NextResponse.json({ error: "Mot de passe trop court (min. 8 car.)" }, { status: 400 })
  }

  const exists = await prisma.school.findUnique({ where: { slug: schoolSlug } })
  if (exists) {
    return NextResponse.json({ error: `Slug "${schoolSlug}" déjà utilisé` }, { status: 400 })
  }

  const hashed = await bcrypt.hash(adminPassword, 12)
  const school = await prisma.school.create({
    data: {
      name: schoolName, slug: schoolSlug, plan: plan ?? "FREE",
      isActive: true, settings: {},
      address: address || null, city: city || null,
      country: country || "DZ", phone: phone || null,
      users: {
        create: {
          email: adminEmail, password: hashed,
          fullName: adminName, role: "ADMIN", isActive: true,
          adminProfile: { create: {} },
        },
      },
    },
    include: { _count: { select: { users: true } } },
  })

  return NextResponse.json({ school }, { status: 201 })
}

// PATCH — toggle école OU approuver/rejeter demande
export async function PATCH(req: NextRequest) {
  if (!await requireSuperAdmin()) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const body = await req.json()

  // Toggle statut école
  if (body.type === "toggle") {
    const school = await prisma.school.update({
      where: { id: body.schoolId },
      data:  { isActive: body.isActive },
    })
    return NextResponse.json({ school })
  }

  // Approuver une demande
  if (body.type === "approve") {
    const request = await (prisma as any).schoolRequest.findUnique({ where: { id: body.requestId } })
    if (!request) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
    if (request.status !== "PENDING") return NextResponse.json({ error: "Déjà traitée" }, { status: 400 })

    // Générer un slug unique au format XX-AAAAA
    let slug = makeSlug()
    while (await prisma.school.findUnique({ where: { slug } })) {
      slug = makeSlug()
    }

    const total = request.classCount * request.studentsPerClass
    const plan  = autoPlan(total)

    const school = await prisma.school.create({
      data: {
        name: request.schoolName, slug, plan: plan as any, isActive: true, settings: {},
        users: {
          create: {
            email:    request.adminEmail,
            password: request.adminPassword,
            fullName: request.adminName,
            role:     "ADMIN",
            isActive: true,
            adminProfile: { create: {} },
          },
        },
      },
    })

    await (prisma as any).schoolRequest.update({
      where: { id: body.requestId },
      data:  { status: "APPROVED", slug, processedAt: new Date() },
    })

    console.log(`[TAHFIDZ] ✅ École approuvée : ${request.schoolName}`)
    console.log(`  → Slug    : ${slug}`)
    console.log(`  → Plan    : ${plan}`)
    console.log(`  → Admin   : ${request.adminEmail}`)
    console.log(`  → Login   : http://localhost:3000/login (slug: ${slug})`)

    return NextResponse.json({
      ok: true, slug, plan, schoolId: school.id,
      adminEmail: request.adminEmail,
      adminName:  request.adminName,
      schoolName: request.schoolName,
    })
  }

  // Rejeter une demande
  if (body.type === "reject") {
    await (prisma as any).schoolRequest.update({
      where: { id: body.requestId },
      data:  { status: "REJECTED", rejectionReason: body.reason ?? null, processedAt: new Date() },
    })
    console.log(`[TAHFIDZ] ❌ Demande rejetée : ${body.requestId}`)
    return NextResponse.json({ ok: true })
  }

  // Mettre à jour les infos d'une école + son admin
  if (body.type === "update-school") {
    const { schoolId, schoolName, plan, address, city, country, phone, adminId, adminName, adminEmail, adminPassword } = body

    // Vérifier unicité email si changé
    if (adminEmail && adminId) {
      const conflict = await prisma.user.findFirst({
        where: { email: adminEmail, schoolId, NOT: { id: adminId } },
      })
      if (conflict) return NextResponse.json({ error: "Cet email est déjà utilisé dans cette école" }, { status: 409 })
    }

    // Mettre à jour l'école
    await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(schoolName          ? { name: schoolName }         : {}),
        ...(plan                ? { plan }                     : {}),
        address: address || null,
        city:    city    || null,
        country: country || "DZ",
        phone:   phone   || null,
      },
    })

    // Mettre à jour l'admin
    if (adminId) {
      const userData: Record<string, unknown> = {}
      if (adminName)     userData.fullName = adminName
      if (adminEmail)    userData.email    = adminEmail
      if (adminPassword) userData.password = await bcrypt.hash(adminPassword, 12)
      if (Object.keys(userData).length > 0) {
        await prisma.user.update({ where: { id: adminId }, data: userData })
      }
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}

// DELETE — supprimer demande(s) ou école entière
export async function DELETE(req: NextRequest) {
  if (!await requireSuperAdmin()) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const id   = searchParams.get("id")

  // Vider tout l'historique (APPROVED + REJECTED)
  if (type === "history") {
    const result = await (prisma as any).schoolRequest.deleteMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
    }).catch(() => ({ count: 0 }))
    return NextResponse.json({ ok: true, deleted: result.count })
  }

  // Supprimer une demande individuelle
  if (type === "request" && id) {
    await (prisma as any).schoolRequest.delete({ where: { id } }).catch(() => {})
    return NextResponse.json({ ok: true })
  }

  // Supprimer une école complète (cascade users via Prisma)
  if (type === "school" && id) {
    const school = await prisma.school.findUnique({ where: { id } })
    if (!school) return NextResponse.json({ error: "École introuvable" }, { status: 404 })
    if (school.slug === "platform") return NextResponse.json({ error: "Impossible de supprimer l'école plateforme" }, { status: 403 })

    // Supprimer les profils liés avant les users (contraintes FK)
    await prisma.$transaction([
      prisma.admin.deleteMany({   where: { user: { schoolId: id } } }),
      prisma.teacher.deleteMany({ where: { user: { schoolId: id } } }),
      prisma.student.deleteMany({ where: { user: { schoolId: id } } }),
      prisma.parent.deleteMany({  where: { user: { schoolId: id } } }),
      prisma.user.deleteMany({    where: { schoolId: id } }),
      prisma.school.delete({      where: { id } }),
    ])

    console.log(`[TAHFIDZ] 🗑️ École supprimée : ${school.name} (${school.slug})`)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
}
