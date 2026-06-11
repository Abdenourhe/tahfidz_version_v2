// src/app/api/profile/notifications/route.ts
// GET / PATCH user notification preferences

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  })

  // Merge defaults with stored prefs
  const defaults = {
    studentAdded: true, absence: true, memorization: true, evaluation: true,
    examReminder: true, parentLink: true, transfer: true, message: true, badge: false, weeklyReport: false,
  }
  const stored = (user?.notificationPrefs as Record<string, boolean>) || {}
  return NextResponse.json({ prefs: { ...defaults, ...stored } })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const { prefs } = body as { prefs: Record<string, boolean> }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPrefs: prefs },
  })

  return NextResponse.json({ success: true })
}
