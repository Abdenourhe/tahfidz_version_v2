"use client"
// src/components/admin/students.tsx
// Fusion de : StudentTableClient.tsx + StudentActions.tsx
// Tableau élèves avec filtres, actions (toggle/delete/certificat) et export Excel

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { calculateAge } from "@/lib/utils"
import {
  Pencil, Trash2, UserPlus, Plus,
  User, GraduationCap, Users, Search, Filter,
  Award, Eye, Power, PowerOff, X, Mail, Phone,
  Shield, ShieldOff, AlertTriangle, CheckCircle, Printer,
} from "lucide-react"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { ExportStudentsButton } from "./ExportStudentsButton"

// ─── Types ────────────────────────────────────────────────────────────────
export interface StudentRow {
  id: string
  studentCode: string
  user: {
    fullName: string
    fullNameAr?: string | null
    email: string
    phone?: string | null
    gender?: string | null
    avatar?: string | null
    isActive: boolean
    createdAt: Date | string
  }
  group?: { id: string; name: string; level: string } | null
  teacher?: { user: { fullName: string } } | null
  parentLinks?: { parent: { user: { fullName: string } } }[] | null
  dateOfBirth?: Date | string | null
  emergencyPhone?: string | null
  _count?: { memorizedSurahs: number }
}

export interface SchoolInfo {
  name: string
  nameAr?: string | null
  logo?: string | null
  slug: string
  address?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
}

interface Props {
  students: StudentRow[]
  groups: { id: string; name: string; level: string }[]
  teachers: { id: string; user: { fullName: string } }[]
  statusFilter?: string
  school?: SchoolInfo
}

// ─── Dictionnaire i18n ────────────────────────────────────────────────────
const UI: Record<string, { fr: string; en: string; ar: string }> = {
  search:              { fr: "Rechercher un élève...",     en: "Search a student...",      ar: "بحث عن طالب..." },
  addStudent:          { fr: "Nouvel élève",               en: "New student",              ar: "طالب جديد" },
  allGroups:           { fr: "Tous les groupes",           en: "All groups",               ar: "جميع المجموعات" },
  allLevels:           { fr: "Tous les niveaux",           en: "All levels",               ar: "جميع المستويات" },
  allStatuses:         { fr: "Tous les statuts",           en: "All statuses",             ar: "جميع الحالات" },
  active:              { fr: "Actif",                      en: "Active",                   ar: "نشط" },
  inactive:            { fr: "Inactif",                    en: "Inactive",                 ar: "غير نشط" },
  exportExcel:         { fr: "Exporter",                   en: "Export",                   ar: "تصدير" },
  filters:             { fr: "Filtres",                    en: "Filters",                  ar: "فلاتر" },
  years:               { fr: "ans",                        en: "yrs",                      ar: "سنة" },
  notProvided:         { fr: "Non renseigné",              en: "Not set",                  ar: "غير محدد" },
  subtitle:            { fr: "Gestion des inscriptions et suivis", en: "Enrollment and follow-up management", ar: "إدارة التسجيلات والمتابعة" },
  certificate:         { fr: "Certificat",                 en: "Certificate",              ar: "شهادة" },
  registrationCard:    { fr: "Fiche d'inscription",        en: "Registration card",        ar: "بطاقة التسجيل" },
  viewProfile:         { fr: "Voir le profil",             en: "View profile",             ar: "عرض الملف" },
  edit:                { fr: "Modifier",                   en: "Edit",                     ar: "تعديل" },
  activate:            { fr: "Activer",                    en: "Activate",                 ar: "تفعيل" },
  deactivate:          { fr: "Désactiver",                 en: "Deactivate",               ar: "تعطيل" },
  delete:              { fr: "Supprimer",                  en: "Delete",                   ar: "حذف" },
  totalStudents:       { fr: "Total élèves",               en: "Total students",           ar: "إجمالي الطلاب" },
  activeStudents:      { fr: "Actifs",                     en: "Active",                   ar: "نشط" },
  inactiveStudents:    { fr: "Inactifs",                   en: "Inactive",                 ar: "غير نشط" },
  modalDeleteTitle:    { fr: "Confirmer la suppression",   en: "Confirm deletion",         ar: "تأكيد الحذف" },
  colEnrolled:         { fr: "Inscrit",                    en: "Enrolled",                 ar: "تاريخ التسجيل" },
  colEmergency:        { fr: "Urgence",                    en: "Emergency",                ar: "الطوارئ" },
  colParent:           { fr: "Parent",                     en: "Parent",                   ar: "ولي الأمر" },
  colTeacher:          { fr: "Enseignant",                 en: "Teacher",                  ar: "المعلم" },
  noStudents:          { fr: "Aucun élève trouvé",         en: "No students found",        ar: "لم يتم العثور على طلاب" },
  reset:               { fr: "Réinitialiser",              en: "Reset",                    ar: "إعادة تعيين" },
  pagination:          { fr: "élèves",                     en: "students",                 ar: "طالب" },
  modalDeleteDesc:     { fr: "Cette action est irréversible. L'élève sera définitivement supprimé.", en: "This action is irreversible.", ar: "هذا الإجراء لا رجعة فيه." },
  modalDeactTitle:     { fr: "Désactiver l'élève",         en: "Deactivate student",       ar: "تعطيل الطالب" },
  modalDeactDesc:      { fr: "L'élève ne pourra plus se connecter. Vous pourrez le réactiver.", en: "The student will not be able to log in.", ar: "لن يتمكن الطالب من تسجيل الدخول." },
  modalActTitle:       { fr: "Activer l'élève",            en: "Activate student",         ar: "تفعيل الطالب" },
  modalActDesc:        { fr: "L'élève pourra à nouveau se connecter.",   en: "The student will be able to log in again.", ar: "سيتمكن الطالب من تسجيل الدخول." },
  cancel:              { fr: "Annuler",                    en: "Cancel",                   ar: "إلغاء" },
  confirm:             { fr: "Confirmer",                  en: "Confirm",                  ar: "تأكيد" },
  student:             { fr: "Élève",                      en: "Student",                  ar: "الطالب" },
  errorServer:         { fr: "Erreur serveur",             en: "Server error",             ar: "خطأ في الخادم" },
}

const LEVEL_LABEL: Record<string, { fr: string; en: string; ar: string }> = {
  beginner:     { fr: "Débutant",      en: "Beginner",     ar: "مبتدئ" },
  intermediate: { fr: "Intermédiaire", en: "Intermediate", ar: "متوسط" },
  advanced:     { fr: "Avancé",        en: "Advanced",     ar: "متقدم" },
}

function u(k: keyof typeof UI, locale: string): string {
  const entry = UI[k]
  return entry ? (entry[locale as keyof typeof entry] ?? entry.fr) : k
}

// ─── Modale de confirmation ────────────────────────────────────────────────
function ConfirmModal({
  isOpen, onClose, onConfirm, title, description, name,
  confirmText, cancelText, Icon, iconBg, iconColor, confirmBg,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description: string; name?: string;
  confirmText: string; cancelText: string; Icon: any;
  iconBg: string; iconColor: string; confirmBg: string;
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4">
        <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
          <Icon size={28} className={iconColor} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 leading-relaxed">{description}</p>
        {name && (
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-6 py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            Élève : <span className="text-tahfidz-green">{name}</span>
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onClose() }} className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition ${confirmBg}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Menu d'actions inline ─────────────────────────────────────────────────
function ActionMenu({ studentId, isActive, onToggle, onDelete, locale }: {
  studentId: string; isActive: boolean; onToggle: () => void; onDelete: () => void; locale: string;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const actions = [
    { Icon: Award,  label: u("certificate", locale),  href: `/admin/students/${studentId}/certificate`, color: "text-amber-600", bg: "hover:bg-amber-50" },
    { Icon: Printer, label: u("registrationCard", locale), href: `/admin/students/${studentId}/registration-card`, color: "text-emerald-600", bg: "hover:bg-emerald-50" },
    { Icon: Eye,    label: u("viewProfile", locale),   href: `/admin/students/${studentId}`,             color: "text-blue-600",  bg: "hover:bg-blue-50" },
    { Icon: Pencil, label: u("edit", locale),                 href: `/admin/students/${studentId}/edit`,        color: "text-gray-600",  bg: "hover:bg-gray-50" },
    { Icon: isActive ? PowerOff : Power, label: isActive ? u("deactivate", locale) : u("activate", locale), onClick: onToggle, color: isActive ? "text-orange-600" : "text-green-600", bg: isActive ? "hover:bg-orange-50" : "hover:bg-green-50" },
    { Icon: Trash2, label: u("delete", locale),        onClick: onDelete,                                color: "text-red-600",   bg: "hover:bg-red-50" },
  ]

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isOpen ? "bg-tahfidz-green text-white rotate-45 shadow-lg" : "bg-white border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"}`}
      >
        <Plus size={16} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 min-w-[170px]">
          {actions.map((a, i) =>
            a.href ? (
              <Link key={i} href={a.href} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${a.bg} ${a.color}`} onClick={() => setIsOpen(false)}>
                <a.Icon size={15} /><span className="font-medium">{a.label}</span>
              </Link>
            ) : (
              <button key={i} onClick={() => { a.onClick?.(); setIsOpen(false) }} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition w-full text-left ${a.bg} ${a.color}`}>
                <a.Icon size={15} /><span className="font-medium">{a.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────
export function StudentTableClient({ students, groups, teachers: _teachers, statusFilter: initialStatus, school }: Props) {
  const { locale: ctxLocale } = useLanguage()
  const L = (ctxLocale || "fr") as "fr" | "en" | "ar"
  const router = useRouter()

  const [search, setSearch]           = useState("")
  const [groupFilter, setGroupFilter] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState(initialStatus || "")
  const [showFilters, setShowFilters] = useState(false)
  const [modalDelete, setModalDelete] = useState<string | null>(null)
  const [modalToggle, setModalToggle] = useState<{ id: string; current: boolean } | null>(null)

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase()
    return (
      (!q || s.user.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q)) &&
      (!groupFilter  || s.group?.id === groupFilter) &&
      (!levelFilter  || s.group?.level === levelFilter) &&
      (!statusFilter || (statusFilter === "active" ? s.user.isActive : !s.user.isActive))
    )
  }), [students, search, groupFilter, levelFilter, statusFilter])

  const stats = {
    total:    students.length,
    active:   students.filter(s => s.user.isActive).length,
    inactive: students.filter(s => !s.user.isActive).length,
  }

  // ── Appels API ─────────────────────────────────────────────────────────
  const doToggle = async (id: string, _current: boolean) => {
    try {
      const res = await fetch(`/api/students/${id}?action=toggle`, { method: "PATCH" })
      if (!res.ok) { alert((await res.json().catch(() => ({}))).error || u("errorServer", L)); return }
      router.refresh()
    } catch { alert(u("errorServer", L)) }
  }

  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" })
      if (!res.ok) {
        let msg = u("errorServer", L)
        try { msg = (await res.json()).error || msg } catch { msg = `${u("errorServer", L)} (${res.status})` }
        alert(msg); return
      }
      router.refresh()
    } catch (e: any) { alert(e.message || u("errorServer", L)) }
  }

  const studentForToggle = modalToggle ? students.find(s => s.id === modalToggle.id) : null
  const studentForDelete = modalDelete ? students.find(s => s.id === modalDelete)  : null

  return (
    <div className="space-y-6">
      {/* Modales */}
      <ConfirmModal
        isOpen={!!modalDelete} onClose={() => setModalDelete(null)}
        onConfirm={() => modalDelete && doDelete(modalDelete)}
        title={u("modalDeleteTitle", L)} description={u("modalDeleteDesc", L)}
        name={studentForDelete?.user.fullName}
        confirmText={u("confirm", L)} cancelText={u("cancel", L)}
        Icon={AlertTriangle} iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-600"
        confirmBg="bg-red-600 hover:bg-red-700"
      />
      <ConfirmModal
        isOpen={!!modalToggle} onClose={() => setModalToggle(null)}
        onConfirm={() => modalToggle && doToggle(modalToggle.id, modalToggle.current)}
        title={modalToggle?.current ? u("modalDeactTitle", L) : u("modalActTitle", L)}
        description={modalToggle?.current ? u("modalDeactDesc", L) : u("modalActDesc", L)}
        name={studentForToggle?.user.fullName}
        confirmText={u("confirm", L)} cancelText={u("cancel", L)}
        Icon={modalToggle?.current ? ShieldOff : Shield}
        iconBg={modalToggle?.current ? "bg-orange-100 dark:bg-orange-900/30" : "bg-green-100 dark:bg-green-900/30"}
        iconColor={modalToggle?.current ? "text-orange-600" : "text-green-600"}
        confirmBg={modalToggle?.current ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{u("totalStudents", L)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{u("subtitle", L)}</p>
        </div>
        <Link href="/admin/students/new" className="flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green hover:bg-tahfidz-green-dark text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-tahfidz-green/20">
          <UserPlus size={18} />{u("addStudent", L)}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users,     label: u("totalStudents", L),    value: stats.total,    color: "text-blue-500",  bg: "bg-blue-50 dark:bg-blue-900/20" },
          { icon: CheckCircle, label: u("activeStudents", L),  value: stats.active,   color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", textColor: "text-green-600" },
          { icon: PowerOff,  label: u("inactiveStudents", L), value: stats.inactive, color: "text-gray-400",  bg: "bg-gray-100 dark:bg-gray-800", textColor: "text-gray-400" },
        ].map(({ icon: Icon, label, value, color, bg, textColor }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}><Icon size={20} className={color} /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{label}</p>
                <p className={`text-2xl font-bold ${textColor || "text-gray-900 dark:text-white"}`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barre outils */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={u("search", L)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
        </div>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${showFilters ? "bg-tahfidz-green text-white" : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
          <Filter size={15} />{u("filters", L)}
        </button>
        <ExportStudentsButton allStudents={students} filteredStudents={filtered} locale={L} school={school} />
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tahfidz-green">
            <option value="">{u("allGroups", L)}</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tahfidz-green">
            <option value="">{u("allLevels", L)}</option>
            <option value="beginner">{LEVEL_LABEL.beginner[L]}</option>
            <option value="intermediate">{LEVEL_LABEL.intermediate[L]}</option>
            <option value="advanced">{LEVEL_LABEL.advanced[L]}</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tahfidz-green">
            <option value="">{u("allStatuses", L)}</option>
            <option value="active">{u("active", L)}</option>
            <option value="inactive">{u("inactive", L)}</option>
          </select>
          {(groupFilter || levelFilter || statusFilter) && (
            <button onClick={() => { setGroupFilter(""); setLevelFilter(""); setStatusFilter("") }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm text-gray-500 hover:bg-white transition">
              <X size={14} />{u("reset", L)}
            </button>
          )}
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">{u("noStudents", L)}</p>
          </div>
        ) : filtered.map(s => (
          <div key={s.id} className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-tahfidz-green/20 to-tahfidz-green/5 flex items-center justify-center">
                  <AvatarLightbox
                    src={s.user.avatar}
                    alt={s.user.fullName}
                    fallback={<User size={20} className="text-tahfidz-green" />}
                    className="w-full h-full"
                    imgClassName="w-full h-full"
                  />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${s.user.isActive ? "bg-green-500" : "bg-gray-400"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{s.user.fullName}</h3>
                  <span className="text-[10px] font-mono text-tahfidz-green bg-tahfidz-green/10 px-1.5 py-0.5 rounded">{s.studentCode}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Mail size={11} />{s.user.email}</span>
                  {s.dateOfBirth && <span>{calculateAge(s.dateOfBirth)} {u("years", L)}</span>}
                  {s.group && <span className="flex items-center gap-1"><GraduationCap size={11} className="text-tahfidz-green" />{s.group.name}</span>}
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-5 text-xs">
                {s.teacher && (
                  <div className="text-center min-w-[80px]">
                    <p className="text-gray-400 mb-0.5 text-[10px] uppercase tracking-wider">{u("colTeacher", L)}</p>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{s.teacher.user.fullName}</p>
                  </div>
                )}
                <div className="text-center min-w-[80px]">
                  <p className="text-gray-400 mb-0.5 text-[10px] uppercase tracking-wider">{u("colParent", L)}</p>
                  {s.parentLinks?.[0] ? (
                    <p className="text-purple-600 dark:text-purple-400 font-medium">{s.parentLinks[0].parent.user.fullName}</p>
                  ) : (
                    <p className="text-gray-400">{u("notProvided", L)}</p>
                  )}
                </div>
                {s.emergencyPhone && (
                  <div className="text-center min-w-[80px]">
                    <p className="text-gray-400 mb-0.5 text-[10px] uppercase tracking-wider">{u("colEmergency", L)}</p>
                    <p className="text-red-500 font-medium flex items-center justify-center gap-1"><Phone size={11} />{s.emergencyPhone}</p>
                  </div>
                )}
                <div className="text-center min-w-[60px]">
                  <p className="text-gray-400 mb-0.5 text-[10px] uppercase tracking-wider">{u("colEnrolled", L)}</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{new Date(s.user.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })}</p>
                </div>
              </div>

              <div className="flex-shrink-0">
                <ActionMenu
                  studentId={s.id}
                  isActive={s.user.isActive}
                  onToggle={() => setModalToggle({ id: s.id, current: s.user.isActive })}
                  onDelete={() => setModalDelete(s.id)}
                  locale={L}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">{filtered.length} / {students.length} {u("pagination", L)}</p>
    </div>
  )
}
