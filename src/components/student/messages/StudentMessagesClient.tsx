"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Send, Mail, Loader2, User, Trash2 } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface Message {
  id: string
  subject: string
  body: string
  sentAt: string
  isRead: boolean
  fromUserId: string
  toUserId: string
  fromUser: { fullName: string; role: string }
  toUser: { fullName: string; role: string }
}

interface Props {
  teacherUserId: string | null
  teacherName: string | null
}

export function StudentMessagesClient({ teacherUserId, teacherName }: Props) {
  const t = useT("studentMessages")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages")
      const data = await res.json()
      if (data.messages) {
        // Ne garder que les messages avec l'enseignant
        const filtered = data.messages.filter(
          (m: Message) => m.fromUserId === teacherUserId || m.toUserId === teacherUserId
        )
        setMessages(filtered)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [teacherUserId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Pré-remplir le sujet avec celui du dernier message (une seule fois au chargement)
  const initialLoadDone = useRef(false)
  useEffect(() => {
    if (!initialLoadDone.current && messages.length > 0) {
      const lastSubject = messages[0].subject
      setSubject(lastSubject.startsWith("Re: ") ? lastSubject : `Re: ${lastSubject}`)
      initialLoadDone.current = true
    }
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!teacherUserId || !subject.trim() || !body.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: teacherUserId, subject, body }),
      })
      if (res.ok) {
        setBody("")
        await fetchMessages()
      } else {
        alert(t("errorSend"))
      }
    } catch {
      alert(t("errorSend"))
    } finally {
      setSending(false)
    }
  }

  async function handleClearConversation() {
    if (!teacherUserId) return
    if (!confirm(t("confirmClear"))) return
    setClearing(true)
    try {
      const res = await fetch(`/api/messages?otherUserId=${teacherUserId}`, { method: "DELETE" })
      if (res.ok) {
        setMessages([])
        initialLoadDone.current = false
        setSubject("")
      }
    } catch {
      // ignore
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/student/dashboard" className="text-sm text-gray-500 hover:text-tahfidz-green transition">
          {t("back")}
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Mail size={20} className="text-tahfidz-green" />
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("title")}</h1>
            <p className="text-xs text-gray-500">{t("subtitle")}</p>
          </div>
        </div>

        {!teacherUserId ? (
          <div className="text-center py-8 text-gray-400">
            <User size={32} className="mx-auto mb-2 opacity-50" />
            <p>{t("noTeacher")}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>{t("received")}: <span className="font-semibold">{teacherName}</span></span>
              <button
                onClick={handleClearConversation}
                disabled={clearing || messages.length === 0}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-red-50"
                title={t("clearConversation")}
              >
                {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t("clearConversation")}
              </button>
            </div>

            {/* Liste des messages */}
            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-tahfidz-green" /></div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t("noMessages")}</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border text-sm ${
                      msg.fromUserId === teacherUserId
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-tahfidz-green text-xs">📌 {msg.subject}</span>
                      <span className="text-[10px] text-gray-400">{new Date(msg.sentAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{msg.body}</p>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {msg.fromUserId === teacherUserId ? msg.fromUser.fullName : t("sent")}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulaire d'envoi */}
            <form onSubmit={handleSend} className="space-y-3">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("subject")}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                required
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("message")}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green resize-none"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 bg-tahfidz-green text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {t("send")}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
