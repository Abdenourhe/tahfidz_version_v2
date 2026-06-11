"use client"
// src/components/admin/AdminSettingsClient.tsx

import { useState, useEffect, useRef } from "react"
import { Loader2, Save, CheckCircle2, Eye, EyeOff, User, Lock, Globe, Bell, Database, Moon, Sun, ExternalLink, Building2, Upload, Trash2, Image } from "lucide-react"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/contexts/LanguageContext"
import type { Locale } from "@/lib/i18n/translations"

interface Props {
  user: { name: string; email: string }
  school?: { name: string; nameAr?: string | null; logo?: string | null; directorSignature?: string | null; teacherSignature?: string | null; address?: string | null; city?: string | null; country?: string | null; phone?: string | null }
}
type TabId = "profile" | "security" | "school" | "appearance" | "notifications" | "system"

const LANGUAGES = [
  { code: "fr" as Locale, label: "Français", abbr: "FR" },
  { code: "en" as Locale, label: "English",  abbr: "EN" },
  { code: "ar" as Locale, label: "العربية",  abbr: "AR" },
]

export function AdminSettingsClient({ user, school }: Props) {
  const { locale, setLocale, useT: tFn } = useLanguage()
  const tS  = (k: string) => tFn("settings", k)
  const tC  = (k: string) => tFn("common", k)

  // Tabs traduits dynamiquement
  const TABS: { id: TabId; labelKey: string; icon: typeof User }[] = [
    { id: "profile",       labelKey: "profile",       icon: User },
    { id: "security",      labelKey: "security",      icon: Lock },
    { id: "school",        labelKey: "school",        icon: Building2 },
    { id: "appearance",    labelKey: "appearance",    icon: Globe },
    { id: "notifications", labelKey: "notifications", icon: Bell },
    { id: "system",        labelKey: "system",        icon: Database },
  ]

  const [tab, setTab] = useState<TabId>("profile")

  // Profile
  const [fullName, setFullName] = useState(user.name)
  const [fullNameAr, setFullNameAr] = useState("")
  const [phone, setPhone] = useState("")
  const [pSaving, setPSaving] = useState(false)
  const [pSaved, setPSaved] = useState(false)
  const [pErr, setPErr] = useState<string | null>(null)

  // Password
  const [curPwd, setCurPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confPwd, setConfPwd] = useState("")
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdSaved, setPwdSaved] = useState(false)
  const [pwdErr, setPwdErr] = useState<string | null>(null)

  // Appearance
  const [darkMode, setDarkMode] = useState(false)
  const [appearanceMsg, setAppearanceMsg] = useState<string | null>(null)

  // Notifications prefs
  const [notifPrefs, setNotifPrefs] = useState({
    studentAdded: true, presence: true, absence: true, memorization: true, evaluation: true,
    examReminder: true, parentLink: true, transfer: true, message: true, badge: false, weeklyReport: false,
  })
  const [notifSaved, setNotifSaved] = useState(false)

  // School info
  const [schoolName, setSchoolName] = useState(school?.name || "")
  const [schoolNameAr, setSchoolNameAr] = useState(school?.nameAr || "")
  const [schoolAddress, setSchoolAddress] = useState(school?.address || "")
  const [schoolCity, setSchoolCity] = useState(school?.city || "")
  const [schoolCountry, setSchoolCountry] = useState(school?.country || "DZ")
  const [schoolPhone, setSchoolPhone] = useState(school?.phone || "")
  const [schoolSaving, setSchoolSaving] = useState(false)
  const [schoolSaved, setSchoolSaved] = useState(false)
  const [schoolErr, setSchoolErr] = useState<string | null>(null)
  const [pendingRequest, setPendingRequest] = useState<any | null>(null)
  const [_loadingPending, setLoadingPending] = useState(true)

  // School / Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(school?.logo ?? null)
  const [logoPreview, setLogoPreview] = useState<string | null>(school?.logo ?? null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoMsg, setLogoMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Signatures
  const [directorSig, setDirectorSig] = useState<string | null>(school?.directorSignature ?? null)
  const [teacherSig, setTeacherSig] = useState<string | null>(school?.teacherSignature ?? null)
  const [sigUploading, setSigUploading] = useState(false)
  const [sigMsg, setSigMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const dirSigRef = useRef<HTMLInputElement>(null)
  const teachSigRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    setDarkMode(savedTheme === "dark")
    // Load notification prefs from API
    fetch("/api/profile/notifications")
      .then(r => r.json())
      .then(d => {
        if (d.prefs) setNotifPrefs(d.prefs)
      })
      .catch(() => {
        // fallback to localStorage
        const saved = localStorage.getItem("notifPrefs")
        if (saved) try { setNotifPrefs(JSON.parse(saved)) } catch {}
      })
    // Load pending school update request
    fetch("/api/admin/school")
      .then(r => r.json())
      .then(d => {
        setPendingRequest(d.pending || null)
      })
      .catch(() => setPendingRequest(null))
      .finally(() => setLoadingPending(false))
  }, [])

  const toggleDark = (on: boolean) => {
    setDarkMode(on)
    if (on) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
    const which = on ? tS("themeDark") : tS("themeLight")
    setAppearanceMsg(`${tS("themeApplied")} ${which}`)
    setTimeout(() => setAppearanceMsg(null), 2500)
  }

  const switchLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    const msg =
      newLocale === "fr" ? "Langue : Français" :
      newLocale === "en" ? "Language: English" :
      "اللغة: العربية"
    setAppearanceMsg(msg)
    setTimeout(() => setAppearanceMsg(null), 2500)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setPSaving(true); setPErr(null)
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, fullNameAr, phone }),
      })
      if (!r.ok) throw new Error(tC("error"))
      setPSaved(true); setTimeout(() => setPSaved(false), 3000)
    } catch (e) {
      setPErr(e instanceof Error ? e.message : tC("error"))
    } finally { setPSaving(false) }
  }

  const changePwd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confPwd) { setPwdErr(tS("pwdMismatch")); return }
    if (newPwd.length < 8)  { setPwdErr(tS("pwdMinLength")); return }
    setPwdSaving(true); setPwdErr(null)
    try {
      const r = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || tC("error"))
      setPwdSaved(true); setCurPwd(""); setNewPwd(""); setConfPwd("")
      setTimeout(() => setPwdSaved(false), 3000)
      // Deconnexion automatique apres changement de mot de passe
      setTimeout(() => {
        signOut({ callbackUrl: "/login" })
      }, 1500)
    } catch (e) {
      setPwdErr(e instanceof Error ? e.message : tC("error"))
    } finally { setPwdSaving(false) }
  }

  const saveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSchoolSaving(true); setSchoolErr(null)
    try {
      const r = await fetch("/api/admin/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: schoolName,
          nameAr: schoolNameAr,
          address: schoolAddress,
          city: schoolCity,
          country: schoolCountry,
          phone: schoolPhone,
        }),
      })
      if (!r.ok) throw new Error("Erreur lors de la sauvegarde")
      setSchoolSaved(true); setTimeout(() => setSchoolSaved(false), 3000)
    } catch (e) {
      setSchoolErr(e instanceof Error ? e.message : "Erreur")
    } finally { setSchoolSaving(false) }
  }

  const saveNotifPrefs = async () => {
    try {
      const r = await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: notifPrefs }),
      })
      if (!r.ok) throw new Error()
      localStorage.setItem("notifPrefs", JSON.stringify(notifPrefs))
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 3000)
    } catch {
      // still save to localStorage as fallback
      localStorage.setItem("notifPrefs", JSON.stringify(notifPrefs))
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 3000)
    }
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
    setLogoMsg(null)
  }

  const uploadLogo = async () => {
    if (!logoFile) return
    setLogoUploading(true); setLogoMsg(null)
    try {
      const fd = new FormData()
      fd.append("logo", logoFile)
      const r = await fetch("/api/admin/school/logo", { method: "POST", body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || tC("error"))
      setLogoUrl(d.logo); setLogoFile(null)
      setLogoMsg({ type: "ok", text: tS("logoUpdated") })
    } catch (e) {
      setLogoMsg({ type: "err", text: e instanceof Error ? e.message : tC("error") })
    } finally { setLogoUploading(false) }
  }

  const deleteLogo = async () => {
    if (!confirm(tS("deleteLogo") + " ?")) return
    setLogoUploading(true)
    try {
      const r = await fetch("/api/admin/school/logo", { method: "DELETE" })
      if (!r.ok) throw new Error(tC("error"))
      setLogoUrl(null); setLogoPreview(null); setLogoFile(null)
      setLogoMsg({ type: "ok", text: tS("logoDeleted") })
    } catch {
      setLogoMsg({ type: "err", text: tC("error") })
    } finally { setLogoUploading(false) }
  }

  const uploadSignatures = async (type: "director" | "teacher", file: File) => {
    setSigUploading(true); setSigMsg(null)
    try {
      const fd = new FormData()
      fd.append(type, file)
      const r = await fetch("/api/admin/school/signatures", { method: "POST", body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || tC("error"))
      if (type === "director") setDirectorSig(d.directorSignature)
      if (type === "teacher") setTeacherSig(d.teacherSignature)
      setSigMsg({ type: "ok", text: tS("signaturesUpdated") || "Signatures mises à jour" })
    } catch (e) {
      setSigMsg({ type: "err", text: e instanceof Error ? e.message : tC("error") })
    } finally { setSigUploading(false) }
  }

  const deleteSignature = async (type: "director" | "teacher") => {
    if (!confirm((type === "director" ? tS("deleteDirSig") || "Supprimer signature directeur" : tS("deleteTeachSig") || "Supprimer signature enseignant") + " ?")) return
    setSigUploading(true)
    try {
      const r = await fetch(`/api/admin/school/signatures?type=${type}`, { method: "DELETE" })
      if (!r.ok) throw new Error(tC("error"))
      if (type === "director") setDirectorSig(null)
      if (type === "teacher") setTeacherSig(null)
      setSigMsg({ type: "ok", text: tS("signatureDeleted") || "Signature supprimée" })
    } catch {
      setSigMsg({ type: "err", text: tC("error") })
    } finally { setSigUploading(false) }
  }

  // Notification items — traduits selon locale
  const notifItems = [
    { key: "studentAdded", label:
        locale === "ar" ? "طالب جديد مسجّل" : locale === "en" ? "New student enrolled" : "Nouvel élève inscrit",
      desc: locale === "ar" ? "عند إضافة طالب جديد" : locale === "en" ? "When a new student is added" : "Quand un nouvel élève est ajouté" },
    { key: "memorization", label:
        locale === "ar" ? "حفظ مُصادَق عليه" : locale === "en" ? "Memorization validated" : "Mémorisation validée",
      desc: locale === "ar" ? "عند مصادقة المعلم" : locale === "en" ? "When a teacher approves memorization" : "Quand un enseignant approuve une mémorisation" },
    { key: "presence", label:
        locale === "ar" ? "حضور مُسجَّل" : locale === "en" ? "Presence reported" : "Présence signalée",
      desc: locale === "ar" ? "عند تسجيل حضور طالب" : locale === "en" ? "When a student is marked present" : "Quand un élève est marqué présent" },
    { key: "absence", label:
        locale === "ar" ? "غياب مُسجَّل" : locale === "en" ? "Absence reported" : "Absence signalée",
      desc: locale === "ar" ? "عند تسجيل غياب طالب" : locale === "en" ? "When a student is marked absent" : "Quand un élève est marqué absent" },
    { key: "evaluation", label:
        locale === "ar" ? "تقييم جديد" : locale === "en" ? "New evaluation" : "Nouvelle évaluation",
      desc: locale === "ar" ? "عند تسليم تقييم" : locale === "en" ? "When an evaluation is submitted" : "Quand une évaluation est soumise" },
    { key: "examReminder", label:
        locale === "ar" ? "تذكير بالاختبار" : locale === "en" ? "Exam reminder" : "Rappel d'examen",
      desc: locale === "ar" ? "قبل 24 ساعة من الاختبار" : locale === "en" ? "24h before a scheduled exam" : "24h avant un examen planifié" },
    { key: "parentLink", label:
        locale === "ar" ? "ربط ولي أمر بطالب" : locale === "en" ? "New parent-student link" : "Nouveau lien parent-élève",
      desc: locale === "ar" ? "عند ربط ولي أمر بطالب" : locale === "en" ? "When a parent links to a student" : "Quand un parent se lie à un élève" },
    { key: "transfer", label:
        locale === "ar" ? "نقل طالب" : locale === "en" ? "Student transfer" : "Transfert d'élève",
      desc: locale === "ar" ? "عند تغيير مجموعة الطالب" : locale === "en" ? "When a student changes group" : "Quand un élève change de groupe" },
    { key: "message", label:
        locale === "ar" ? "رسالة واردة" : locale === "en" ? "Message received" : "Message reçu",
      desc: locale === "ar" ? "عند استقبال رسالة مباشرة" : locale === "en" ? "When you receive a direct message" : "Quand vous recevez un message direct" },
    { key: "badge", label:
        locale === "ar" ? "شارة مُمنوحة" : locale === "en" ? "Badge awarded" : "Badge attribué",
      desc: locale === "ar" ? "عند حصول طالب على شارة" : locale === "en" ? "When a student earns a badge" : "Quand un élève obtient un badge" },
    { key: "weeklyReport", label:
        locale === "ar" ? "تقرير أسبوعي" : locale === "en" ? "Weekly report" : "Rapport hebdomadaire",
      desc: locale === "ar" ? "ملخص أسبوعي (الاثنين صباحاً)" : locale === "en" ? "Weekly summary (Monday morning)" : "Résumé hebdomadaire (lundi matin)" },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tS("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tS("subtitle")}</p>
      </div>

      <div className="flex gap-6 flex-wrap md:flex-nowrap">
        {/* Tabs sidebar */}
        <div className="w-full md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-left ${tab === t.id ? "bg-tahfidz-green-light text-tahfidz-green font-semibold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <t.icon size={16} className={tab === t.id ? "text-tahfidz-green" : "text-gray-400"} />
                {tS(t.labelKey)}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">

          {/* ─── PROFIL ─── */}
          {tab === "profile" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">{tS("personalInfo")}</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl gradient-tahfidz flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {tS("administrator")}
                  </span>
                </div>
              </div>
              {pErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{pErr}</div>}
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tS("fullName")}</label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tS("fullNameAr")}</label>
                    <input value={fullNameAr} onChange={e => setFullNameAr(e.target.value)} dir="rtl"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm arabic focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tC("phone")}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={pSaving}
                    className="flex items-center gap-2 px-5 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition">
                    {pSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {tC("save")}
                  </button>
                  {pSaved && <span className="flex items-center gap-1.5 text-sm text-tahfidz-green font-medium"><CheckCircle2 size={16} />{tC("saved")}</span>}
                </div>
              </form>
            </div>
          )}

          {/* ─── SÉCURITÉ ─── */}
          {tab === "security" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">{tS("changePassword")}</h2>
              {pwdErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{pwdErr}</div>}
              <form onSubmit={changePwd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tS("currentPwd")}</label>
                  <div className="relative">
                    <input type={showCur ? "text" : "password"} value={curPwd} onChange={e => setCurPwd(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    <button type="button" onClick={() => setShowCur(!showCur)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tS("newPwd")}</label>
                  <div className="relative">
                    <input type={showNew ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tS("confirmPwd")}</label>
                  <div className="relative">
                    <input type={showConf ? "text" : "password"} value={confPwd} onChange={e => setConfPwd(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={pwdSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-60 transition">
                    {pwdSaving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                    {tS("change")}
                  </button>
                  {pwdSaved && <span className="flex items-center gap-1.5 text-sm text-tahfidz-green font-medium"><CheckCircle2 size={16} />{tS("pwdUpdated")}</span>}
                </div>
              </form>
            </div>
          )}

          {/* ─── ÉCOLE ─── */}
          {tab === "school" && (
            <div className="space-y-4">
              {/* Pending request alert */}
              {pendingRequest && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="text-xl shrink-0">⏳</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      {locale === "ar" ? "طلب قيد الانتظار" : locale === "en" ? "Request pending" : "Demande en attente de validation"}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      {locale === "ar"
                        ? "تم إرسال طلب تعديل معلومات مدرستك إلى المشرف العام. سيتم إشعارك عند الموافقة أو الرفض."
                        : locale === "en"
                        ? "A request to update your school information has been sent to the superadmin. You will be notified when it is approved or rejected."
                        : "Une demande de modification des informations de votre école a été envoyée au superadmin. Vous serez notifié lors de l'approbation ou du rejet."}
                    </p>
                  </div>
                </div>
              )}

              {/* School info form */}
              <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-5 transition-opacity ${pendingRequest ? "opacity-60" : ""}`}>
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                  {locale === "ar" ? "معلومات المدرسة" : locale === "en" ? "School information" : "Informations de l'école"}
                </h2>
                {schoolErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{schoolErr}</div>}
                <form onSubmit={saveSchoolInfo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tC("name")}</label>
                      <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {locale === "ar" ? "الاسم بالعربية" : locale === "en" ? "Name (Arabic)" : "Nom (arabe)"}
                      </label>
                      <input value={schoolNameAr} onChange={e => setSchoolNameAr(e.target.value)} dir="rtl"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm arabic focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {locale === "ar" ? "العنوان" : locale === "en" ? "Address" : "Adresse"}
                      </label>
                      <input value={schoolAddress} onChange={e => setSchoolAddress(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {locale === "ar" ? "المدينة" : locale === "en" ? "City" : "Ville"}
                      </label>
                      <input value={schoolCity} onChange={e => setSchoolCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {locale === "ar" ? "البلد" : locale === "en" ? "Country" : "Pays"}
                      </label>
                      <input value={schoolCountry} onChange={e => setSchoolCountry(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tC("phone")}</label>
                      <input value={schoolPhone} onChange={e => setSchoolPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={schoolSaving || !!pendingRequest}
                      className="flex items-center gap-2 px-5 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition">
                      {schoolSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {pendingRequest
                        ? (locale === "ar" ? "قيد الانتظار" : locale === "en" ? "Pending" : "En attente")
                        : tC("save")}
                    </button>
                    {schoolSaved && <span className="flex items-center gap-1.5 text-sm text-tahfidz-green font-medium"><CheckCircle2 size={16} />{tC("saved")}</span>}
                  </div>
                </form>
              </div>

              {/* Logo */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">{tS("schoolLogo")}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{tS("schoolLogoDesc")}</p>
                </div>

                {logoMsg && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${logoMsg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                    {logoMsg.type === "ok" ? <CheckCircle2 size={15} /> : null}
                    {logoMsg.text}
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo école" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Image size={28} className="mx-auto mb-1" />
                        <p className="text-xs">{tS("noLogo")}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{school?.name || tC("noData")}</p>
                    <p className="text-xs text-gray-400">{tS("formats")}</p>
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        <Upload size={14} />
                        {logoUrl ? tS("changeLogo") : tS("chooseLogo")}
                      </button>
                      {logoUrl && (
                        <button onClick={deleteLogo} disabled={logoUploading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                          <Trash2 size={14} />
                          {tS("deleteLogo")}
                        </button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoSelect} />
                  </div>
                </div>

                {logoFile && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                      {tS("fileSelected")} <span className="font-medium">{logoFile.name}</span>
                    </p>
                    <button onClick={uploadLogo} disabled={logoUploading}
                      className="flex items-center gap-2 px-4 py-2 gradient-tahfidz text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition">
                      {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {tC("save")}
                    </button>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                    {locale === "ar" ? "التوقيعات" : locale === "en" ? "Signatures" : "Signatures"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {locale === "ar" ? "صور شفافة (.png) مُستَحسَنة" : locale === "en" ? "Transparent images (.png) recommended" : "Images transparentes (.png) recommandées"}
                  </p>
                </div>
                {sigMsg && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${sigMsg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                    {sigMsg.type === "ok" ? <CheckCircle2 size={15} /> : null}
                    {sigMsg.text}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Director signature */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {locale === "ar" ? "توقيع المدير" : locale === "en" ? "Director signature" : "Signature du directeur"}
                    </p>
                    <div className="w-full h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden mb-2">
                      {directorSig ? (
                        <img src={directorSig} alt="Director" className="h-full object-contain p-2" />
                      ) : (
                        <span className="text-xs text-gray-400">
                          {locale === "ar" ? "لا توجد توقيع" : locale === "en" ? "No signature" : "Aucune signature"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => dirSigRef.current?.click()} disabled={sigUploading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg hover:bg-gray-200 transition">
                        <Upload size={12} />
                        {directorSig ? (locale === "ar" ? "تغيير" : locale === "en" ? "Change" : "Changer") : (locale === "ar" ? "إضافة" : locale === "en" ? "Add" : "Ajouter")}
                      </button>
                      {directorSig && (
                        <button onClick={() => deleteSignature("director")} disabled={sigUploading}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition">
                          <Trash2 size={12} />
                          {locale === "ar" ? "حذف" : locale === "en" ? "Delete" : "Supprimer"}
                        </button>
                      )}
                    </div>
                    <input ref={dirSigRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadSignatures("director", f)
                      }} />
                  </div>

                  {/* Teacher signature */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {locale === "ar" ? "توقيع المعلم" : locale === "en" ? "Teacher signature" : "Signature de l'enseignant"}
                    </p>
                    <div className="w-full h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden mb-2">
                      {teacherSig ? (
                        <img src={teacherSig} alt="Teacher" className="h-full object-contain p-2" />
                      ) : (
                        <span className="text-xs text-gray-400">
                          {locale === "ar" ? "لا توجد توقيع" : locale === "en" ? "No signature" : "Aucune signature"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => teachSigRef.current?.click()} disabled={sigUploading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg hover:bg-gray-200 transition">
                        <Upload size={12} />
                        {teacherSig ? (locale === "ar" ? "تغيير" : locale === "en" ? "Change" : "Changer") : (locale === "ar" ? "إضافة" : locale === "en" ? "Add" : "Ajouter")}
                      </button>
                      {teacherSig && (
                        <button onClick={() => deleteSignature("teacher")} disabled={sigUploading}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition">
                          <Trash2 size={12} />
                          {locale === "ar" ? "حذف" : locale === "en" ? "Delete" : "Supprimer"}
                        </button>
                      )}
                    </div>
                    <input ref={teachSigRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadSignatures("teacher", f)
                      }} />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    {locale === "ar" ? "شهادات الطلاب" : locale === "en" ? "Student Certificates" : "Certificats d'élèves"}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {locale === "ar"
                      ? "لطباعة شهادة، انتقل إلى ملف الطالب وانقر على «طباعة الشهادة». سيُضاف شعار مدرستك تلقائياً."
                      : locale === "en"
                      ? "To print a certificate, go to a student's profile and click \"Print certificate\". Your school logo will be added automatically."
                      : "Pour imprimer un certificat, allez sur la fiche d'un élève et cliquez sur \"Imprimer le certificat\". Le logo de votre école s'ajoutera automatiquement."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── APPARENCE ─── */}
          {tab === "appearance" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">{tS("appearanceTitle")}</h2>

              {appearanceMsg && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                  <CheckCircle2 size={14} />{appearanceMsg}
                </div>
              )}

              {/* Langue */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{tS("language")}</p>
                <div className="grid grid-cols-3 gap-3">
                  {LANGUAGES.map(lang => {
                    const active = locale === lang.code
                    return (
                      <button key={lang.code} onClick={() => switchLocale(lang.code)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition ${active ? "border-tahfidz-green bg-tahfidz-green-light" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"}`}>
                        <span className={`w-9 h-7 rounded-md text-xs font-bold flex items-center justify-center flex-shrink-0 ${active ? "bg-tahfidz-green text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                          {lang.abbr}
                        </span>
                        <span className={`text-sm font-medium ${active ? "text-tahfidz-green" : "text-gray-700 dark:text-gray-200"} ${lang.code === "ar" ? "arabic" : ""}`}>
                          {lang.label}
                        </span>
                        {active && <span className="ml-auto text-tahfidz-green text-xs font-bold">✓</span>}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-400">{tS("langArabicNote")}</p>
              </div>

              {/* Thème */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{tS("theme")}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "light", labelKey: "lightMode", descKey: "lightModeDesc", icon: Sun },
                    { id: "dark",  labelKey: "darkMode",  descKey: "darkModeDesc",  icon: Moon },
                  ].map(theme => (
                    <button key={theme.id} onClick={() => toggleDark(theme.id === "dark")}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition ${(theme.id === "dark") === darkMode ? "border-tahfidz-green bg-tahfidz-green-light" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
                      <theme.icon size={20} className={(theme.id === "dark") === darkMode ? "text-tahfidz-green" : "text-gray-400"} />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tS(theme.labelKey)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{tS(theme.descKey)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* TV */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tS("tvMode")}</p>
                <p className="text-sm text-gray-500 mb-3">{tS("tvModeDesc")}</p>
                <a href="/display" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition">
                  📺 {tS("openTv")} <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {tab === "notifications" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">{tS("notifications")}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{tS("notifDesc")}</p>
                </div>
                <button onClick={saveNotifPrefs}
                  className="flex items-center gap-2 px-4 py-2 gradient-tahfidz text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
                  <Save size={14} />
                  {tC("save")}
                </button>
              </div>
              {notifSaved && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle2 size={14} /> Préférences enregistrées
                </div>
              )}
              <div className="space-y-1">
                {notifItems.map(item => {
                  const enabled = notifPrefs[item.key as keyof typeof notifPrefs] ?? true
                  return (
                    <div key={item.key}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifPrefs(prev => ({ ...prev, [item.key]: !enabled }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-tahfidz-green" : "bg-gray-200 dark:bg-gray-700"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
