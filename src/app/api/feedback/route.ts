// src/app/api/feedback/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/* ─── POST : Créer un feedback ─────────────────────────────────── */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const type = (formData.get("type") as string) || "BUG"
    const category = (formData.get("category") as string) || "GENERAL"
    const title = (formData.get("title") as string) || ""
    const message = (formData.get("message") as string) || ""
    const screenshotFile = formData.get("screenshot") as File | null

    if (!title.trim() || !message.trim()) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    let screenshotUrl: string | null = null

    // Upload screenshot si présent (max 5Mo)
    if (screenshotFile && screenshotFile.size > 0) {
      if (screenshotFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 })
      }
      // Convertir en base64 pour stockage simple
      const bytes = await screenshotFile.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      const mime = screenshotFile.type || "image/png"
      screenshotUrl = `data:${mime};base64,${base64}`
    }

    // Vérifier que schoolId existe
    const schoolId = session.user.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: "No school associated with user" }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        schoolId: schoolId,
        userId: session.user.id,
        type: type as any,
        category,
        title: title.trim(),
        message: message.trim(),
        screenshot: screenshotUrl,
        status: "PENDING",
        priority: "LOW",
      },
      include: {
        user: { select: { fullName: true, email: true, role: true, phone: true } },
        school: { select: { name: true, slug: true } },
      },
    })

    return NextResponse.json({ success: true, feedback })

  } catch (error: any) {
    console.error("Feedback POST error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create feedback" },
      { status: 500 }
    )
  }
}

/* ─── GET : Lister les feedbacks ───────────────────────────────── */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const type = searchParams.get("type")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}

    // SuperAdmin voit tout, autres rôles voient leur école
    if (session.user.role !== "SUPERADMIN") {
      where.schoolId = session.user.schoolId
    }

    if (status && status !== "ALL") where.status = status
    if (priority && priority !== "ALL") where.priority = priority
    if (type && type !== "ALL") where.type = type

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          user: { select: { fullName: true, email: true, role: true, phone: true } },
          school: { select: { name: true, slug: true } },
        },
      }),
      prisma.feedback.count({ where }),
    ])

    return NextResponse.json({
      feedbacks,
      total,
      limit,
      offset,
      hasMore: offset + feedbacks.length < total,
    })

  } catch (error: any) {
    console.error("Feedback GET error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch feedbacks" },
      { status: 500 }
    )
  }
}

/* ─── PATCH : Mettre à jour le statut / priorité / note admin ──── */
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id, status, priority, adminNote } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === "RESOLVED") updateData.resolvedAt = new Date()
    }
    if (priority) updateData.priority = priority
    if (adminNote !== undefined) updateData.adminNote = adminNote

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { fullName: true, email: true, role: true, phone: true } },
        school: { select: { name: true, slug: true } },
      },
    })

    return NextResponse.json({ success: true, feedback })

  } catch (error: any) {
    console.error("Feedback PATCH error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update feedback" },
      { status: 500 }
    )
  }
}

/* ─── DELETE : Supprimer un feedback ───────────────────────────── */
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    await prisma.feedback.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Feedback deleted" })

  } catch (error: any) {
    console.error("Feedback DELETE error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete feedback" },
      { status: 500 }
    )
  }
}