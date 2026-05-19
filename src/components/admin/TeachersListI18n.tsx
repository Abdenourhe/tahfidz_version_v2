// DEPRECATED — renommé TeachersListClient.tsx. Ce fichier n'est plus importé.
// src/components/admin/TeachersListI18n.tsx

import Link from "next/link"
import { Plus, Search, Users } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { shortId, formatDate } from "@/lib/utils"

interface Teacher {
  id: string
  user: {
    fullName: string
    email: string
    avatar: string | null
    isActive: boolean
    createdAt: Date
    gender: string | null
  }
  groups: { id: string; name: string; _count: { students: number } }[]
  _count: { students: number; evaluations: number }
}

interface Props {
  teachers: Teacher[]
  total: number
  search: string
}

export function TeachersListI18n({ teachers, total, search }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const T = {
    title:        { fr: "Enseignants",              en: "Teachers",              ar: "المعلمون" },
    subtitle:     { fr: `${total} enseignant${total>1?"s":""}`,
                    en: `${total} teacher${total>1?"s":""}`,
                    ar: `${total} معلم` },
    add:          { fr: "Ajouter un enseignant",    en: "Add teacher",           ar: "إضافة معلم" },
    search:       { fr: "Rechercher par nom ou email…", en: "Search by name or email…", ar: "بحث بالاسم أو البريد…" },
    noTeacher:    { fr: "Aucun enseignant",         en: "No teachers",           ar: "لا يوجد معلمون" },
    students:     { fr: "élèves",                   en: "students",              ar: "طلاب" },
    groups:       { fr: "groupes",                  en: "groups",                ar: "مجموعات" },
    evaluations:  { fr: "évaluations",              en: "evaluations",           ar: "تقييمات" },
    statusActive: { fr: "Actif",                    en: "Active",                ar: "نشط" },
    statusInact:  { fr: "Inactif",                  en: "Inactive",              ar: "غير نشط" },
    enrolled:     { fr: "Inscrit le",               en: "Enrolled on",           ar: "تاريخ التسجيل" },
    view:         { fr: "Voir →",                   en: "View →",                ar: "← عرض" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/admin/teachers/new"
          className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Plus size={16} /> {t("add")}
        </Link>
      </div>

      <form>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input name="search" type="text" defaultValue={search} placeholder={t("search")}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" />
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teachers.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">{t("noTeacher")}</p>
          </div>
        ) : (
          teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{teacher.user.fullName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{teacher.user.fullName}</p>
                    <p className="text-xs text-gray-400">{teacher.user.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${teacher.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {teacher.user.isActive ? t("statusActive") : t("statusInact")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{teacher._count.students}</p>
                  <p className="text-xs text-gray-400">{t("students")}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-purple-600">{teacher.groups.length}</p>
                  <p className="text-xs text-gray-400">{t("groups")}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-tahfidz-green">{teacher._count.evaluations}</p>
                  <p className="text-xs text-gray-400">{t("evaluations")}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-400">{t("enrolled")} {formatDate(teacher.user.createdAt, { month: "short", year: "numeric" })}</span>
                <Link href={`/admin/teachers/${teacher.id}`}
                  className="text-xs text-tahfidz-green hover:underline font-medium">{t("view")}</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
