// prisma/seed.ts — TAHFIDZ
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { seedSiteConfig } from "./seed-site-config"

const prisma = new PrismaClient()

const SURAHS = [
  { id: 1,   nameAr: "الفاتحة",     nameFr: "Al-Fatiha",       nameEn: "The Opening",         verseCount: 7,   juzNumber: 1,  revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 1 },
  { id: 2,   nameAr: "البقرة",      nameFr: "Al-Baqara",       nameEn: "The Cow",              verseCount: 286, juzNumber: 1,  revelationType: "medinan", difficultyLevel: 5, orderInMushaf: 2 },
  { id: 3,   nameAr: "آل عمران",    nameFr: "Al-Imran",        nameEn: "Family of Imran",      verseCount: 200, juzNumber: 3,  revelationType: "medinan", difficultyLevel: 5, orderInMushaf: 3 },
  { id: 4,   nameAr: "النساء",      nameFr: "An-Nisa",         nameEn: "The Women",            verseCount: 176, juzNumber: 4,  revelationType: "medinan", difficultyLevel: 5, orderInMushaf: 4 },
  { id: 5,   nameAr: "المائدة",     nameFr: "Al-Maida",        nameEn: "The Table Spread",     verseCount: 120, juzNumber: 6,  revelationType: "medinan", difficultyLevel: 4, orderInMushaf: 5 },
  { id: 6,   nameAr: "الأنعام",     nameFr: "Al-Anam",         nameEn: "The Cattle",           verseCount: 165, juzNumber: 7,  revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 6 },
  { id: 7,   nameAr: "الأعراف",     nameFr: "Al-Araf",         nameEn: "The Heights",          verseCount: 206, juzNumber: 8,  revelationType: "meccan",  difficultyLevel: 5, orderInMushaf: 7 },
  { id: 8,   nameAr: "الأنفال",     nameFr: "Al-Anfal",        nameEn: "The Spoils of War",    verseCount: 75,  juzNumber: 9,  revelationType: "medinan", difficultyLevel: 4, orderInMushaf: 8 },
  { id: 9,   nameAr: "التوبة",      nameFr: "At-Tawba",        nameEn: "The Repentance",       verseCount: 129, juzNumber: 10, revelationType: "medinan", difficultyLevel: 5, orderInMushaf: 9 },
  { id: 10,  nameAr: "يونس",        nameFr: "Yunus",           nameEn: "Jonah",                verseCount: 109, juzNumber: 11, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 10 },
  { id: 11,  nameAr: "هود",         nameFr: "Hud",             nameEn: "Hud",                  verseCount: 123, juzNumber: 11, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 11 },
  { id: 12,  nameAr: "يوسف",        nameFr: "Yusuf",           nameEn: "Joseph",               verseCount: 111, juzNumber: 12, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 12 },
  { id: 13,  nameAr: "الرعد",       nameFr: "Ar-Rad",          nameEn: "The Thunder",          verseCount: 43,  juzNumber: 13, revelationType: "medinan", difficultyLevel: 3, orderInMushaf: 13 },
  { id: 14,  nameAr: "إبراهيم",     nameFr: "Ibrahim",         nameEn: "Abraham",              verseCount: 52,  juzNumber: 13, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 14 },
  { id: 15,  nameAr: "الحجر",       nameFr: "Al-Hijr",         nameEn: "The Rocky Tract",      verseCount: 99,  juzNumber: 14, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 15 },
  { id: 16,  nameAr: "النحل",       nameFr: "An-Nahl",         nameEn: "The Bee",              verseCount: 128, juzNumber: 14, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 16 },
  { id: 17,  nameAr: "الإسراء",     nameFr: "Al-Isra",         nameEn: "The Night Journey",    verseCount: 111, juzNumber: 15, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 17 },
  { id: 18,  nameAr: "الكهف",       nameFr: "Al-Kahf",         nameEn: "The Cave",             verseCount: 110, juzNumber: 15, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 18 },
  { id: 19,  nameAr: "مريم",        nameFr: "Maryam",          nameEn: "Mary",                 verseCount: 98,  juzNumber: 16, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 19 },
  { id: 20,  nameAr: "طه",          nameFr: "Ta-Ha",           nameEn: "Ta-Ha",                verseCount: 135, juzNumber: 16, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 20 },
  { id: 21,  nameAr: "الأنبياء",    nameFr: "Al-Anbiya",       nameEn: "The Prophets",         verseCount: 112, juzNumber: 17, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 21 },
  { id: 22,  nameAr: "الحج",        nameFr: "Al-Hajj",         nameEn: "The Pilgrimage",       verseCount: 78,  juzNumber: 17, revelationType: "medinan", difficultyLevel: 3, orderInMushaf: 22 },
  { id: 23,  nameAr: "المؤمنون",    nameFr: "Al-Muminun",      nameEn: "The Believers",        verseCount: 118, juzNumber: 18, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 23 },
  { id: 24,  nameAr: "النور",       nameFr: "An-Nur",          nameEn: "The Light",            verseCount: 64,  juzNumber: 18, revelationType: "medinan", difficultyLevel: 3, orderInMushaf: 24 },
  { id: 25,  nameAr: "الفرقان",     nameFr: "Al-Furqan",       nameEn: "The Criterion",        verseCount: 77,  juzNumber: 18, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 25 },
  { id: 26,  nameAr: "الشعراء",     nameFr: "Ash-Shuara",      nameEn: "The Poets",            verseCount: 227, juzNumber: 19, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 26 },
  { id: 27,  nameAr: "النمل",       nameFr: "An-Naml",         nameEn: "The Ant",              verseCount: 93,  juzNumber: 19, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 27 },
  { id: 28,  nameAr: "القصص",       nameFr: "Al-Qasas",        nameEn: "The Stories",          verseCount: 88,  juzNumber: 20, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 28 },
  { id: 29,  nameAr: "العنكبوت",    nameFr: "Al-Ankabut",      nameEn: "The Spider",           verseCount: 69,  juzNumber: 20, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 29 },
  { id: 30,  nameAr: "الروم",       nameFr: "Ar-Rum",          nameEn: "The Romans",           verseCount: 60,  juzNumber: 21, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 30 },
  { id: 31,  nameAr: "لقمان",       nameFr: "Luqman",          nameEn: "Luqman",               verseCount: 34,  juzNumber: 21, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 31 },
  { id: 32,  nameAr: "السجدة",      nameFr: "As-Sajda",        nameEn: "The Prostration",      verseCount: 30,  juzNumber: 21, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 32 },
  { id: 33,  nameAr: "الأحزاب",     nameFr: "Al-Ahzab",        nameEn: "The Clans",            verseCount: 73,  juzNumber: 21, revelationType: "medinan", difficultyLevel: 3, orderInMushaf: 33 },
  { id: 34,  nameAr: "سبأ",         nameFr: "Saba",            nameEn: "Sheba",                verseCount: 54,  juzNumber: 22, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 34 },
  { id: 35,  nameAr: "فاطر",        nameFr: "Fatir",           nameEn: "Originator",           verseCount: 45,  juzNumber: 22, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 35 },
  { id: 36,  nameAr: "يس",          nameFr: "Ya-Sin",          nameEn: "Ya Sin",               verseCount: 83,  juzNumber: 22, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 36 },
  { id: 37,  nameAr: "الصافات",     nameFr: "As-Saffat",       nameEn: "Those Ranged in Ranks",verseCount: 182, juzNumber: 23, revelationType: "meccan",  difficultyLevel: 4, orderInMushaf: 37 },
  { id: 38,  nameAr: "ص",           nameFr: "Sad",             nameEn: "The Letter Sad",       verseCount: 88,  juzNumber: 23, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 38 },
  { id: 39,  nameAr: "الزمر",       nameFr: "Az-Zumar",        nameEn: "The Troops",           verseCount: 75,  juzNumber: 23, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 39 },
  { id: 40,  nameAr: "غافر",        nameFr: "Ghafir",          nameEn: "The Forgiver",         verseCount: 85,  juzNumber: 24, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 40 },
  { id: 41,  nameAr: "فصلت",        nameFr: "Fussilat",        nameEn: "Explained in Detail",  verseCount: 54,  juzNumber: 24, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 41 },
  { id: 42,  nameAr: "الشورى",      nameFr: "Ash-Shura",       nameEn: "The Consultation",     verseCount: 53,  juzNumber: 25, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 42 },
  { id: 43,  nameAr: "الزخرف",      nameFr: "Az-Zukhruf",      nameEn: "The Gold Adornments",  verseCount: 89,  juzNumber: 25, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 43 },
  { id: 44,  nameAr: "الدخان",      nameFr: "Ad-Dukhan",       nameEn: "The Smoke",            verseCount: 59,  juzNumber: 25, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 44 },
  { id: 45,  nameAr: "الجاثية",     nameFr: "Al-Jathiya",      nameEn: "The Crouching",        verseCount: 37,  juzNumber: 25, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 45 },
  { id: 46,  nameAr: "الأحقاف",     nameFr: "Al-Ahqaf",        nameEn: "The Wind-Curved Sandhills", verseCount: 35, juzNumber: 26, revelationType: "meccan", difficultyLevel: 2, orderInMushaf: 46 },
  { id: 47,  nameAr: "محمد",        nameFr: "Muhammad",        nameEn: "Muhammad",             verseCount: 38,  juzNumber: 26, revelationType: "medinan", difficultyLevel: 2, orderInMushaf: 47 },
  { id: 48,  nameAr: "الفتح",       nameFr: "Al-Fath",         nameEn: "The Victory",          verseCount: 29,  juzNumber: 26, revelationType: "medinan", difficultyLevel: 2, orderInMushaf: 48 },
  { id: 49,  nameAr: "الحجرات",     nameFr: "Al-Hujurat",      nameEn: "The Rooms",            verseCount: 18,  juzNumber: 26, revelationType: "medinan", difficultyLevel: 2, orderInMushaf: 49 },
  { id: 50,  nameAr: "ق",           nameFr: "Qaf",             nameEn: "The Letter Qaf",       verseCount: 45,  juzNumber: 26, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 50 },
  { id: 51,  nameAr: "الذاريات",    nameFr: "Adh-Dhariyat",    nameEn: "The Winnowing Winds",  verseCount: 60,  juzNumber: 26, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 51 },
  { id: 52,  nameAr: "الطور",       nameFr: "At-Tur",          nameEn: "The Mount",            verseCount: 49,  juzNumber: 27, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 52 },
  { id: 53,  nameAr: "النجم",       nameFr: "An-Najm",         nameEn: "The Star",             verseCount: 62,  juzNumber: 27, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 53 },
  { id: 54,  nameAr: "القمر",       nameFr: "Al-Qamar",        nameEn: "The Moon",             verseCount: 55,  juzNumber: 27, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 54 },
  { id: 55,  nameAr: "الرحمن",      nameFr: "Ar-Rahman",       nameEn: "The Beneficent",       verseCount: 78,  juzNumber: 27, revelationType: "medinan", difficultyLevel: 2, orderInMushaf: 55 },
  { id: 56,  nameAr: "الواقعة",     nameFr: "Al-Waqi'a",       nameEn: "The Inevitable",       verseCount: 96,  juzNumber: 27, revelationType: "meccan",  difficultyLevel: 3, orderInMushaf: 56 },
  { id: 57,  nameAr: "الحديد",      nameFr: "Al-Hadid",        nameEn: "The Iron",             verseCount: 29,  juzNumber: 27, revelationType: "medinan", difficultyLevel: 2, orderInMushaf: 57 },
  { id: 58,  nameAr: "المجادلة",    nameFr: "Al-Mujadila",     nameEn: "The Pleading Woman",   verseCount: 22,  juzNumber: 28, revelationType: "medinan", difficultyLevel: 2, orderInMushaf: 58 },
  { id: 59,  nameAr: "الحشر",       nameFr: "Al-Hashr",        nameEn: "The Exile",            verseCount: 24,  juzNumber: 28, revelationType: "medinan", difficultyLevel: 2, orderInMushaf: 59 },
  { id: 60,  nameAr: "الممتحنة",    nameFr: "Al-Mumtahana",    nameEn: "She That Is to Be Examined", verseCount: 13, juzNumber: 28, revelationType: "medinan", difficultyLevel: 2, orderInMushaf: 60 },
  { id: 61,  nameAr: "الصف",        nameFr: "As-Saf",          nameEn: "The Ranks",            verseCount: 14,  juzNumber: 28, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 61 },
  { id: 62,  nameAr: "الجمعة",      nameFr: "Al-Jumu'a",       nameEn: "Friday",               verseCount: 11,  juzNumber: 28, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 62 },
  { id: 63,  nameAr: "المنافقون",   nameFr: "Al-Munafiqun",    nameEn: "The Hypocrites",       verseCount: 11,  juzNumber: 28, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 63 },
  { id: 64,  nameAr: "التغابن",     nameFr: "At-Taghabun",     nameEn: "The Mutual Disillusion",verseCount: 18, juzNumber: 28, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 64 },
  { id: 65,  nameAr: "الطلاق",      nameFr: "At-Talaq",        nameEn: "The Divorce",          verseCount: 12,  juzNumber: 28, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 65 },
  { id: 66,  nameAr: "التحريم",     nameFr: "At-Tahrim",       nameEn: "The Prohibition",      verseCount: 12,  juzNumber: 28, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 66 },
  { id: 67,  nameAr: "الملك",       nameFr: "Al-Mulk",         nameEn: "The Sovereignty",      verseCount: 30,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 67 },
  { id: 68,  nameAr: "القلم",       nameFr: "Al-Qalam",        nameEn: "The Pen",              verseCount: 52,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 68 },
  { id: 69,  nameAr: "الحاقة",      nameFr: "Al-Haqqa",        nameEn: "The Reality",          verseCount: 52,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 69 },
  { id: 70,  nameAr: "المعارج",     nameFr: "Al-Ma'arij",      nameEn: "The Ascending Stairways", verseCount: 44, juzNumber: 29, revelationType: "meccan", difficultyLevel: 2, orderInMushaf: 70 },
  { id: 71,  nameAr: "نوح",         nameFr: "Nuh",             nameEn: "Noah",                 verseCount: 28,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 71 },
  { id: 72,  nameAr: "الجن",        nameFr: "Al-Jinn",         nameEn: "The Jinn",             verseCount: 28,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 72 },
  { id: 73,  nameAr: "المزمل",      nameFr: "Al-Muzzammil",    nameEn: "The Enshrouded One",   verseCount: 20,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 73 },
  { id: 74,  nameAr: "المدثر",      nameFr: "Al-Muddaththir",  nameEn: "The Cloaked One",      verseCount: 56,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 74 },
  { id: 75,  nameAr: "القيامة",     nameFr: "Al-Qiyama",       nameEn: "The Resurrection",     verseCount: 40,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 75 },
  { id: 76,  nameAr: "الإنسان",     nameFr: "Al-Insan",        nameEn: "The Man",              verseCount: 31,  juzNumber: 29, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 76 },
  { id: 77,  nameAr: "المرسلات",    nameFr: "Al-Mursalat",     nameEn: "The Emissaries",       verseCount: 50,  juzNumber: 29, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 77 },
  { id: 78,  nameAr: "النبأ",       nameFr: "An-Naba",         nameEn: "The Tidings",          verseCount: 40,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 78 },
  { id: 79,  nameAr: "النازعات",    nameFr: "An-Naziat",       nameEn: "Those Who Drag Forth", verseCount: 46,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 2, orderInMushaf: 79 },
  { id: 80,  nameAr: "عبس",         nameFr: "Abasa",           nameEn: "He Frowned",           verseCount: 42,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 80 },
  { id: 81,  nameAr: "التكوير",     nameFr: "At-Takwir",       nameEn: "The Overthrowing",     verseCount: 29,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 81 },
  { id: 82,  nameAr: "الانفطار",    nameFr: "Al-Infitar",      nameEn: "The Cleaving",         verseCount: 19,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 82 },
  { id: 83,  nameAr: "المطففين",    nameFr: "Al-Mutaffifin",   nameEn: "The Defrauding",       verseCount: 36,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 83 },
  { id: 84,  nameAr: "الانشقاق",    nameFr: "Al-Inshiqaq",     nameEn: "The Sundering",        verseCount: 25,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 84 },
  { id: 85,  nameAr: "البروج",      nameFr: "Al-Buruj",        nameEn: "The Mansions of the Stars", verseCount: 22, juzNumber: 30, revelationType: "meccan", difficultyLevel: 1, orderInMushaf: 85 },
  { id: 86,  nameAr: "الطارق",      nameFr: "At-Tariq",        nameEn: "The Nightcomer",       verseCount: 17,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 86 },
  { id: 87,  nameAr: "الأعلى",      nameFr: "Al-Ala",          nameEn: "The Most High",        verseCount: 19,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 87 },
  { id: 88,  nameAr: "الغاشية",     nameFr: "Al-Ghashiya",     nameEn: "The Overwhelming",     verseCount: 26,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 88 },
  { id: 89,  nameAr: "الفجر",       nameFr: "Al-Fajr",         nameEn: "The Dawn",             verseCount: 30,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 89 },
  { id: 90,  nameAr: "البلد",       nameFr: "Al-Balad",        nameEn: "The City",             verseCount: 20,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 90 },
  { id: 91,  nameAr: "الشمس",       nameFr: "Ash-Shams",       nameEn: "The Sun",              verseCount: 15,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 91 },
  { id: 92,  nameAr: "الليل",       nameFr: "Al-Layl",         nameEn: "The Night",            verseCount: 21,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 92 },
  { id: 93,  nameAr: "الضحى",       nameFr: "Ad-Duha",         nameEn: "The Morning Hours",    verseCount: 11,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 93 },
  { id: 94,  nameAr: "الشرح",       nameFr: "Ash-Sharh",       nameEn: "The Relief",           verseCount: 8,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 94 },
  { id: 95,  nameAr: "التين",       nameFr: "At-Tin",          nameEn: "The Fig",              verseCount: 8,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 95 },
  { id: 96,  nameAr: "العلق",       nameFr: "Al-Alaq",         nameEn: "The Clot",             verseCount: 19,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 96 },
  { id: 97,  nameAr: "القدر",       nameFr: "Al-Qadr",         nameEn: "The Power",            verseCount: 5,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 97 },
  { id: 98,  nameAr: "البينة",      nameFr: "Al-Bayyina",      nameEn: "The Clear Proof",      verseCount: 8,   juzNumber: 30, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 98 },
  { id: 99,  nameAr: "الزلزلة",     nameFr: "Az-Zalzala",      nameEn: "The Earthquake",       verseCount: 8,   juzNumber: 30, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 99 },
  { id: 100, nameAr: "العاديات",    nameFr: "Al-Adiyat",       nameEn: "The Courser",          verseCount: 11,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 100 },
  { id: 101, nameAr: "القارعة",     nameFr: "Al-Qaria",        nameEn: "The Calamity",         verseCount: 11,  juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 101 },
  { id: 102, nameAr: "التكاثر",     nameFr: "At-Takathur",     nameEn: "The Rivalry in World Increase", verseCount: 8, juzNumber: 30, revelationType: "meccan", difficultyLevel: 1, orderInMushaf: 102 },
  { id: 103, nameAr: "العصر",       nameFr: "Al-Asr",          nameEn: "The Declining Day",    verseCount: 3,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 103 },
  { id: 104, nameAr: "الهمزة",      nameFr: "Al-Humaza",       nameEn: "The Traducer",         verseCount: 9,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 104 },
  { id: 105, nameAr: "الفيل",       nameFr: "Al-Fil",          nameEn: "The Elephant",         verseCount: 5,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 105 },
  { id: 106, nameAr: "قريش",        nameFr: "Quraysh",         nameEn: "Quraysh",              verseCount: 4,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 106 },
  { id: 107, nameAr: "الماعون",     nameFr: "Al-Maun",         nameEn: "The Small Kindnesses", verseCount: 7,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 107 },
  { id: 108, nameAr: "الكوثر",      nameFr: "Al-Kawthar",      nameEn: "The Abundance",        verseCount: 3,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 108 },
  { id: 109, nameAr: "الكافرون",    nameFr: "Al-Kafirun",      nameEn: "The Disbelievers",     verseCount: 6,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 109 },
  { id: 110, nameAr: "النصر",       nameFr: "An-Nasr",         nameEn: "The Divine Support",   verseCount: 3,   juzNumber: 30, revelationType: "medinan", difficultyLevel: 1, orderInMushaf: 110 },
  { id: 111, nameAr: "المسد",       nameFr: "Al-Masad",        nameEn: "The Palm Fibre",       verseCount: 5,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 111 },
  { id: 112, nameAr: "الإخلاص",     nameFr: "Al-Ikhlas",       nameEn: "The Sincerity",        verseCount: 4,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 112 },
  { id: 113, nameAr: "الفلق",       nameFr: "Al-Falaq",        nameEn: "The Daybreak",         verseCount: 5,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 113 },
  { id: 114, nameAr: "الناس",       nameFr: "An-Nas",          nameEn: "Mankind",              verseCount: 6,   juzNumber: 30, revelationType: "meccan",  difficultyLevel: 1, orderInMushaf: 114 },
]

async function main() {
  console.log("\n🌱 Seed TAHFIDZ...\n")

  // 0. École platform + SUPERADMIN
  const platform = await prisma.school.upsert({
    where:  { slug: "platform" },
    update: {},
    create: {
      name:     "TAHFIDZ Platform",
      slug:     "platform",
      plan:     "ENTERPRISE",
      isActive: true,
      settings: {},
    },
  })
  const superPwd = await bcrypt.hash("Admin@123456", 12)
  await prisma.user.upsert({
    where:  { schoolId_email: { schoolId: platform.id, email: "admin@tahfidz.com" } },
    update: {},
    create: {
      schoolId: platform.id,
      email:    "admin@tahfidz.com",
      password: superPwd,
      fullName: "Super Admin TAHFIDZ",
      role:     "SUPERADMIN",
      isActive: true,
      adminProfile: { create: {} },
    },
  })
  console.log("✅ Super Admin (platform)")

    // 1. École de démo
  const school = await prisma.school.upsert({
    where:  { slug: "tahfidz-demo" },
    update: {},
    create: {
      name:     "TAHFIDZ - École Démo",
      nameAr:   "تحفيظ - المدرسة التجريبية",
      slug:     "tahfidz-demo",
      plan:     "PRO",
      isActive: true,
      settings: {},
    },
  })
  console.log(`✅ École : ${school.name}`)

  // 2. 114 Sourates
  for (const s of SURAHS) {
    await prisma.surah.upsert({ where: { id: s.id }, update: s, create: s })
  }
  console.log("✅ 114 sourates")

  // 3. Admin
  const adminPwd  = await bcrypt.hash("Admin@123456", 12)
  const adminUser = await prisma.user.upsert({
    where:  { schoolId_email: { schoolId: school.id, email: "admin@tahfidz.com" } },
    update: {},
    create: {
      schoolId: school.id,
      email:    "admin@tahfidz.com",
      password: adminPwd,
      fullName: "Directeur TAHFIDZ",
      role:     "ADMIN",
      isActive: true,
      adminProfile: { create: {} },
    },
  })
  console.log("✅ Admin")

  // 4. Enseignants
  const teacherPwd = await bcrypt.hash("Teacher@123456", 12)
  const t1User = await prisma.user.upsert({
    where:  { schoolId_email: { schoolId: school.id, email: "teacher1@tahfidz.com" } },
    update: {},
    create: {
      schoolId: school.id,
      email:    "teacher1@tahfidz.com",
      password: teacherPwd,
      fullName: "Sheikh Karim Boudiaf",
      role:     "TEACHER",
      isActive: true,
      teacherProfile: { create: { specialization: "Hafs Asim", maxStudents: 20 } },
    },
  })
  const t2User = await prisma.user.upsert({
    where:  { schoolId_email: { schoolId: school.id, email: "teacher2@tahfidz.com" } },
    update: {},
    create: {
      schoolId: school.id,
      email:    "teacher2@tahfidz.com",
      password: teacherPwd,
      fullName: "Sheikh Yassine Hamdi",
      role:     "TEACHER",
      isActive: true,
      teacherProfile: { create: { specialization: "Warsh Nafi", maxStudents: 20 } },
    },
  })
  console.log("✅ 2 enseignants")

  const teacher1 = await prisma.teacher.findUnique({ where: { userId: t1User.id } })
  const teacher2 = await prisma.teacher.findUnique({ where: { userId: t2User.id } })

  // 5. Groupes
  const g1 = await prisma.group.upsert({
    where:  { id: "group-tahfidz-avances" },
    update: {},
    create: {
      id:          "group-tahfidz-avances",
      schoolId:    school.id,
      name:        "Groupe Avancés",
      nameAr:      "مجموعة المتقدمين",
      teacherId:   teacher1!.id,
      level:       "advanced",
      maxCapacity: 15,
      schedule:    { monday: "08:00-10:00", wednesday: "08:00-10:00", friday: "08:00-10:00" },
    },
  })
  const g2 = await prisma.group.upsert({
    where:  { id: "group-tahfidz-debutants" },
    update: {},
    create: {
      id:          "group-tahfidz-debutants",
      schoolId:    school.id,
      name:        "Groupe Débutants",
      nameAr:      "مجموعة المبتدئين",
      teacherId:   teacher2!.id,
      level:       "beginner",
      maxCapacity: 15,
      schedule:    { tuesday: "17:00-19:00", thursday: "17:00-19:00", sunday: "10:00-12:00" },
    },
  })
  console.log("✅ 2 groupes")

  // 6. Élèves
  const studentPwd = await bcrypt.hash("Student@123456", 12)
  const eleves = [
  { email: "yusuf@tahfidz.com",   fullName: "Yusuf Mahmoud",  g: g1.id, t: teacher1!.id, stars: 245, streak: 12, code: "STU-001" },
  { email: "aisha@tahfidz.com",   fullName: "Aisha Rahman",   g: g1.id, t: teacher1!.id, stars: 189, streak: 8,  code: "STU-002" },
  { email: "omar@tahfidz.com",    fullName: "Omar Khalil",    g: g1.id, t: teacher1!.id, stars: 312, streak: 25, code: "STU-003" },
  { email: "maryam@tahfidz.com",  fullName: "Maryam Saidi",   g: g2.id, t: teacher2!.id, stars: 98,  streak: 5,  code: "STU-004" },
  { email: "ibrahim@tahfidz.com", fullName: "Ibrahim Bouzid", g: g2.id, t: teacher2!.id, stars: 67,  streak: 3,  code: "STU-005" },
  ]
  for (const e of eleves) {
    await prisma.user.upsert({
      where:  { schoolId_email: { schoolId: school.id, email: e.email } },
      update: {},
      create: {
        schoolId: school.id,
        email:    e.email,
        password: studentPwd,
        fullName: e.fullName,
        role:     "STUDENT",
        isActive: true,
        studentProfile: { create: { groupId: e.g, teacherId: e.t, totalStars: e.stars, currentStreak: e.streak, studentCode: e.code } },
      },
    })
  }
  console.log("✅ 5 élèves")

  // 7. Parent
  const parentPwd = await bcrypt.hash("Parent@123456", 12)
  await prisma.user.upsert({
    where:  { schoolId_email: { schoolId: school.id, email: "parent@tahfidz.com" } },
    update: {},
    create: {
      schoolId: school.id,
      email:    "parent@tahfidz.com",
      password: parentPwd,
      fullName: "Hassan Mahmoud",
      role:     "PARENT",
      isActive: true,
      parentProfile: { create: {} },
    },
  })
  console.log("✅ Parent")

  // 8. Annonce
  await prisma.announcement.upsert({
    where:  { id: "welcome-tahfidz" },
    update: {},
    create: {
      id:          "welcome-tahfidz",
      schoolId:    school.id,
      title:       "Bienvenue sur TAHFIDZ !",
      titleAr:     "مرحباً بكم في تحفيظ!",
      content:     "La plateforme de mémorisation du Saint Coran est opérationnelle. Que Allah facilite la mémorisation.",
      contentAr:   "منصة تحفيظ القرآن الكريم جاهزة. نسأل الله التيسير.",
      type:        "GENERAL",
      targetRoles: ["ADMIN", "TEACHER", "PARENT", "STUDENT"],
      isPinned:    true,
      isPublished: true,
      createdBy:   adminUser.id,
    },
  })

  // 9. Configurations globales du site
  await seedSiteConfig()

  console.log("\n🎉 Seed terminé !\n")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("  SUPERADMIN : admin@tahfidz.com / Admin@123456  (slug: platform)")
  console.log("  ADMIN      : admin@tahfidz.com / Admin@123456  (slug: tahfidz-demo)")
  console.log("  TEACHER : teacher1@tahfidz.com / Teacher@123456")
  console.log("  PARENT  : parent@tahfidz.com   / Parent@123456")
  console.log("  STUDENT : yusuf@tahfidz.com    / Student@123456")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch(e => { console.error("❌", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
