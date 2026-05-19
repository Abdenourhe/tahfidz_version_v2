"use client"
// src/components/admin/StudentsListClient.tsx

import Link from "next/link"
import { Search, Users } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { shortId, formatDate } from "@/lib/utils"

interface Student {
  id: string
  user: {
    fullName: string
    email: string
    avatar: string | null
    isActive: boolean
    createdAt: Date
  }
  group: { id: string; name: string } | null
  teacher: { user: { fullName: string } } | null
  _count: { memorizedSurahs: number }
}

interface Props {
  students: Student[]
  total: number
  page: number
  totalPages: number
  search: string
  statusFilter: string
}

function calcAge(dob: Date | null) {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  if (today.getDate() < birth.getDate()) months--
  if (months < 0) { years--; months += 12 }
  if (years < 3) return null
  return { years, months }
}

export function StudentsListClient({ students, total, page, totalPages, search, statusFilter }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const T = {
    title:        { fr: "Élèves",                   en: "Students",              ar: "الطلاب" },
    subtitle:     { fr: `${total} élève${total>1?"s":""} enregistré${total>1?"s":""}`,
                    en: `${total} student${total>1?"s":""} registered`,
                    ar: `${total} طالب مسجل` },
    add:          { fr: "Ajouter un élève",         en: "Add student",           ar: "إضافة طالب" },
    search:       { fr: "Rechercher par nom ou email…", en: "Search by name or email…", ar: "بحث بالاسم أو البريد…" },
    noStudent:    { fr: "Aucun élève trouvé",       en: "No students found",     ar: "لا يوجد طلاب" },
    group:        { fr: "Groupe",                   en: "Group",                 ar: "المجموعة" },
    noGroup:      { fr: "Sans groupe",              en: "No group",              ar: "بدون مجموعة" },
    teacher:      { fr: "Enseignant",               en: "Teacher",               ar: "المعلم" },
    noTeacher:    { fr: "Sans enseignant",          en: "No teacher",            ar: "بدون معلم" },
    surahs:       { fr: "sourates mémorisées",      en: "memorized surahs",      ar: "سور محفوظة" },
    enrolled:     { fr: "Inscrit le",               en: "Enrolled on",           ar: "تاريخ التسجيل" },
    view:         { fr: "Voir →",                   en: "View →",                ar: "← عرض" },
    pageOf:       { fr: `Page ${page} sur ${totalPages} · ${total} élèves`,
                    en: `Page ${page} of ${totalPages} · ${total} students`,
                    ar: `صفحة ${page} من ${totalPages} · ${total} طالب` },
    prev:         { fr: "← Précédent",              en: "← Previous",           ar: "→ السابق" },
    next:         { fr: "Suivant →",                en: "Next →",                ar: "← التالي" },
    statusActive: { fr: "Actif",                    en: "Active",                ar: "نشط" },
    statusInact:  { fr: "Inactif",                  en: "Inactive",              ar: "غير نشط" },
    years:        { fr: "ans",                      en: "yrs",                   ar: "سنة" },
    months:       { fr: "mois",                     en: "mo",                    ar: "شهر" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/admin/students/new"
          className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Users size={16} /> {t("add")}
        </Link>
      </div>

      {/* Recherche */}
      <form>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input name="search" type="text" defaultValue={search} placeholder={t("search")}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" />
        </div>
      </form>

      {/* Grille élèves */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {students.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">{t("noStudent")}</p>
          </div>
        ) : (
          students.map((student) => {
            const age = calcAge(student.user.createdAt)
            return (
              <div key={student.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl gradient-tahfidz flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{student.user.fullName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{student.user.fullName}</p>
                      <p className="text-xs text-gray-400">{student.user.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${student.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {student.user.isActive ? t("statusActive") : t("statusInact")}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t("group")}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{student.group?.name ?? t("noGroup")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t("teacher")}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{student.teacher?.user.fullName ?? t("noTeacher")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t("surahs")}</span>
                    <span className="font-medium text-tahfidz-green">{student._count.memorizedSurahs}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-400">
                    {t("enrolled")} {formatDate(student.user.createdAt, { day: "2-digit", month: "short", year: "2-digit" })}
                  </span>
                  <Link href={`/admin/students/${student.id}`}
                    className="text-xs text-tahfidz-green hover:underline font-medium">{t("view")}</Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{t("pageOf")}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/students?page=${page-1}${search?`&search=${search}`:""}`}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("prev")}</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/students?page=${page+1}${search?`&search=${search}`:""}`}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("next")}</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}