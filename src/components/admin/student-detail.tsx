"use client"
// src/components/admin/student-detail.tsx
// Fusionne : StudentDetailClient.tsx + StudentGroupTransfer.tsx + TransferStudentModal.tsx
// API : PATCH /api/students/[id]?action=transfer

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { calculateAge } from "@/lib/utils"
import {
  ArrowLeft, Pencil, Award, BookOpen, Star,
  User, Mail, Phone, AlertCircle, MapPin, Heart, Calendar,
  GraduationCap, Users, Copy, CheckCircle, Clock,
  TrendingUp, BarChart3, KeyRound, ArrowRight, Loader2, CheckCircle2, X, Printer,
  Globe, Languages, QrCode,
} from "lucide-react"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { ParentInviteQR } from "@/components/admin/ParentInviteQR"

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Student {
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
  parentLinks?: { parent: { user: { fullName: string; email?: string; phone?: string } } }[] | null
  dateOfBirth?: Date | string | null
  emergencyPhone?: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
  medicalNotes?: string | null
  nationality?: string | null
  spokenLanguages?: string | null
  currentSurahNote?: string | null
  _count?: { memorizedSurahs: number }
  memorizedSurahs?: { surahId: number; surah: { nameFr: string; nameAr: string } }[]
  studentBadges?: any[]
  starsLogs?: any[]
  attendances?: any[]
}

interface GroupOption {
  id: string
  name: string
  level: string
  _count: { students: number }
  maxCapacity: number
  teacher: { id: string; user: { fullName: string } }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRADUCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const TEXTS: Record<string, Record<string, string>> = {
  back:        { fr: "Retour", en: "Back", ar: "عودة" },
  modify:      { fr: "Modifier les coordonnées", en: "Edit details", ar: "تعديل البيانات" },
  certificate: { fr: "Certificat", en: "Certificate", ar: "شهادة" },
  registrationCard: { fr: "Fiche d'inscription", en: "Registration card", ar: "بطاقة التسجيل" },
  studentCard:     { fr: "Carte étudiant", en: "Student card", ar: "بطاقة الطالب" },
  transfer:    { fr: "Changer de groupe", en: "Change group", ar: "تغيير المجموعة" },
  active:      { fr: "Actif", en: "Active", ar: "نشط" },
  inactive:    { fr: "Inactif", en: "Inactive", ar: "غير نشط" },
  personalInfo: { fr: "Informations personnelles", en: "Personal information", ar: "المعلومات الشخصية" },
  schoolInfo:  { fr: "Informations scolaires", en: "School information", ar: "المعلومات المدرسية" },
  medicalInfo: { fr: "Informations médicales", en: "Medical information", ar: "المعلومات الطبية" },
  parents:     { fr: "Parents", en: "Parents", ar: "الأهل" },
  stats:       { fr: "Statistiques", en: "Statistics", ar: "إحصائيات" },
  memorized:   { fr: "Sourates mémorisées", en: "Memorized surahs", ar: "السور المحفوظة" },
  noParent:    { fr: "Aucun parent lié", en: "No parent linked", ar: "لا يوجد ولي أمر مرتبط" },
  noMedical:   { fr: "Aucune note médicale", en: "No medical notes", ar: "لا توجد ملاحظات طبية" },
  noProgress:  { fr: "Aucune progression", en: "No progress", ar: "لا يوجد تقدم" },
  shareCode:   { fr: "Partagez ce code avec le parent pour lier son compte", en: "Share this code with the parent", ar: "شارك هذا الرمز مع الوالد" },
  years:       { fr: "ans", en: "yrs", ar: "سنة" },
  email:       { fr: "Email", en: "Email", ar: "البريد" },
  phone:       { fr: "Téléphone", en: "Phone", ar: "الهاتف" },
  emergency:   { fr: "Urgence", en: "Emergency", ar: "الطوارئ" },
  address:     { fr: "Adresse", en: "Address", ar: "العنوان" },
  gender:      { fr: "Genre", en: "Gender", ar: "الجنس" },
  birthDate:   { fr: "Date de naissance", en: "Birth date", ar: "تاريخ الميلاد" },
  age:         { fr: "Âge", en: "Age", ar: "العمر" },
  joined:      { fr: "Inscrit le", en: "Joined", ar: "تاريخ التسجيل" },
  group:       { fr: "Groupe", en: "Group", ar: "المجموعة" },
  teacher:     { fr: "Enseignant", en: "Teacher", ar: "المعلم" },
  level:       { fr: "Niveau", en: "Level", ar: "المستوى" },
  code:        { fr: "Code parent", en: "Parent code", ar: "رمز ولي الأمر" },
  copy:        { fr: "Copier", en: "Copy", ar: "نسخ" },
  copied:      { fr: "Copié !", en: "Copied!", ar: "تم النسخ!" },
  souratesMem: { fr: "Sourates mémorisées", en: "Memorized surahs", ar: "السور المحفوظة" },
  stars:       { fr: "Étoiles", en: "Stars", ar: "النجوم" },
  presence:    { fr: "Présence", en: "Attendance", ar: "الحضور" },
  nationality: { fr: "Nationalité", en: "Nationality", ar: "الجنسية" },
  spokenLanguages: { fr: "Langues parlées", en: "Spoken languages", ar: "اللغات المحكية" },
  currentSurah: { fr: "Sourah en cours", en: "Current surah", ar: "السورة الحالية" },
}

function t(key: string, locale: string = "fr"): string {
  return TEXTS[key]?.[locale] || TEXTS[key]?.fr || key
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé",
}

const NATIONALITY_MAP: Record<string, Record<string, string>> = {
  fr: { DZ: "Algérien(ne)", MA: "Marocain(e)", TN: "Tunisien(ne)", EG: "Égyptien(ne)", SA: "Saoudien(ne)", AE: "Émirien(ne)", QA: "Qatari(e)", KW: "Koweïtien(ne)", LB: "Libanais(e)", SY: "Syrien(ne)", IQ: "Irakien(ne)", JO: "Jordanien(ne)", PS: "Palestinien(ne)", SD: "Soudanais(e)", LY: "Libyen(ne)", MR: "Mauritanien(ne)", SO: "Somalien(ne)", TR: "Turc/Turque", CA: "Canadien(ne)" },
  en: { DZ: "Algerian", MA: "Moroccan", TN: "Tunisian", EG: "Egyptian", SA: "Saudi", AE: "Emirati", QA: "Qatari", KW: "Kuwaiti", LB: "Lebanese", SY: "Syrian", IQ: "Iraqi", JO: "Jordanian", PS: "Palestinian", SD: "Sudanese", LY: "Libyan", MR: "Mauritanian", SO: "Somali", TR: "Turkish", CA: "Canadian" },
  ar: { DZ: "جزائري(ة)", MA: "مغربي(ة)", TN: "تونسي(ة)", EG: "مصري(ة)", SA: "سعودي(ة)", AE: "إماراتي(ة)", QA: "قطري(ة)", KW: "كويتي(ة)", LB: "لبناني(ة)", SY: "سوري(ة)", IQ: "عراقي(ة)", JO: "أردني(ة)", PS: "فلسطيني(ة)", SD: "سوداني(ة)", LY: "ليبي(ة)", MR: "موريتاني(ة)", SO: "صومالي(ة)", TR: "تركي(ة)", CA: "كندي(ة)" },
}

const LANGUAGE_MAP: Record<string, Record<string, string>> = {
  fr: { ar: "Arabe", fr: "Français", en: "Anglais" },
  en: { ar: "Arabic", fr: "French", en: "English" },
  ar: { ar: "العربية", fr: "الفرنسية", en: "الإنجليزية" },
}

// ═══════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function InfoItem({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: React.ReactNode; color?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className={color || "text-gray-400"} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{value}</div>
      </div>
    </div>
  )
}

function StatRow({ icon: Icon, label, value, color, bg }: {
  icon: any; label: string; value: string | number; color: string; bg: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon size={20} className={color} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFER MODAL — Fusionné (ex-StudentGroupTransfer + TransferStudentModal)
// Utilisable depuis StudentDetailClient (bouton interne) OU depuis GroupStudentList (onClose prop)
// ═══════════════════════════════════════════════════════════════════════════

interface TransferModalProps {
  studentId: string
  studentName: string
  currentGroupId?: string | null
  currentGroupName?: string | null
  onClose?: () => void   // si fourni, modale contrôlée par le parent (ex: GroupStudentList)
}

export function TransferStudentModal({ studentId, studentName, currentGroupId, currentGroupName, onClose }: TransferModalProps) {
  const router = useRouter()
  const [open, setOpen]           = useState(!onClose) // autonome si pas de onClose
  const [groups, setGroups]       = useState<GroupOption[]>([])
  const [targetGroup, setTargetGroup] = useState("")
  const [reason, setReason]       = useState("")
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const isOpen = onClose ? true : open

  useEffect(() => {
    if (!isOpen) return
    fetch("/api/groups")
      .then(r => r.json())
      .then(d => setGroups((d.groups || []).filter((g: GroupOption) => g.id !== currentGroupId)))
  }, [isOpen, currentGroupId])

  const close = () => {
    if (onClose) { onClose() } else { setOpen(false) }
    setTargetGroup(""); setReason(""); setSuccess(false); setError(null)
  }

  const transfer = async () => {
    if (!targetGroup) { setError("Sélectionnez un groupe cible"); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/students/${studentId}?action=transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newGroupId: targetGroup, reason }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Erreur")
      setSuccess(true)
      setTimeout(() => { close(); router.refresh() }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  const selected = groups.find(g => g.id === targetGroup)

  // Trigger button (mode autonome uniquement)
  const TriggerButton = !onClose ? (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-tahfidz-green text-tahfidz-green rounded-lg hover:bg-tahfidz-green-light transition font-medium"
    >
      <ArrowRight size={13} /> Changer de groupe
    </button>
  ) : null

  if (!onClose && !open) return TriggerButton

  return (
    <>
      {TriggerButton}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <button onClick={close} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
              <X size={16} className="text-gray-400" />
            </button>

            {success ? (
              <div className="text-center py-4">
                <CheckCircle2 size={48} className="text-tahfidz-green mx-auto mb-3" />
                <p className="font-bold text-gray-800 dark:text-white">Transfert effectué !</p>
                <p className="text-sm text-gray-400 mt-1">Élève, parents et enseignants notifiés</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Changer de groupe</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Transférer <strong>{studentName}</strong> vers un autre groupe
                </p>

                {/* De → vers */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">Groupe actuel</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{currentGroupName || "Aucun"}</p>
                  </div>
                  <ArrowRight size={18} className="text-tahfidz-green flex-shrink-0" />
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">Nouveau groupe</p>
                    <p className="text-sm font-semibold text-tahfidz-green">{selected?.name || "—"}</p>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-3">{error}</p>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Groupe cible *</label>
                    <select
                      value={targetGroup}
                      onChange={e => setTargetGroup(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                    >
                      <option value="">— Sélectionner —</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id} disabled={g._count.students >= g.maxCapacity}>
                          {g.name} · {LEVEL_LABEL[g.level] ?? g.level} · {g.teacher.user.fullName} ({g._count.students}/{g.maxCapacity})
                          {g._count.students >= g.maxCapacity ? " — Complet" : ""}
                        </option>
                      ))}
                    </select>
                    {selected && (
                      <p className="mt-1 text-xs text-gray-400">
                        Enseignant : <span className="font-medium text-gray-600 dark:text-gray-300">{selected.teacher.user.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Raison (optionnel)</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="ex: niveau avancé, changement d'horaire…"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                    📢 Élève, parents, ancien et nouvel enseignant seront notifiés automatiquement.
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={close} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    Annuler
                  </button>
                  <button
                    onClick={transfer}
                    disabled={loading || !targetGroup}
                    className="flex-1 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    {loading ? "Transfert…" : "Transférer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT DETAIL CLIENT — Vue complète profil élève
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  student: Student
}

export function StudentDetailClient({ student }: Props) {
  const { locale } = useLanguage()
  const L = (locale || "fr") as "fr" | "en" | "ar"
  const [copied, setCopied] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(student.studentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const age = student.dateOfBirth ? calculateAge(student.dateOfBirth) : null

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/students" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-tahfidz-green/20 to-tahfidz-green/5 flex items-center justify-center border-2 border-tahfidz-green/20">
              <AvatarLightbox
                src={student.user.avatar}
                alt={student.user.fullName}
                fallback={<User size={28} className="text-tahfidz-green" />}
                className="w-full h-full"
                imgClassName="w-full h-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{student.user.fullName}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  student.user.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {student.user.isActive ? t("active", L) : t("inactive", L)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{student.user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 px-4 py-2 border border-tahfidz-green text-tahfidz-green text-sm font-medium rounded-xl hover:bg-tahfidz-green-light transition"
          >
            <ArrowRight size={16} />{t("transfer", L)}
          </button>
          <Link href={`/admin/students/${student.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
            <Pencil size={16} />{t("modify", L)}
          </Link>
          <Link href={`/admin/students/${student.id}/certificate`} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition">
            <Award size={16} />{t("certificate", L)}
          </Link>
          <Link href={`/admin/students/${student.id}/registration-card`} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition">
            <Printer size={16} />{t("registrationCard", L)}
          </Link>
          <Link href={`/admin/students/${student.id}/card`} className="flex items-center gap-2 px-4 py-2 bg-tahfidz-purple hover:bg-tahfidz-purple/90 text-white text-sm font-medium rounded-xl transition">
            <QrCode size={16} />{t("studentCard", L)}
          </Link>
        </div>
      </div>

      {/* ═══ GRID 3 COLONNES (2 + 1) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ═══ COLONNE GAUCHE (span-2) ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ─── Informations personnelles ─── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-tahfidz-green/10 flex items-center justify-center">
                <User size={18} className="text-tahfidz-green" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t("personalInfo", L)}</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <InfoItem icon={Mail} label={t("email", L)} value={student.user.email} />
              <InfoItem icon={Phone} label={t("phone", L)} value={student.user.phone || "—"} />
              <InfoItem icon={AlertCircle} label={t("emergency", L)} value={student.emergencyPhone || "—"} color="text-red-500" />
              <InfoItem icon={MapPin} label={t("address", L)} value={
                student.address
                  ? `${student.address}${student.city ? `, ${student.city}` : ""}${student.postalCode ? ` ${student.postalCode}` : ""}`
                  : "—"
              } />
              <InfoItem icon={User} label={t("gender", L)} value={student.user.gender || "—"} />
              <InfoItem icon={Calendar} label={t("birthDate", L)} value={
                student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("fr-FR") : "—"
              } />
              <InfoItem icon={Clock} label={t("age", L)} value={age !== null ? `${age} ${t("years", L)}` : "—"} />
              <InfoItem icon={Calendar} label={t("joined", L)} value={
                new Date(student.user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
              } />
              {student.nationality && (
                <InfoItem icon={Globe} label={t("nationality", L)} value={NATIONALITY_MAP[L]?.[student.nationality] ?? student.nationality} />
              )}
              {student.spokenLanguages && (
                <InfoItem icon={Languages} label={t("spokenLanguages", L)} value={
                  student.spokenLanguages.split(",").map(k => LANGUAGE_MAP[L]?.[k.trim()] ?? k.trim()).filter(Boolean).join(" · ")
                } />
              )}

            </div>
          </div>

          {/* ─── Scolaire ─── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <GraduationCap size={18} className="text-blue-500" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t("schoolInfo", L)}</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <InfoItem icon={GraduationCap} label={t("group", L)} value={student.group?.name || "—"} />
              <InfoItem icon={BarChart3} label={t("level", L)} value={student.group?.level || "—"} />
              <InfoItem icon={Users} label={t("teacher", L)} value={student.teacher?.user.fullName || "—"} />
              {student.currentSurahNote && (
                <InfoItem icon={BookOpen} label={t("currentSurah", L)} value={student.currentSurahNote} />
              )}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <KeyRound size={14} className="text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">{t("code", L)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{student.studentCode}</span>
                    <button onClick={handleCopy} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition">
                      {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 pb-4">
              <p className="text-xs text-gray-400">{t("shareCode", L)}</p>
            </div>
          </div>

          {/* ─── Médical ─── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Heart size={18} className="text-red-500" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t("medicalInfo", L)}</h2>
            </div>
            <div className="p-5">
              {student.medicalNotes ? (
                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">{student.medicalNotes}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">{t("noMedical", L)}</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div className="space-y-6">

          {/* Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-tahfidz-green/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-tahfidz-green" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t("stats", L)}</h2>
            </div>
            <div className="p-5 space-y-3">
              <StatRow icon={BookOpen} label={t("souratesMem", L)} value={student._count?.memorizedSurahs || 0} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" />
              <StatRow icon={Star} label={t("stars", L)} value={student.starsLogs?.length || 0} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" />
              <StatRow
                icon={CheckCircle}
                label={t("presence", L)}
                value={`${student.attendances?.filter((a: any) => a.status === "PRESENT").length || 0}/${student.attendances?.length || 0}`}
                color="text-green-500"
                bg="bg-green-50 dark:bg-green-900/20"
              />
            </div>
          </div>

          {/* Parents */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Users size={18} className="text-purple-500" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t("parents", L)}</h2>
            </div>
            <div className="p-5">
              {student.parentLinks && student.parentLinks.length > 0 ? (
                <div className="space-y-3">
                  {student.parentLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <User size={18} className="text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{link.parent.user.fullName}</p>
                        {link.parent.user.email && <p className="text-xs text-gray-400">{link.parent.user.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">{t("noParent", L)}</p>
                </div>
              )}

              {/* QR Code invitation parent */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <ParentInviteQR studentId={student.id} studentName={student.user.fullName} />
              </div>
            </div>
          </div>

          {/* Sourates mémorisées */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <BookOpen size={18} className="text-blue-500" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t("memorized", L)}</h2>
            </div>
            <div className="p-5">
              {student.memorizedSurahs && student.memorizedSurahs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {student.memorizedSurahs.map((m) => (
                    <span key={m.surahId} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">{m.surahId}</span>
                      {m.surah.nameFr}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">{t("noProgress", L)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL TRANSFERT ═══ */}
      {showTransfer && (
        <TransferStudentModal
          studentId={student.id}
          studentName={student.user.fullName}
          currentGroupId={student.group?.id}
          currentGroupName={student.group?.name}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  )
}
