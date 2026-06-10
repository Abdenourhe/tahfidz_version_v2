"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Mail, Loader2, User, ArrowLeft, MessageCircle, Trash2, GraduationCap } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"
import { useSession } from "next-auth/react"

interface Message {
  id: string
  subject: string
  body: string
  sentAt: string
  isRead: boolean
  fromUserId: string
  fromUser: { fullName: string; role: string }
  toUser: { fullName: string; role: string }
  toUserId: string
}

function extractChildName(subject: string): string | null {
  const m = subject.match(/Parent de (.+)/i)
  return m ? m[1] : null
}

export function TeacherMessagesClient() {
  const t = useT("teacherMessages")
  const { data: session } = useSession()
  const myId = session?.user?.id

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOtherId, setActiveOtherId] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages")
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    const id = setInterval(fetchMessages, 5000)
    return () => clearInterval(id)
  }, [fetchMessages])

  // Groupe les messages par l'autre interlocuteur
  const conversations = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const otherId = msg.fromUserId === myId ? msg.toUserId : msg.fromUserId
    if (!acc[otherId]) acc[otherId] = []
    acc[otherId].push(msg)
    return acc
  }, {})

  const activeMessages = activeOtherId ? conversations[activeOtherId] || [] : []

  // Infos de la conversation active
  const firstActive = activeMessages[0]
  const activeOtherName = firstActive
    ? (firstActive.fromUserId === myId ? firstActive.toUser.fullName : firstActive.fromUser.fullName)
    : ""
  const activeChildName = firstActive ? extractChildName(firstActive.subject) : null

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOtherId || !body.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: activeOtherId,
          subject: subject || `Re: Message`,
          body,
        }),
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
    if (!activeOtherId) return
    if (!confirm(t("confirmClear"))) return
    setClearing(true)
    try {
      const res = await fetch(`/api/messages?otherUserId=${activeOtherId}`, { method: "DELETE" })
      if (res.ok) {
        setActiveOtherId(null)
        await fetchMessages()
      }
    } catch {
      // ignore
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/dashboard" className="text-sm text-gray-500 hover:text-tahfidz-green transition">
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

        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-tahfidz-green" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p>{t("noMessages")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Liste des conversations */}
            <div className="md:col-span-1 space-y-2 max-h-[500px] overflow-y-auto">
              {Object.entries(conversations).map(([otherId, msgs]) => {
                const last = msgs[0]
                const otherName = last.fromUserId === myId ? last.toUser.fullName : last.fromUser.fullName
                const childName = extractChildName(last.subject)
                const unread = msgs.some(m => m.fromUserId === otherId && !m.isRead)
                return (
                  <button
                    key={otherId}
                    onClick={() => {
                      setActiveOtherId(otherId)
                      setSubject(`Re: ${last.subject}`)
                      setBody("")
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition text-sm ${
                      activeOtherId === otherId
                        ? "bg-tahfidz-green-light/30 dark:bg-emerald-900/20 border border-tahfidz-green"
                        : "bg-gray-50 dark:bg-gray-800 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full gradient-tahfidz flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{otherName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{otherName}</p>
                      <p className="text-xs text-gray-400 truncate">{childName ? `Parent de ${childName}` : last.subject}</p>
                    </div>
                    {unread && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Conversation active */}
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                {activeOtherId ? (
                  <motion.div
                    key={activeOtherId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-[500px]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => setActiveOtherId(null)}
                          className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <User size={16} className="text-tahfidz-green shrink-0" />
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 block truncate">
                            {activeOtherName}
                          </span>
                          {activeChildName && (
                            <span className="text-[10px] text-tahfidz-green flex items-center gap-1">
                              <GraduationCap size={10} /> Parent de {activeChildName}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleClearConversation}
                        disabled={clearing}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-red-50 shrink-0"
                        title={t("clearConversation")}
                      >
                        {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {t("clearConversation")}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                      {[...activeMessages].reverse().map((msg) => {
                        const isFromMe = msg.fromUserId === myId
                        return (
                          <div
                            key={msg.id}
                            className={`max-w-[85%] ${isFromMe ? "ml-auto" : ""}`}
                          >
                            <div
                              className={`p-3 rounded-lg text-sm ${
                                isFromMe
                                  ? "bg-tahfidz-green text-white"
                                  : "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              <p className={`font-bold text-xs mb-1 ${isFromMe ? "text-white/90" : "text-tahfidz-green"}`}>
                                {msg.subject}
                              </p>
                              <p className="whitespace-pre-wrap">{msg.body}</p>
                            </div>
                            <p className={`text-[10px] text-gray-400 mt-1 ${isFromMe ? "text-right" : ""}`}>
                              {new Date(msg.sentAt).toLocaleDateString()} {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        )
                      })}
                    </div>

                    <form onSubmit={handleSend} className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={t("subject")}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                        required
                      />
                      <div className="flex gap-2">
                        <textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder={t("message")}
                          rows={2}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green resize-none"
                          required
                        />
                        <button
                          type="submit"
                          disabled={sending}
                          className="px-3 py-2 bg-tahfidz-green text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-[300px] text-gray-400"
                  >
                    <MessageCircle size={40} className="mb-2 opacity-50" />
                    <p className="text-sm">{t("selectConversation") || "Sélectionnez une conversation"}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
