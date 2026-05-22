"use client"
// src/components/admin/parents.tsx
// Fusion de : ParentsListClient.tsx + ParentDetailClient.tsx

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  Plus, Search, Users, ArrowLeft, Phone, Mail, Link2,
} from "lucide-react"
import { formatDate, statusLabel, shortId } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════════════════
// LISTE PARENTS
// ═══════════════════════════════════════════════════════════════════════════

interface ParentRow {
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

interface ListProps {
  parents: ParentRow[]
  total: number
  page: number
  totalPages: number
  search: string
}

export function ParentsListClient({ parents, total, page, totalPages, search }: ListProps) {
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

  const fmtDate = (d: Date) => formatDate(d, L, { day: "2-digit", month: "short", year: "numeric" })

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

// ═══════════════════════════════════════════════════════════════════════════
// DÉTAIL PARENT
// ═══════════════════════════════════════════════════════════════════════════

interface DetailProps {
  parent: any
  school: any
}

export function ParentDetailClient({ parent, school }: DetailProps) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const T = {
    back:         { fr: "Retour",                   en: "Back",                  ar: "رجوع" },
    active:       { fr: "Actif",                    en: "Active",                ar: "نشط" },
    inactive:     { fr: "Inactif",                  en: "Inactive",              ar: "غير نشط" },
    phone:        { fr: "Téléphone",                en: "Phone",                 ar: "الهاتف" },
    notProvided:  { fr: "Non renseigné",            en: "Not provided",          ar: "غير محدد" },
    email:        { fr: "Email",                    en: "Email",                 ar: "البريد" },
    gender:       { fr: "Genre",                    en: "Gender",                ar: "الجنس" },
    male:         { fr: "Masculin",                 en: "Male",                  ar: "ذكر" },
    female:       { fr: "Féminin",                  en: "Female",                ar: "أنثى" },
    unknown:      { fr: "—",                        en: "—",                     ar: "—" },
    enrolled:     { fr: "Inscrit le",               en: "Enrolled on",           ar: "تاريخ التسجيل" },
    lastLogin:    { fr: "Dernière connexion",       en: "Last login",            ar: "آخر تسجيل دخول" },
    children:     { fr: "Enfants liés",             en: "Linked children",       ar: "الأطفال المرتبطون" },
    school:       { fr: "École",                    en: "School",                ar: "المدرسة" },
    linkedChildren:{ fr: "Enfants liés",            en: "Linked children",       ar: "الأطفال المرتبطون" },
    noChild:      { fr: "Aucun enfant lié",         en: "No linked child",       ar: "لا يوجد طفل مرتبط" },
    linkDesc:     { fr: "Le parent peut lier ses enfants via son tableau de bord",
                    en: "The parent can link their children via their dashboard",
                    ar: "يمكن للوالي ربط أطفاله عبر لوحة التحكم" },
    relation:     { fr: "Relation",                 en: "Relation",              ar: "العلاقة" },
    father:       { fr: "Père",                     en: "Father",                ar: "أب" },
    mother:       { fr: "Mère",                     en: "Mother",                ar: "أم" },
    guardian:     { fr: "Tuteur",                   en: "Guardian",              ar: "ولي" },
    group:        { fr: "Groupe",                   en: "Group",                 ar: "المجموعة" },
    teacher:      { fr: "Enseignant",               en: "Teacher",               ar: "المعلم" },
    memorized:    { fr: "mémorisées",               en: "memorized",             ar: "محفوظة" },
    inProgress:   { fr: "En cours",                 en: "In progress",           ar: "جارٍ" },
    viewProfile:  { fr: "Voir le profil",           en: "View profile",          ar: "عرض الملف" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const genderLabel = (g: string | null) => {
    if (g === "MALE") return t("male")
    if (g === "FEMALE") return t("female")
    return t("unknown")
  }

  const relationLabel = (rel: string) => {
    if (rel === "father") return t("father")
    if (rel === "mother") return t("mother")
    return t("guardian")
  }

  const relationEmoji = (rel: string) => rel === "father" ? "👨" : rel === "mother" ? "👩" : "🧑"

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/parents" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{parent.user.fullName}</h1>
          {parent.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400">{parent.user.fullNameAr}</p>}
        </div>
        <span className={`px-3 py-1 text-sm rounded-full font-medium ${parent.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {parent.user.isActive ? t("active") : t("inactive")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mb-3">
                <span className="text-white font-bold text-xl">{parent.user.fullName.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{parent.user.fullName}</p>
              {parent.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400 text-sm">{parent.user.fullNameAr}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-lg">
                <Phone size={16} className="text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{t("phone")}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{parent.user.phone || <span className="text-gray-400 font-normal">{t("notProvided")}</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                <Mail size={16} className="text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{t("email")}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{parent.user.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("gender")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{genderLabel(parent.user.gender)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("enrolled")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(parent.user.createdAt, L, { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
              {parent.user.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t("lastLogin")}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(parent.user.lastLoginAt, L, { day: "2-digit", month: "short" })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("children")}</span>
                <span className="font-semibold text-tahfidz-green">{parent.childrenLinks.length}</span>
              </div>
            </div>

            {school && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                  {school.logo ? (
                    <Image src={school.logo} alt={school.name} width={36} height={36} className="w-full h-full object-contain p-0.5" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{school.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{t("school")}</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{school.name}</p>
                  {school.nameAr && <p className="arabic text-xs text-gray-400 truncate">{school.nameAr}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Users size={18} className="text-tahfidz-green" />
              {t("linkedChildren")} ({parent.childrenLinks.length})
            </h3>

            {parent.childrenLinks.length === 0 ? (
              <div className="text-center py-8">
                <Link2 size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">{t("noChild")}</p>
                <p className="text-xs text-gray-300 mt-1">{t("linkDesc")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {parent.childrenLinks.map((link: any) => {
                  const rel = { label: relationLabel(link.relation), icon: relationEmoji(link.relation) }
                  return (
                    <div key={link.id} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="w-11 h-11 rounded-xl gradient-tahfidz flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">{link.student.user.fullName.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{link.student.user.fullName}</p>
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                              {rel.icon} {rel.label}
                            </span>
                          </div>
                          {link.student.user.fullNameAr && (
                            <p className="arabic text-xs text-gray-400">{link.student.user.fullNameAr}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            {link.student.group && <span>📚 {link.student.group.name}</span>}
                            {link.student.teacher && <span>· 👩‍🏫 {link.student.teacher.user.fullName}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-tahfidz-green">{link.student._count.memorizedSurahs}</p>
                          <p className="text-xs text-gray-400">{t("memorized")}</p>
                        </div>
                      </div>

                      {link.student.memorizationProgress.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-400 mb-2">{t("inProgress")} :</p>
                          <div className="space-y-1.5">
                            {link.student.memorizationProgress.map((prog: any) => {
                              const sl = statusLabel(prog.status)
                              return (
                                <div key={prog.id} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{prog.surah.nameFr}</span>
                                  <span className="arabic text-xs text-tahfidz-green">{prog.surah.nameAr}</span>
                                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`}>{sl.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <Link href={`/admin/students/${link.student.id}`}
                          className="text-xs text-tahfidz-green hover:underline font-medium">
                          {t("viewProfile")} →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
