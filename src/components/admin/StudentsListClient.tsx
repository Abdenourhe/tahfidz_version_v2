"use client"
// src/components/admin/StudentsListClient.tsx

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { Search, Users, MoreVertical, Eye, Power, PowerOff, Trash2, AlertTriangle, Filter, X, ChevronDown } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"

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

interface Group {
  id: string
  name: string
}

interface Teacher {
  id: string
  user: { fullName: string }
}

interface Props {
  students: Student[]
  total: number
  page: number
  totalPages: number
  search: string
  statusFilter: string
  groupId: string
  teacherId: string
  groups: Group[]
  teachers: Teacher[]
}

export function StudentsListClient({
  students, total, page, totalPages, search, statusFilter, groupId, teacherId, groups, teachers
}: Props) {
  const { locale } = useLanguage()
  const L = (locale || "fr") as "fr" | "en" | "ar"
  const router = useRouter()

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // États locaux pour les filtres (avant soumission)
  const [localSearch, setLocalSearch] = useState(search)
  const [localStatus, setLocalStatus] = useState(statusFilter)
  const [localGroup, setLocalGroup] = useState(groupId)
  const [localTeacher, setLocalTeacher] = useState(teacherId)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const T = {
    title:        { fr: "Élèves",                   en: "Students",              ar: "الطلاب" },
    subtitle:     (n: number) => {
      const texts: Record<string, string> = {
        fr: `${n} élève${n > 1 ? "s" : ""} enregistré${n > 1 ? "s" : ""}`,
        en: `${n} student${n > 1 ? "s" : ""} registered`,
        ar: `${n} طالب مسجل`
      }
      return texts[L] || texts.fr
    },
    add:          { fr: "Ajouter un élève",         en: "Add student",           ar: "إضافة طالب" },
    search:       { fr: "Rechercher par nom ou email...", en: "Search by name or email...", ar: "بحث بالاسم أو البريد..." },
    filters:      { fr: "Filtres",                  en: "Filters",               ar: "الفلاتر" },
    allGroups:    { fr: "Tous les groupes",         en: "All groups",            ar: "جميع المجموعات" },
    allTeachers:  { fr: "Tous les enseignants",     en: "All teachers",          ar: "جميع المعلمين" },
    allStatuses:  { fr: "Tous les statuts",       en: "All statuses",          ar: "جميع الحالات" },
    active:       { fr: "Actif",                    en: "Active",                ar: "نشط" },
    inactive:     { fr: "Inactif",                  en: "Inactive",              ar: "غير نشط" },
    noGroup:      { fr: "Sans groupe",              en: "No group",              ar: "بدون مجموعة" },
    noTeacher:    { fr: "Sans enseignant",          en: "No teacher",            ar: "بدون معلم" },
    reset:        { fr: "Réinitialiser",            en: "Reset",                 ar: "إعادة تعيين" },
    apply:        { fr: "Appliquer",                en: "Apply",                 ar: "تطبيق" },
    noStudent:    { fr: "Aucun élève trouvé",       en: "No students found",     ar: "لا يوجد طلاب" },
    name:         { fr: "Nom",                      en: "Name",                  ar: "الاسم" },
    email:        { fr: "Email",                    en: "Email",                 ar: "البريد" },
    group:        { fr: "Groupe",                   en: "Group",                 ar: "المجموعة" },
    teacher:      { fr: "Enseignant",               en: "Teacher",               ar: "المعلم" },
    status:       { fr: "Statut",                   en: "Status",                ar: "الحالة" },
    surahs:       { fr: "Sourates",                 en: "Surahs",                ar: "السور" },
    enrolled:     { fr: "Inscrit le",               en: "Enrolled",              ar: "التسجيل" },
    actions:      { fr: "Actions",                  en: "Actions",               ar: "الإجراءات" },
    view:         { fr: "Voir le profil",           en: "View profile",          ar: "عرض الملف" },
    activate:     { fr: "Activer",                  en: "Activate",              ar: "تفعيل" },
    deactivate:   { fr: "Désactiver",               en: "Deactivate",            ar: "إلغاء التفعيل" },
    delete:       { fr: "Supprimer",                en: "Delete",                ar: "حذف" },
    deleteTitle:  { fr: "Confirmer la suppression",  en: "Confirm deletion",      ar: "تأكيد الحذف" },
    deleteText:   (name: string) => {
      const texts: Record<string, string> = {
        fr: `Êtes-vous sûr de vouloir supprimer définitivement ${name} ?`,
        en: `Are you sure you want to permanently delete ${name}?`,
        ar: `هل أنت متأكد من حذف ${name} نهائيًا؟`
      }
      return texts[L] || texts.fr
    },
    deleteWarn:   { fr: "Cette action est irréversible.", en: "This action is irreversible.", ar: "هذا الإجراء لا رجعة فيه." },
    cancel:       { fr: "Annuler",                  en: "Cancel",                ar: "إلغاء" },
    deleteBtn:    { fr: "Supprimer définitivement",  en: "Delete permanently",    ar: "حذف نهائي" },
    deleting:     { fr: "Suppression...",           en: "Deleting...",           ar: "جارٍ الحذف..." },
    pageOf:       (p: number, tp: number, t: number) => {
      const texts: Record<string, string> = {
        fr: `Page ${p} sur ${tp} · ${t} élèves`,
        en: `Page ${p} of ${tp} · ${t} students`,
        ar: `صفحة ${p} من ${tp} · ${t} طالب`
      }
      return texts[L] || texts.fr
    },
    prev:         { fr: "← Précédent",              en: "← Previous",           ar: "→ السابق" },
    next:         { fr: "Suivant →",                en: "Next →",                ar: "← التالي" },
  }

  const t = (k: keyof typeof T, ...args: any[]): string => {
    const val = T[k]
    if (typeof val === "function") {
      const result = val(...args)
      return typeof result === "string" ? result : String(result)
    }
    if (typeof val === "object" && val !== null) {
      const localized = (val as Record<string, string>)[L]
      if (typeof localized === "string") return localized
      const fallback = (val as Record<string, string>).fr
      if (typeof fallback === "string") return fallback
    }
    return String(val)
  }

  const buildUrl = (params: Record<string, string>) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
    return `/admin/students?${qs.toString()}`
  }

  const applyFilters = () => {
    const params: Record<string, string> = {}
    if (localSearch) params.search = localSearch
    if (localStatus && localStatus !== "all") params.status = localStatus
    if (localGroup) params.groupId = localGroup
    if (localTeacher) params.teacherId = localTeacher
    router.push(buildUrl(params))
  }

  const resetFilters = () => {
    setLocalSearch("")
    setLocalStatus("all")
    setLocalGroup("")
    setLocalTeacher("")
    router.push("/admin/students")
  }

  const activeFiltersCount = [
    localSearch !== search && localSearch !== "",
    localStatus !== "all",
    localGroup !== "",
    localTeacher !== ""
  ].filter(Boolean).length

  const handleToggle = async (student: Student) => {
    setTogglingId(student.id)
    setOpenMenuId(null)
    try {
      const res = await fetch(`/api/students/${student.id}/toggle`, { method: "PATCH" })
      if (!res.ok) throw new Error("Erreur")
      router.refresh()
    } catch {
      alert("Erreur lors du changement de statut")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (student: Student) => {
    setDeletingId(student.id)
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erreur ${res.status}`)
      }
      setShowDeleteConfirm(null)
      router.refresh()
    } catch (err: any) {
      alert("Erreur : " + err.message)
    } finally {
      setDeletingId(null)
      setShowDeleteConfirm(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle", total)}</p>
        </div>
        <Link href="/admin/students/new"
          className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Users size={16} /> {t("add")}
        </Link>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder={t("search")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition ${
              showFilters || activeFiltersCount > 0
                ? "border-tahfidz-green text-tahfidz-green bg-emerald-50 dark:bg-emerald-900/20"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Filter size={16} />
            {t("filters")}
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-tahfidz-green text-white text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Panneau filtres */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Filtre Statut */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t("status")}</label>
              <div className="relative">
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                >
                  <option value="all">{t("allStatuses")}</option>
                  <option value="active">{t("active")}</option>
                  <option value="inactive">{t("inactive")}</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Filtre Groupe */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t("group")}</label>
              <div className="relative">
                <select
                  value={localGroup}
                  onChange={(e) => setLocalGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                >
                  <option value="">{t("allGroups")}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Filtre Enseignant */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t("teacher")}</label>
              <div className="relative">
                <select
                  value={localTeacher}
                  onChange={(e) => setLocalTeacher(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                >
                  <option value="">{t("allTeachers")}</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.user.fullName}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Boutons actions filtres */}
            <div className="sm:col-span-3 flex items-center justify-end gap-2">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                <X size={14} /> {t("reset")}
              </button>
              <button
                onClick={applyFilters}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-tahfidz-green hover:bg-emerald-700 rounded-lg transition"
              >
                {t("apply")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tableau élèves */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">{t("noStudent")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("name")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("email")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("group")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("teacher")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("status")}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("surahs")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("enrolled")}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    {/* Nom */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg gradient-tahfidz flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{student.user.fullName.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{student.user.fullName}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{student.user.email}</td>

                    {/* Groupe */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {student.group?.name ?? <span className="text-gray-400 italic">{t("noGroup")}</span>}
                      </span>
                    </td>

                    {/* Enseignant */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {student.teacher?.user.fullName ?? <span className="text-gray-400 italic">{t("noTeacher")}</span>}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.user.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {student.user.isActive ? t("active") : t("inactive")}
                      </span>
                    </td>

                    {/* Sourates */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-medium text-tahfidz-green">{student._count.memorizedSurahs}</span>
                    </td>

                    {/* Date inscription */}
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(student.user.createdAt, L)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="relative inline-block" ref={openMenuId === student.id ? menuRef : undefined}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>

                        {openMenuId === student.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                            <Link href={`/admin/students/${student.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                              onClick={() => setOpenMenuId(null)}>
                              <Eye size={14} /> {t("view")}
                            </Link>
                            <button
                              onClick={() => handleToggle(student)}
                              disabled={togglingId === student.id}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                            >
                              {student.user.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                              {student.user.isActive ? t("deactivate") : t("activate")}
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                            <button
                              onClick={() => { setShowDeleteConfirm(student.id); setOpenMenuId(null) }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            >
                              <Trash2 size={14} /> {t("delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("deleteTitle")}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("deleteText", students.find(s => s.id === showDeleteConfirm)?.user.fullName || "")}<br/>
              {t("deleteWarn")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  const student = students.find(s => s.id === showDeleteConfirm)
                  if (student) handleDelete(student)
                }}
                disabled={deletingId === showDeleteConfirm}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {deletingId === showDeleteConfirm ? t("deleting") : t("deleteBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{t("pageOf", page, totalPages, total)}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: String(page - 1) })}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("prev")}</Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: String(page + 1) })}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("next")}</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}