"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Mail, Loader2, User, ArrowLeft, MessageCircle } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

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

export function TeacherMessagesClient() {
  const t = useT("teacherMessages")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)

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
  }, [fetchMessages])

  // Groupe les messages par élève (fromUserId ou toUserId différent de l'enseignant)
  const conversations = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const otherId = msg.fromUser.role === "STUDENT" ? msg.fromUserId : msg.toUserId
    if (!acc[otherId]) acc[otherId] = []
    acc[otherId].push(msg)
    return acc
  }, {})

  const activeMessages = activeStudentId ? conversations[activeStudentId] || [] : []
  const activeStudentName = activeMessages[0]
    ? (activeMessages[0].fromUser.role === "STUDENT" ? activeMessages[0].fromUser.fullName : activeMessages[0].toUser.fullName)
    : ""



  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeStudentId || !subject.trim() || !body.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: activeStudentId, subject, body }),
      })
      if (res.ok) {
        setSubject("")
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

        {loading ? (
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
              {Object.entries(conversations).map(([studentId, msgs]) => {
                const last = msgs[0]
                const name = last.fromUser.role === "STUDENT" ? last.fromUser.fullName : last.toUser.fullName
                const unread = msgs.some(m => m.fromUser.role === "STUDENT" && !m.isRead)
                return (
                  <button
                    key={studentId}
                    onClick={() => {
                      setActiveStudentId(studentId)
                      const conv = conversations[studentId] || []
                      if (conv.length > 0) {
                        const lastSubject = conv[0].subject
                        setSubject(lastSubject.startsWith("Re: ") ? lastSubject : `Re: ${lastSubject}`)
                      } else {
                        setSubject("")
                      }
                      setBody("")
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition text-sm ${
                      activeStudentId === studentId
                        ? "bg-tahfidz-green-light/30 dark:bg-emerald-900/20 border border-tahfidz-green"
                        : "bg-gray-50 dark:bg-gray-800 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full gradient-tahfidz flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{name}</p>
                      <p className="text-xs text-gray-400 truncate">{last.subject}</p>
                    </div>
                    {unread && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Conversation active */}
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                {activeStudentId ? (
                  <motion.div
                    key={activeStudentId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-[500px]"
                  >
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => setActiveStudentId(null)}
                        className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <User size={16} className="text-tahfidz-green" />
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        {t("conversationWith")} {activeStudentName}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                      {[...activeMessages].reverse().map((msg) => {
                        const isFromMe = msg.fromUser.role !== "STUDENT"
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
                              <p className={`font-bold text-xs mb-1 ${isFromMe ? "text-white/90" : "text-tahfidz-green"}`}>📌 {msg.subject}</p>
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
                    <p className="text-sm">{t("noMessages")}</p>
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
