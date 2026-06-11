"use client"
// src/components/shared/FeedbackModal.tsx
// Modal réutilisable pour signaler un bug / suggérer / commenter

import { useState, useRef } from "react"
import {
  X, Bug, Lightbulb, MessageSquare, Send, ImagePlus, Trash2,
  AlertTriangle, CheckCircle2, Loader2
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Props {
  isOpen: boolean
  onClose: () => void
  userRole: string
  userName: string
  userEmail: string
  schoolName?: string
}

const TYPE_OPTIONS = [
  { value: "BUG",        label: { fr: "Bug / Problème", en: "Bug / Issue", ar: "خطأ / مشكلة" },        icon: Bug,        color: "bg-red-50 text-red-600 border-red-200", active: "bg-red-500 text-white" },
  { value: "SUGGESTION", label: { fr: "Suggestion",     en: "Suggestion",  ar: "اقتراح" },            icon: Lightbulb,   color: "bg-amber-50 text-amber-600 border-amber-200", active: "bg-amber-500 text-white" },
  { value: "FEEDBACK",   label: { fr: "Commentaire",    en: "Feedback",      ar: "تعليق" },            icon: MessageSquare, color: "bg-blue-50 text-blue-600 border-blue-200", active: "bg-blue-500 text-white" },
  { value: "OTHER",      label: { fr: "Autre",          en: "Other",         ar: "آخر" },              icon: MessageSquare, color: "bg-gray-50 text-gray-600 border-gray-200", active: "bg-gray-500 text-white" },
]

const CATEGORY_OPTIONS = [
  { value: "UI",          label: { fr: "Interface / Design", en: "UI / Design",       ar: "واجهة / تصميم" } },
  { value: "PERFORMANCE", label: { fr: "Performance",        en: "Performance",       ar: "الأداء" } },
  { value: "FEATURE",     label: { fr: "Fonctionnalité",     en: "Feature",             ar: "ميزة" } },
  { value: "BUG",         label: { fr: "Bug technique",      en: "Technical bug",       ar: "خطأ تقني" } },
  { value: "OTHER",       label: { fr: "Autre",              en: "Other",               ar: "آخر" } },
]

export function FeedbackModal({ isOpen, onClose, userRole, userName, userEmail, schoolName }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("shared_feedbackModal")

  const [type, setType] = useState("BUG")
  const [category, setCategory] = useState("BUG")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError(L === "ar" ? "الصورة كبيرة جداً (الحد الأقصى 5 ميغابايت)" : L === "en" ? "Image too large (max 5MB)" : "Image trop grande (max 5 Mo)")
      return
    }
    setScreenshot(file)
    const reader = new FileReader()
    reader.onload = ev => setPreviewUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
    setError(null)
  }

  const removeImage = () => {
    setScreenshot(null)
    setPreviewUrl(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return

    setSending(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append("type", type)
      fd.append("category", category)
      fd.append("title", title.trim())
      fd.append("message", message.trim())
      if (screenshot) fd.append("screenshot", screenshot)

      const res = await fetch("/api/feedback", { method: "POST", body: fd })
      const data = await res.json()

      if (res.ok) {
        setSent(true)
        setTitle("")
        setMessage("")
        removeImage()
      } else {
        setError(data.error || t("error"))
      }
    } catch {
      setError(t("error"))
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setSent(false)
    setError(null)
    setTitle("")
    setMessage("")
    removeImage()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Bug size={18} className="text-red-500" /> {t("title")}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{t("subtitle")}</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <X size={20} />
          </button>
        </div>

        {sent ? (
          /* ── État succès ── */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{t("successTitle")}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("successMessage")}</p>
            <button onClick={handleClose} className="px-6 py-2.5 bg-tahfidz-green text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">
              {t("close")}
            </button>
          </div>
        ) : (
          /* ── Formulaire ── */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-sm flex items-center gap-2">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("typeLabel")}</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const isActive = type === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                        isActive ? opt.active : opt.color
                      }`}
                    >
                      <Icon size={14} />
                      {opt.label[L] ?? opt.label.fr}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("categoryLabel")}</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label[L] ?? cat.label.fr}</option>
                ))}
              </select>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("titleLabel")}</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("messageLabel")}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                rows={4}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green resize-none"
              />
            </div>

            {/* Screenshot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("screenshotLabel")}</label>
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain bg-gray-50 dark:bg-gray-800" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center gap-2 text-gray-400 hover:border-tahfidz-green hover:text-tahfidz-green transition"
                >
                  <ImagePlus size={24} />
                  <span className="text-sm">{t("screenshotLabel")}</span>
                  <span className="text-xs">{t("screenshotHint")}</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Coordonnées (lecture seule) */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("yourInfo")}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">{t("name")}:</span> <span className="text-gray-700 dark:text-gray-300 font-medium">{userName}</span></div>
                <div><span className="text-gray-400">{t("email")}:</span> <span className="text-gray-700 dark:text-gray-300 font-medium">{userEmail}</span></div>
                <div><span className="text-gray-400">{t("role")}:</span> <span className="text-gray-700 dark:text-gray-300 font-medium">{userRole}</span></div>
                {schoolName && <div><span className="text-gray-400">{t("school")}:</span> <span className="text-gray-700 dark:text-gray-300 font-medium">{schoolName}</span></div>}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={sending || !title.trim() || !message.trim()}
                className="flex-1 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {sending ? <><Loader2 size={14} className="animate-spin" /> {t("sending")}</> : <><Send size={14} /> {t("send")}</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}