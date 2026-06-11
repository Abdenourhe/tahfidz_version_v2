"use client"
// src/app/admin/admins/page.tsx — Manage administrators

import { useState, useEffect } from "react"

import { Shield, Plus, Mail, Phone, Calendar, Loader2, Trash2, AlertTriangle, X } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Admin {
  id: string; fullName: string; fullNameAr?: string | null
  email: string; phone?: string | null; isActive: boolean
  createdAt: string; lastLoginAt?: string | null
}

export default function AdminsPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("admins")

  const [admins,    setAdmins]    = useState<Admin[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  // Form state
  const [fullName,   setFullName]   = useState("")
  const [fullNameAr, setFullNameAr] = useState("")
  const [email,      setEmail]      = useState("")
  const [phone,      setPhone]      = useState("")
  const [password,   setPassword]   = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admins")
      const text = await res.text()
      const data = text ? JSON.parse(text) : { admins: [] }
      setAdmins(data.admins || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError(t("errorName")); return
    }
    if (password.length < 8) {
      setError(t("errorPwd")); return
    }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, fullNameAr, email, phone, password }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      setSuccess(true)
      setFullName(""); setFullNameAr(""); setEmail(""); setPhone(""); setPassword("")
      await load()
      setTimeout(() => { setShowForm(false); setSuccess(false) }, 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"))
    } finally { setSubmitting(false) }
  }

  const remove = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/admins/${id}`, { method: "DELETE" })
      setAdmins(p => p.filter(a => a.id !== id))
    } finally { setDeleting(null); setConfirmId(null) }
  }

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(
      L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
      { day: "2-digit", month: "short", year: "numeric" }
    ) : "—"

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <Shield size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{admins.length} {t("subtitle")}{admins.length > 1 ? (L === "fr" ? "s" : L === "en" ? "s" : "") : ""}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition">
          <Plus size={15} />{showForm ? t("close") : t("add")}
        </button>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("newAccount")}</h2>

          {error && <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <X size={13}/>{error}
          </div>}
          {success && <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
            ✓ {t("createdSuccess")}
          </div>}

          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("name")}</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={L === "ar" ? "أحمد بن علي" : L === "en" ? "Ahmed Ben Ali" : "Ahmed Ben Ali"}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("nameAr")}</label>
                <input value={fullNameAr} onChange={e => setFullNameAr(e.target.value)} dir="rtl" placeholder="أحمد بن علي"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm arabic focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("email")}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@tahfidz.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("phone")}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+212 6 12 34 56 78"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("password")}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle size={14} className="flex-shrink-0"/>
              {t("warning")}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">{t("cancel")}</button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={14} className="animate-spin"/> : <Shield size={14}/>}
                {submitting ? t("creating") : t("create")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <Shield size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400">{t("noAdmin")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map(admin => (
            <div key={admin.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{admin.fullName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{admin.fullName}</p>
                    {admin.fullNameAr && <span className="arabic text-sm text-gray-400">{admin.fullNameAr}</span>}
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">{t("admin")}</span>
                    {!admin.isActive && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{t("inactive")}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                    <a href={`mailto:${admin.email}`} className="flex items-center gap-1 hover:text-blue-600 transition">
                      <Mail size={11}/>{admin.email}
                    </a>
                    {admin.phone && (
                      <a href={`tel:${admin.phone}`} className="flex items-center gap-1 hover:text-blue-600 transition">
                        <Phone size={11}/>{admin.phone}
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11}/>{t("created")} {fmtDate(admin.createdAt)}
                    </span>
                    {admin.lastLoginAt && (
                      <span>· {t("lastLogin")} {fmtDate(admin.lastLoginAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {confirmId === admin.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => remove(admin.id)} disabled={deleting === admin.id}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                        {deleting === admin.id ? <Loader2 size={11} className="animate-spin"/> : t("confirm")}
                      </button>
                      <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("cancel2")}</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(admin.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                      <Trash2 size={11}/>{t("delete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
