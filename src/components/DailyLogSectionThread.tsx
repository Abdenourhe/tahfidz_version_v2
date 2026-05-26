"use client"
import { useState, useEffect, useCallback } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { MessageCircle, Send, Trash2, Loader2, X } from "lucide-react"

interface Comment {
  id: string
  message: string
  createdAt: string
  user: {
    id: string
    fullName: string
    fullNameAr: string | null
    role: string
    avatar: string | null
  }
}

interface Props {
  studentId: string
  dailyLogId: string
  section: string
  sectionLabel: string
}

export default function DailyLogSectionThread({ studentId, dailyLogId, section, sectionLabel }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("dailyLogThread")

  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!open) return
    setLoading(true)
    try {
      const res = await fetch(`/api/students/${studentId}/daily-log/comments?dailyLogId=${dailyLogId}&section=${section}`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [open, studentId, dailyLogId, section])

  useEffect(() => { load() }, [load])

  const send = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/students/${studentId}/daily-log/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyLogId, section, message }),
      })
      if (res.ok) {
        setMessage("")
        load()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return
    setDeleting(id)
    try {
      await fetch(`/api/students/${studentId}/daily-log/comments/${id}`, { method: "DELETE" })
      load()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition"
      >
        <MessageCircle size={12} />
        {comments.length > 0 ? `${comments.length} ${t("messages")}` : t("discuss")}
        {open ? <X size={10} className="ml-1" /> : null}
      </button>

      {open && (
        <div className="mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{sectionLabel}</p>

          {loading ? (
            <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-gray-400" /></div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">{t("noMessages")}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                    {c.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate">
                        {c.user.fullName}
                        <span className="text-[9px] text-gray-400 ml-1 font-normal">({c.user.role})</span>
                      </span>
                      <span className="text-[9px] text-gray-400 flex-shrink-0">{new Date(c.createdAt).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{c.message}</p>
                  </div>
                  <button
                    onClick={() => remove(c.id)}
                    disabled={deleting === c.id}
                    className="p-1 text-gray-300 hover:text-red-500 transition flex-shrink-0"
                    title={t("delete")}
                  >
                    {deleting === c.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t("writeMessage")}
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={send}
              disabled={sending || !message.trim()}
              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
