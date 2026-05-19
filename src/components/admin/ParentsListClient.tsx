"use client"
// src/components/admin/ParentsListClient.tsx

import Link from "next/link"
import { Plus, Search, Users } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { formatDate, shortId } from "@/lib/utils"  // ← IMPORT DIRECT ICI

interface Parent {
  id: string
  user: {
    fullName: string
    fullNameAr: string | null
    email: string
    phone: string | null
    isActive: boolean
    createdAt: Date
  }
  childrenLinks: {
    id: string
    relation: string
    student: { user: { fullName: string } }
  }[]
}

interface Props {
  parents: Parent[]
  total: number
  page: number
  totalPages: number
  search: string
  // ← SUPPRIMÉ : shortId et formatDate ne sont plus en props
}

export function ParentsListClient({ parents, total, page, totalPages, search }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const T = {
    title:        { fr: "Parents",                  en: "Parents",               ar: "أولياء الأمور" },
    subtitle:     { fr: `${total} parent${total>1?"s":""} enregistré${total>1?"s":""}`,
                    en: `${total} parent${total>1?"s":""} registered`,
                    ar: `${total} ولي أمر مسجل` },
    add:          { fr: "Ajouter un parent",        en: "Add parent",            ar: "إضافة ولي أمر" },
    search:       { fr: "Rechercher par nom ou email…", en: "Search by name or email…", ar: "بحث بالاسم أو البريد…" },
    noParent:     { fr: "Aucun parent trouvé",      en: "No parents found",      ar: "لا يوجد أولياء أمور" },
    children:     { fr: "Enfant(s) lié(s)",         en: "Linked child(ren)",     ar: "طفل/أطفال مرتبطون" },
    noChild:      { fr: "Aucun enfant lié",         en: "No linked child",       ar: "لا يوجد طفل مرتبط" },
    father:       { fr: "Père",                     en: "Father",                ar: "أب" },
    mother:       { fr: "Mère",                     en: "Mother",                ar: "أم" },
    guardian:     { fr: "Tuteur",                   en: "Guardian",              ar: "ولي" },
    statusActive: { fr: "Actif",                    en: "Active",                ar: "نشط" },
    statusInact:  { fr: "Inactif",                  en: "Inactive",              ar: "غير نشط" },
    enrolled:     { fr: "Inscrit le",               en: "Enrolled on",           ar: "تاريخ التسجيل" },
    view:         { fr: "Voir →",                   en: "View →",                ar: "← عرض" },
    pageOf:       { fr: `Page ${page} sur ${totalPages} · ${total} parents`,
                    en: `Page ${page} of ${totalPages} · ${total} parents`,
                    ar: `صفحة ${page} من ${totalPages} · ${total} ولي أمر` },
    prev:         { fr: "← Précédent",              en: "← Previous",           ar: "→ السابق" },
    next:         { fr: "Suivant →",                en: "Next →",                ar: "← التالي" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const relationLabel = (rel: string) => {
    if (rel === "father") return t("father")
    if (rel === "mother") return t("mother")
    return t("guardian")
  }

  const relationEmoji = (rel: string) => rel === "father" ? "👨" : rel === "mother" ? "👩" : "🧑"

  // ← FONCTION LOCALE pour formater la date avec les bonnes options
  const fmtDate = (d: Date) => formatDate(d, { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/admin/parents/new"
          className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Plus size={16} /> {t("add")}
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

      {/* Grille parents */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {parents.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">{t("noParent")}</p>
          </div>
        ) : (
          parents.map((parent) => (
            <div key={parent.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
              {/* En-tête */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{parent.user.fullName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{parent.user.fullName}</p>
                    {parent.user.fullNameAr && <p className="arabic text-xs text-gray-400">{parent.user.fullNameAr}</p>}
                    <p className="text-xs text-gray-400">{parent.user.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${parent.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {parent.user.isActive ? t("statusActive") : t("statusInact")}
                </span>
              </div>

              {/* Enfants liés */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {parent.childrenLinks.length} {t("children")}
                </p>
                {parent.childrenLinks.length > 0 ? (
                  <div className="space-y-1.5">
                    {parent.childrenLinks.map((link) => (
                      <div key={link.id} className="flex items-center gap-2 px-3 py-1.5 bg-tahfidz-green-light rounded-lg">
                        <span className="text-sm">{relationEmoji(link.relation)}</span>
                        <span className="text-xs font-medium text-tahfidz-green truncate">{link.student.user.fullName}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{relationLabel(link.relation)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">{t("noChild")}</p>
                )}
              </div>

              {/* Infos bas */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-400">{t("enrolled")} {fmtDate(parent.user.createdAt)}</span>
                <Link href={`/admin/parents/${parent.id}`}
                  className="text-xs text-tahfidz-green hover:underline font-medium">{t("view")}</Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{t("pageOf")}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/parents?page=${page-1}${search?`&search=${search}`:""}`}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("prev")}</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/parents?page=${page+1}${search?`&search=${search}`:""}`}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("next")}</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}