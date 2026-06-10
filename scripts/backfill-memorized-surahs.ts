/**
 * Script de rattrapage : crée les entrées MemorizedSurah manquantes
 * pour les évaluations APPROVED et les progressions MEMORIZED existantes.
 *
 * Usage : npx tsx scripts/backfill-memorized-surahs.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Recherche des entrées MemorizedSurah manquantes...")

  // ── 1. Évaluations APPROVED sans memorizedSurah ──
  const approvedEvals = await prisma.evaluation.findMany({
    where: { decision: "APPROVED" },
    include: {
      progress: { select: { id: true, surahId: true, endVerse: true, studentId: true } },
      student: { select: { id: true } },
    },
  })

  let createdFromEvals = 0
  for (const ev of approvedEvals) {
    if (!ev.progress) continue
    const exists = await prisma.memorizedSurah.findUnique({
      where: { progressId: ev.progress.id },
    })
    if (!exists) {
      await prisma.memorizedSurah.create({
        data: {
          studentId: ev.student.id,
          surahId: ev.progress.surahId,
          progressId: ev.progress.id,
          versesMemorized: ev.progress.endVerse ?? 0,
          finalScore: ev.finalScore,
          teacherNotes: ev.teacherNotes,
          starsEarned: Math.round((ev.finalScore ?? 0) / 20), // approximation
        },
      })
      createdFromEvals++
      console.log(`  ✓ Évaluation ${ev.id} → MemorizedSurah créée`)
    }
  }

  // ── 2. Progressions MEMORIZED sans memorizedSurah ──
  const memorizedProgress = await prisma.memorizationProgress.findMany({
    where: { status: "MEMORIZED" },
    select: {
      id: true,
      studentId: true,
      surahId: true,
      endVerse: true,
      completedAt: true,
    },
  })

  let createdFromProgress = 0
  for (const prog of memorizedProgress) {
    const exists = await prisma.memorizedSurah.findUnique({
      where: { progressId: prog.id },
    })
    if (!exists) {
      await prisma.memorizedSurah.create({
        data: {
          studentId: prog.studentId,
          surahId: prog.surahId,
          progressId: prog.id,
          versesMemorized: prog.endVerse ?? 0,
          completionDate: prog.completedAt ?? new Date(),
          starsEarned: 10,
        },
      })
      createdFromProgress++
      console.log(`  ✓ Progression ${prog.id} → MemorizedSurah créée`)
    }
  }

  console.log("\n📊 Résumé :")
  console.log(`  Créées depuis évaluations APPROVED : ${createdFromEvals}`)
  console.log(`  Créées depuis progressions MEMORIZED : ${createdFromProgress}`)
  console.log(`  Total : ${createdFromEvals + createdFromProgress}`)
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
