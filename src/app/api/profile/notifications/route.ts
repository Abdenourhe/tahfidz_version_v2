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
    select: {
      messageNotifications: true,
      evaluationNotifications: true,
      attendanceNotifications: true,
      presenceNotifications: true,
      soundEnabled: true,
      notificationPrefs: true,
    },
  })

  // Merge defaults with stored prefs for AdminSettingsClient compatibility
  const defaults = {
    studentAdded: true, absence: true, memorization: true, evaluation: true,
    examReminder: true, parentLink: true, transfer: true, message: true, badge: false, weeklyReport: false,
  }
  const stored = (user?.notificationPrefs as Record<string, boolean>) || {}

  return NextResponse.json({
    messageNotifications: user?.messageNotifications ?? true,
    evaluationNotifications: user?.evaluationNotifications ?? true,
    attendanceNotifications: user?.attendanceNotifications ?? true,
    presenceNotifications: user?.presenceNotifications ?? true,
    soundEnabled: user?.soundEnabled ?? true,
    prefs: { ...defaults, ...stored },
  })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const updateData: any = {}

  // Direct Prisma fields (used by NotificationSettings.tsx)
  if ("messageNotifications" in body) updateData.messageNotifications = body.messageNotifications
  if ("evaluationNotifications" in body) updateData.evaluationNotifications = body.evaluationNotifications
  if ("attendanceNotifications" in body) updateData.attendanceNotifications = body.attendanceNotifications
  if ("presenceNotifications" in body) updateData.presenceNotifications = body.presenceNotifications
  if ("soundEnabled" in body) updateData.soundEnabled = body.soundEnabled

  // JSON prefs (used by AdminSettingsClient.tsx)
  if ("prefs" in body) {
    updateData.notificationPrefs = body.prefs
    // Sync JSON prefs with direct Prisma fields for attendance
    if ("absence" in body.prefs) updateData.attendanceNotifications = body.prefs.absence
    if ("presence" in body.prefs) updateData.presenceNotifications = body.prefs.presence
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  })

  return NextResponse.json({ success: true })
}
