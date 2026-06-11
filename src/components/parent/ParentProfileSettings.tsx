"use client"
import { useState } from "react"
import { useT } from "@/contexts/LanguageContext"
import { useSession } from "next-auth/react"
import { Loader2, Save, Lock, User, Phone, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react"

export function ParentProfileSettings() {
  const t = useT("parentProfileSettings")
  const { data: session, update } = useSession()

  const [profileForm, setProfileForm] = useState({
    fullName: (session?.user as any)?.name || "",
    fullNameAr: (session?.user as any)?.fullNameAr || "",
    phone: (session?.user as any)?.phone || "",
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [profileErr, setProfileErr] = useState<string | null>(null)

  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)
  const [pwdErr, setPwdErr] = useState<string | null>(null)

  const handleProfileSave = async () => {
    setProfileLoading(true)
    setProfileMsg(null)
    setProfileErr(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setProfileMsg(t("saved"))
      await update()
    } catch (e: any) {
      setProfileErr(e.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePwdSave = async () => {
    setPwdMsg(null)
    setPwdErr(null)
    if (pwdForm.newPassword.length < 8) {
      setPwdErr(t("pwdMin8"))
      return
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdErr(t("pwdMismatch"))
      return
    }
    setPwdLoading(true)
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setPwdMsg(t("pwdChanged"))
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (e: any) {
      setPwdErr(e.message)
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Édition profil */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <User size={16} className="text-emerald-600" /> {t("editProfile")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("fullName")}</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("fullNameAr")}</label>
            <input
              type="text"
              dir="rtl"
              value={profileForm.fullNameAr}
              onChange={(e) => setProfileForm((p) => ({ ...p, fullNameAr: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm arabic"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("phone")}</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleProfileSave}
            disabled={profileLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {profileLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {t("save")}
          </button>
          {profileMsg && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} />{profileMsg}</span>}
          {profileErr && <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{profileErr}</span>}
        </div>
      </div>

      {/* Changement mot de passe */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-blue-600" /> {t("changePassword")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("currentPassword")}</label>
            <div className="relative">
              <input
                type={showPwd.current ? "text" : "password"}
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabIndex={-1}
              >
                {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("newPassword")}</label>
            <div className="relative">
              <input
                type={showPwd.new ? "text" : "password"}
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabIndex={-1}
              >
                {showPwd.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("confirmPassword")}</label>
            <div className="relative">
              <input
                type={showPwd.confirm ? "text" : "password"}
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabIndex={-1}
              >
                {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handlePwdSave}
            disabled={pwdLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {pwdLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            {t("updatePassword")}
          </button>
          {pwdMsg && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} />{pwdMsg}</span>}
          {pwdErr && <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{pwdErr}</span>}
        </div>
      </div>
    </div>
  )
}
