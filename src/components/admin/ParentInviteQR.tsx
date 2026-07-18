"use client"
// src/components/admin/ParentInviteQR.tsx

import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { QRCodeSVG } from "qrcode.react"
import {
  QrCode, X, Copy, CheckCircle2, Share2, RefreshCw,
  Loader2, UserPlus, CheckCircle, AlertTriangle, Mail,
} from "lucide-react"

interface InviteData {
  inviteUrl: string
  qrValue: string
  studentName: string
  studentNameAr?: string | null
  expiresAt: string | Date
  used: boolean
  usedAt?: string | Date | null
}

interface Props {
  studentId: string
  studentName: string
}

const TEXTS: Record<string, Record<string, string>> = {
  inviteParent:  { fr: "Inviter un parent", en: "Invite a parent", ar: "دعوة ولي أمر" },
  title:         { fr: "Invitation parent", en: "Parent invitation", ar: "دعوة ولي الأمر" },
  scanToRegister:{ fr: "Scannez ce QR code pour inscrire le parent", en: "Scan this QR code to register the parent", ar: "امسح رمز الاستجابة السريعة لتسجيل الولي" },
  orUseLink:     { fr: "Ou utilisez ce lien", en: "Or use this link", ar: "أو استخدم هذا الرابط" },
  copy:          { fr: "Copier", en: "Copy", ar: "نسخ" },
  copied:        { fr: "Copié !", en: "Copied!", ar: "تم النسخ!" },
  share:         { fr: "Partager", en: "Share", ar: "مشاركة" },
  regenerate:    { fr: "Régénérer", en: "Regenerate", ar: "إعادة إنشاء" },
  alreadyUsed:   { fr: "Déjà inscrit", en: "Already registered", ar: "مسجل بالفعل" },
  usedAt:        { fr: "Inscrit le", en: "Registered on", ar: "مسجل في" },
  expires:       { fr: "Expire le", en: "Expires on", ar: "تنتهي في" },
  close:         { fr: "Fermer", en: "Close", ar: "إغلاق" },
  loading:       { fr: "Chargement…", en: "Loading…", ar: "جارٍ التحميل…" },
  error:         { fr: "Erreur lors du chargement", en: "Loading error", ar: "خطأ في التحميل" },
  // Nouvelles clés pour l'envoi par email
  sendByEmail:   { fr: "Envoyer par email", en: "Send by email", ar: "إرسال بالبريد الإلكتروني" },
  parentEmail:   { fr: "Email du parent", en: "Parent email", ar: "بريد ولي الأمر" },
  parentName:    { fr: "Nom du parent (optionnel)", en: "Parent name (optional)", ar: "اسم ولي الأمر (اختياري)" },
  send:          { fr: "Envoyer", en: "Send", ar: "إرسال" },
  sending:       { fr: "Envoi…", en: "Sending…", ar: "جارٍ الإرسال…" },
  sentSuccess:   { fr: "Invitation envoyée !", en: "Invitation sent!", ar: "تم إرسال الدعوة!" },
  emailError:    { fr: "Erreur lors de l'envoi", en: "Sending error", ar: "خطأ في الإرسال" },
  emailNotConfigured: { fr: "Envoi d'emails non configuré", en: "Email sending not configured", ar: "إرسال البريد غير مهيأ" },
}

function t(key: string, locale: string = "fr"): string {
  return TEXTS[key]?.[locale] || TEXTS[key]?.fr || key
}

export function ParentInviteQR({ studentId, studentName }: Props) {
  const { locale } = useLanguage()
  const L = (locale || "fr") as "fr" | "en" | "ar"
  const isRtl = L === "ar"

  const [open, setOpen] = useState(false)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [parentEmail, setParentEmail] = useState("")
  const [parentName, setParentName] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const fetchInvite = useCallback(async () => {
    setLoading(true)
    setError(null)
    setEmailResult(null)
    try {
      const res = await fetch(`/api/students/${studentId}/parent-invite`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t("error", L))
      setInvite(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error", L))
    } finally {
      setLoading(false)
    }
  }, [studentId, L])

  useEffect(() => {
    if (open) fetchInvite()
  }, [open, fetchInvite])

  const handleCopy = () => {
    if (!invite?.inviteUrl) return
    navigator.clipboard.writeText(invite.inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!invite?.inviteUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Invitation TAHFIDZ",
          text: `Rejoignez TAHFIDZ pour suivre ${studentName}`,
          url: invite.inviteUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy()
    }
  }

  const handleRegenerate = async () => {
    setLoading(true)
    try {
      await fetchInvite()
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentEmail || !invite?.inviteUrl) return

    setSendingEmail(true)
    setEmailResult(null)
    try {
      const res = await fetch(`/api/students/${studentId}/parent-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail, parentName }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error(t("emailNotConfigured", L))
        }
        throw new Error(data.error || t("emailError", L))
      }
      setEmailResult({ type: "success", message: t("sentSuccess", L) })
      setParentEmail("")
      setParentName("")
    } catch (err) {
      setEmailResult({
        type: "error",
        message: err instanceof Error ? err.message : t("emailError", L),
      })
    } finally {
      setSendingEmail(false)
    }
  }

  const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
    })

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition"
        title={t("inviteParent", L)}
      >
        <QrCode size={16} />
        <span className="hidden sm:inline">{t("inviteParent", L)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isRtl ? "rtl" : "ltr"}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <X size={16} className="text-gray-400" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-3">
                <UserPlus size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("title", L)}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{studentName}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin text-purple-600" />
                <span className="ml-2 text-sm text-gray-500">{t("loading", L)}</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                <AlertTriangle size={16} />
                {error}
              </div>
            ) : invite ? (
              <div className="space-y-5">
                {invite.used ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl text-center">
                    <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-700 dark:text-green-400">{t("alreadyUsed", L)}</p>
                    {invite.usedAt && (
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        {t("usedAt", L)} : {fmtDate(invite.usedAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <QRCodeSVG value={invite.qrValue} size={200} level="H" />
                      </div>
                    </div>

                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      {t("scanToRegister", L)}
                    </p>

                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">{t("orUseLink", L)}</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={invite.inviteUrl}
                          className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 truncate"
                        />
                        <button
                          onClick={handleCopy}
                          className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                          title={t("copy", L)}
                        >
                          {copied ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
                        </button>
                        <button
                          onClick={handleShare}
                          className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                          title={t("share", L)}
                        >
                          <Share2 size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Envoi par email */}
                    <form onSubmit={handleSendEmail} className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Mail size={16} className="text-purple-600" />
                        {t("sendByEmail", L)}
                      </p>

                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder={t("parentName", L)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          required
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder={t("parentEmail", L)}
                          className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                        />
                        <button
                          type="submit"
                          disabled={sendingEmail || !parentEmail}
                          className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
                        >
                          {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                          {sendingEmail ? t("sending", L) : t("send", L)}
                        </button>
                      </div>

                      {emailResult && (
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                          emailResult.type === "success"
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"
                        }`}>
                          {emailResult.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          {emailResult.message}
                        </div>
                      )}
                    </form>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{t("expires", L)} : {fmtDate(invite.expiresAt)}</span>
                      <button
                        onClick={handleRegenerate}
                        disabled={loading}
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700 transition disabled:opacity-50"
                      >
                        <RefreshCw size={12} />
                        {t("regenerate", L)}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                {t("close", L)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
