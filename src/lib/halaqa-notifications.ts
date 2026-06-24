// src/lib/halaqa-notifications.ts
// Helper de notifications in-app pour le module Halaqa Online

import { prisma } from "@/lib/prisma"
import { HalaqaSession } from "@prisma/client"

export type HalaqaNotificationType =
  | "halaqa_scheduled"
  | "halaqa_live"
  | "halaqa_ended"
  | "halaqa_recording"
  | "halaqa_cancelled"
  | "halaqa_updated"

interface NotificationPayload {
  title: string
  titleAr: string
  message: string
  messageAr: string
}

const MESSAGES: Record<HalaqaNotificationType, (session: HalaqaSession) => NotificationPayload> = {
  halaqa_scheduled: (session) => ({
    title: "Nouvelle Halaqa Online planifiée",
    titleAr: "حلقة أونلاين جديدة مجدولة",
    message: `La séance "${session.meetingName}" est planifiée le ${formatDate(session.scheduledAt)}.`,
    messageAr: `الجلسة "${session.meetingName}" مجدولة في ${formatDate(session.scheduledAt)}.`,
  }),
  halaqa_live: (session) => ({
    title: "Halaqa Online en direct",
    titleAr: "حلقة أونلاين مباشرة",
    message: `La séance "${session.meetingName}" vient de démarrer. Rejoignez maintenant !`,
    messageAr: `الجلسة "${session.meetingName}" بدأت للتو. انضم الآن!`,
  }),
  halaqa_ended: (session) => ({
    title: "Halaqa Online terminée",
    titleAr: "انتهت حلقة أونلاين",
    message: `La séance "${session.meetingName}" est terminée. L'enregistrement sera bientôt disponible.`,
    messageAr: `الجلسة "${session.meetingName}" انتهت. التسجيل سيكون متاحاً قريباً.`,
  }),
  halaqa_recording: (session) => ({
    title: "Enregistrement Halaqa disponible",
    titleAr: "تسجيل الحلقة متاح",
    message: `L'enregistrement de "${session.meetingName}" est maintenant disponible.`,
    messageAr: `تسجيل "${session.meetingName}" متاح الآن.`,
  }),
  halaqa_cancelled: (session) => ({
    title: "Halaqa Online annulée",
    titleAr: "حلقة أونلاين ملغاة",
    message: `La séance "${session.meetingName}" prévue le ${formatDate(session.scheduledAt)} a été annulée.`,
    messageAr: `الجلسة "${session.meetingName}" المقررة في ${formatDate(session.scheduledAt)} تم إلغاؤها.`,
  }),
  halaqa_updated: (session) => ({
    title: "Halaqa Online modifiée",
    titleAr: "حلقة أونلاين معدلة",
    message: `La séance "${session.meetingName}" prévue le ${formatDate(session.scheduledAt)} a été modifiée.`,
    messageAr: `الجلسة "${session.meetingName}" المقررة في ${formatDate(session.scheduledAt)} تم تعديلها.`,
  }),
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Crée des notifications in-app pour les élèves participants et leurs parents.
 * @param session Session Halaqa
 * @param type Type de notification
 * @param excludeUserIds IDs d'utilisateurs à exclure (ex: le créateur)
 */
export async function notifyHalaqaParticipants(
  session: HalaqaSession,
  type: HalaqaNotificationType,
  excludeUserIds: string[] = []
): Promise<void> {
  try {
    const payload = MESSAGES[type](session)

    // 1. Récupérer les parents des élèves participants
    // studentIds dans HalaqaSession sont des User.id (student.userId)
    const students = await prisma.student.findMany({
      where: { userId: { in: session.studentIds } },
      select: { id: true, userId: true },
    })

    const studentUserIds = students.map((s) => s.userId)
    const studentInternalIds = students.map((s) => s.id)

    const parentLinks = await prisma.parentStudentLink.findMany({
      where: { studentId: { in: studentInternalIds }, isVerified: true },
      select: { parent: { select: { userId: true } } },
    })

    const parentUserIds = parentLinks.map((l) => l.parent.userId)

    // 2. Construire la liste unique des destinataires
    const targetUserIds = [...new Set([...studentUserIds, ...parentUserIds])].filter(
      (id) => !excludeUserIds.includes(id)
    )

    if (targetUserIds.length === 0) return

    // 3. Créer les notifications
    await prisma.notification.createMany({
      data: targetUserIds.map((userId) => ({
        userId,
        schoolId: session.schoolId,
        type,
        title: payload.title,
        titleAr: payload.titleAr,
        message: payload.message,
        messageAr: payload.messageAr,
        data: { halaqaSessionId: session.id, meetingName: session.meetingName },
      })),
    })
  } catch (error: any) {
    // On ne fait pas échouer l'action principale si les notifications tombent en panne
    console.error("[HALAQA NOTIFICATION ERROR]", error?.message || String(error))
  }
}
