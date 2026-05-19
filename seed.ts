/**
 * TAHFIDZ SaaS — Seed de développement
 *
 * Crée deux écoles démo avec leurs données complètes :
 *   1. Madrassa Al-Nour  (plan PRO)
 *   2. Institut Al-Amin  (plan STARTER)
 *
 * npx prisma db seed
 */

import { PrismaClient, Role, Gender, Plan, SurahType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

const cid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Référentiel sourates (extrait des 10 premières) ────────────────────────

const SURAHS = [
  { number: 1,  nameAr: "الفاتحة",     nameFr: "Al-Fatiha",   totalVerses: 7,   type: SurahType.MECQUOISE },
  { number: 2,  nameAr: "البقرة",      nameFr: "Al-Baqara",   totalVerses: 286, type: SurahType.MEDINOISE },
  { number: 3,  nameAr: "آل عمران",    nameFr: "Al-Imran",    totalVerses: 200, type: SurahType.MEDINOISE },
  { number: 78, nameAr: "النبأ",       nameFr: "An-Naba",     totalVerses: 40,  type: SurahType.MECQUOISE },
  { number: 93, nameAr: "الضحى",       nameFr: "Ad-Duha",     totalVerses: 11,  type: SurahType.MECQUOISE },
  { number: 94, nameAr: "الشرح",       nameFr: "Al-Inshirah", totalVerses: 8,   type: SurahType.MECQUOISE },
  { number: 112,nameAr: "الإخلاص",     nameFr: "Al-Ikhlas",   totalVerses: 4,   type: SurahType.MECQUOISE },
  { number: 113,nameAr: "الفلق",       nameFr: "Al-Falaq",    totalVerses: 5,   type: SurahType.MECQUOISE },
  { number: 114,nameAr: "الناس",       nameFr: "An-Nas",      totalVerses: 6,   type: SurahType.MECQUOISE },
];

// ─── Seed d'une école complète ───────────────────────────────────────────────

async function seedSchool(opts: {
  name: string;
  slug: string;
  plan: Plan;
  adminEmail: string;
}) {
  console.log(`\n🏫  Création de « ${opts.name} »…`);

  // 1. École
  const school = await prisma.school.create({
    data: {
      name: opts.name,
      slug: opts.slug,
      plan: opts.plan,
      settings: { locale: "fr-MA", timezone: "Africa/Casablanca", currency: "MAD" },
    },
  });

  // 2. Administrateur
  const adminUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: opts.adminEmail,
      hashedPassword: hash("Admin@1234"),
      role: Role.SCHOOL_ADMIN,
    },
  });

  // 3. Enseignants (2)
  const teacherUsers = await Promise.all(
    ["ustadh.ahmad", "ustadha.fatima"].map((prefix, i) =>
      prisma.user.create({
        data: {
          schoolId: school.id,
          email: `${prefix}@${opts.slug}.tahfidz.app`,
          hashedPassword: hash("Teacher@1234"),
          role: Role.TEACHER,
        },
      })
    )
  );

  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        schoolId: school.id,
        userId: teacherUsers[0].id,
        fullName: "Ahmad Al-Qari",
        speciality: "Hafs ʿan ʿĀṣim",
        hireDate: daysAgo(365),
      },
    }),
    prisma.teacher.create({
      data: {
        schoolId: school.id,
        userId: teacherUsers[1].id,
        fullName: "Fatima Az-Zahraa",
        speciality: "Warsh ʿan Nāfiʿ",
        hireDate: daysAgo(180),
      },
    }),
  ]);

  // 4. Classe
  const classe = await prisma.class.create({
    data: {
      schoolId: school.id,
      teacherId: teachers[0].id,
      name: "Juz Amma — Débutants",
      level: "Niveau 1",
      capacity: 20,
      academicYear: "2024-2025",
    },
  });

  // 5. Élèves (5) + inscriptions
  const studentNames = [
    { full: "Youssef Benali",   gender: Gender.MALE },
    { full: "Khadija Moussaoui",gender: Gender.FEMALE },
    { full: "Ibrahim Tazi",     gender: Gender.MALE },
    { full: "Maryam Alaoui",    gender: Gender.FEMALE },
    { full: "Omar Chraibi",     gender: Gender.MALE },
  ];

  const students = await Promise.all(
    studentNames.map(async (s, i) => {
      const user = await prisma.user.create({
        data: {
          schoolId: school.id,
          email: `${s.full.toLowerCase().replace(/\s+/g, ".")}@${opts.slug}.tahfidz.app`,
          hashedPassword: hash("Student@1234"),
          role: Role.STUDENT,
        },
      });
      const student = await prisma.student.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          fullName: s.full,
          gender: s.gender,
          birthDate: new Date(`${2010 + i}-03-15`),
          guardianPhone: `+2126${60000000 + i}`,
          status: "ACTIVE",
        },
      });
      await prisma.enrollment.create({
        data: { studentId: student.id, classId: classe.id, status: "ACTIVE" },
      });
      return student;
    })
  );

  // 6. Enregistrements de mémorisation
  const memData = [
    { studentIdx: 0, surahNum: 114, from: 1, to: 6,  grade: 95, status: "PASSED" },
    { studentIdx: 0, surahNum: 113, from: 1, to: 5,  grade: 88, status: "PASSED" },
    { studentIdx: 1, surahNum: 114, from: 1, to: 6,  grade: 72, status: "NEEDS_REVIEW" },
    { studentIdx: 2, surahNum: 112, from: 1, to: 4,  grade: 100,status: "PASSED" },
    { studentIdx: 3, surahNum: 94,  from: 1, to: 8,  grade: 85, status: "PASSED" },
    { studentIdx: 4, surahNum: 93,  from: 1, to: 11, grade: 60, status: "NEEDS_REVIEW" },
  ] as const;

  await prisma.memorizationRecord.createMany({
    data: memData.map((m) => ({
      schoolId:    school.id,
      studentId:   students[m.studentIdx].id,
      teacherId:   teachers[0].id,
      surahNumber: m.surahNum,
      fromVerse:   m.from,
      toVerse:     m.to,
      grade:       m.grade,
      status:      m.status,
      recordedAt:  daysAgo(Math.floor(Math.random() * 30)),
    })),
  });

  // 7. Présences (7 derniers jours)
  const attendanceStatuses = ["PRESENT", "PRESENT", "PRESENT", "ABSENT", "LATE"] as const;
  for (let day = 6; day >= 0; day--) {
    const date = daysAgo(day);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekend
    await prisma.attendance.createMany({
      data: students.map((s, i) => ({
        schoolId:  school.id,
        studentId: s.id,
        classId:   classe.id,
        date,
        status: attendanceStatuses[i % attendanceStatuses.length],
      })),
    });
  }

  // 8. Frais + paiements
  const fee = await prisma.fee.create({
    data: {
      schoolId: school.id,
      label:    "Frais de scolarité mensuel",
      amount:   200,
      currency: "MAD",
      period:   "MONTHLY",
    },
  });

  await prisma.payment.createMany({
    data: students.slice(0, 3).map((s) => ({
      schoolId:   school.id,
      studentId:  s.id,
      feeId:      fee.id,
      amountPaid: 200,
      currency:   "MAD",
      method:     "CASH",
      status:     "CONFIRMED",
      paidAt:     daysAgo(5),
    })),
  });

  // 9. Notifications
  await prisma.notification.createMany({
    data: students.slice(0, 2).map((s) => ({
      schoolId:    school.id,
      senderId:    adminUser.id,
      recipientId: teacherUsers[0].id,
      type:        "ABSENCE_ALERT",
      title:       "Absence signalée",
      content:     `L'élève ${s.fullName} est absent(e) aujourd'hui.`,
    })),
  });

  console.log(`   ✅  ${opts.name} — ${students.length} élèves, ${teachers.length} enseignants`);
  return school;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  TAHFIDZ SaaS — Démarrage du seed…\n");

  // Référentiel sourates (global, upsert idempotent)
  await prisma.surahRef.createMany({ data: SURAHS, skipDuplicates: true });
  console.log(`📖  ${SURAHS.length} sourates de référence insérées`);

  await seedSchool({
    name: "Madrassa Al-Nour",
    slug: "al-nour",
    plan: Plan.PRO,
    adminEmail: "admin@al-nour.tahfidz.app",
  });

  await seedSchool({
    name: "Institut Al-Amin",
    slug: "al-amin",
    plan: Plan.STARTER,
    adminEmail: "admin@al-amin.tahfidz.app",
  });

  console.log("\n🎉  Seed terminé avec succès !");
  console.log("\n📋  Comptes de test :");
  console.log("   Admin Al-Nour   → admin@al-nour.tahfidz.app  / Admin@1234");
  console.log("   Admin Al-Amin   → admin@al-amin.tahfidz.app  / Admin@1234");
  console.log("   Enseignant      → ustadh.ahmad@al-nour.tahfidz.app / Teacher@1234");
}

main()
  .catch((e) => {
    console.error("❌  Erreur seed :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
