// src/lib/badges.ts
// Vérification et attribution automatique des badges

import { prisma } from "@/lib/prisma"
import { sendBadgeEarnedEmail } from "@/lib/email"

export async function checkAndAwardBadges(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { id: true, email: true, fullName: true, schoolId: true } },
      studentBadges: { select: { badgeId: true } },
      _count: {
        select: {
          memorizedSurahs: true,
          studentBadges: true,
        },
      },
      attendances: {
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { status: true },
      },
    },
  })

  if (!student) return

  const earnedBadgeIds = new Set(student.studentBadges.map(sb => sb.badgeId))
  const allBadges = await prisma.badge.findMany()

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue

    let earned = false
    let earnedValue = 0

    switch (badge.criteriaType) {
      case "surah_count":
        if (student._count.memorizedSurahs >= badge.criteriaValue) {
          earned = true
          earnedValue = student._count.memorizedSurahs
        }
        break

      case "total_stars":
        if (student.totalStars >= badge.criteriaValue) {
          earned = true
          earnedValue = student.totalStars
        }
        break

      case "streak_days":
        if (student.currentStreak >= badge.criteriaValue) {
          earned = true
          earnedValue = student.currentStreak
        }
        break

      case "attendance": {
        const total = student.attendances.length
        const present = student.attendances.filter(
          a => a.status === "PRESENT" || a.status === "LATE"
        ).length
        const rate = total > 0 ? Math.round((present / total) * 100) : 0
        if (rate >= badge.criteriaValue) {
          earned = true
          earnedValue = rate
        }
        break
      }

      case "perfect_score": {
        const perfectEval = await prisma.evaluation.findFirst({
          where: { studentId, finalScore: { gte: badge.criteriaValue } },
        })
        if (perfectEval) {
          earned = true
          earnedValue = perfectEval.finalScore
        }
        break
      }

      case "juz_complete": {
        const juzSurahs = await prisma.surah.findMany({
          where: { juzNumber: badge.criteriaValue },
          select: { id: true },
        })
        const memorizedInJuz = await prisma.memorizationProgress.count({
          where: {
            studentId,
            status: "MEMORIZED",
            surahId: { in: juzSurahs.map(s => s.id) },
          },
        })
        if (memorizedInJuz >= juzSurahs.length) {
          earned = true
          earnedValue = badge.criteriaValue
        }
        break
      }
    }

    if (earned) {
      // Attribuer le badge
      await prisma.studentBadge.create({
        data: {
          studentId,
          badgeId: badge.id,
          earnedValue,
        },
      })

      // Notification in-app
      await prisma.notification.create({
        data: {
          schoolId: student.user.schoolId,
          userId: student.user.id,
          type: "achievement",
          title: `Nouveau badge : ${badge.name} ${badge.icon}`,
          titleAr: `وسام جديد: ${badge.nameAr} ${badge.icon}`,
          message: badge.description,
          messageAr: badge.descriptionAr,
          data: { badgeId: badge.id, url: "/student/badges" },
        },
      })

      // Email
      try {
        await sendBadgeEarnedEmail({
          to: student.user.email,
          fullName: student.user.fullName,
          badgeName: badge.name,
          badgeNameAr: badge.nameAr,
          badgeIcon: badge.icon,
          badgeRarity: badge.rarity,
          locale: "fr",
        })
      } catch (e) {
        console.error("Badge email error:", e)
      }
    }
  }
}
