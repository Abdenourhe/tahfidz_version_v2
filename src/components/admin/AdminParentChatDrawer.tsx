"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import {
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  X,
  CheckCheck,
} from "lucide-react"

interface Message {
  id: string
  body: string
  subject: string
  sentAt: string
  isRead: boolean
  fromUserId: string
  toUserId: string
  fromUser: { fullName: string; role: string }
  toUser: { fullName: string; role: string }
}

interface Props {
  otherUserId: string
  otherUserName: string
  otherUserRole?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AdminParentChatDrawer({
  otherUserId,
  otherUserName,
  otherUserRole,
  open,
  onOpenChange,
}: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("adminChat")
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!open || !otherUserId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?type=conversation&otherUserId=${otherUserId}`)
      const data = await res.json()
      const list = (data.messages || []).reverse() // ancien → récent
      setMessages(list)

      // Marquer les messages reçus comme lus
      const unread = list.filter((m: Message) => m.toUserId === currentUserId && !m.isRead)
      await Promise.all(
        unread.map((m: Message) =>
          fetch(`/api/messages/${m.id}/read`, { method: "POST" }).catch(() => {})
        )
      )
      if (unread.length > 0) {
        setMessages((prev) =>
          prev.map((m) => (m.toUserId === currentUserId && !m.isRead ? { ...m, isRead: true } : m))
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [open, otherUserId, currentUserId])

  useEffect(() => {
    if (open) load()
    else {
      setMessages([])
      setBody("")
    }
  }, [open, load])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const send = async () => {
    if (!body.trim() || !otherUserId) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: otherUserId,
          subject: t("defaultSubject") || "Discussion",
          body: body.trim(),
        }),
      })
      const json = await res.json()
      if (res.ok && json.message) {
        setBody("")
        setMessages((prev) => [...prev, json.message])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const clear = async () => {
    if (!confirm(t("confirmClear"))) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/messages?otherUserId=${otherUserId}`, { method: "DELETE" })
      if (res.ok) {
        setMessages([])
        await load()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  const roleBubbleColor = (role: string, isMe: boolean) => {
    if (isMe) return "bg-tahfidz-green text-white"
    switch (role) {
      case "ADMIN":
      case "SUPERADMIN":
        return "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100"
      case "PARENT":
        return "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100"
      case "TEACHER":
        return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
      default:
        return "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return t("roleAdmin") || "Admin"
      case "SUPERADMIN":
        return t("roleSuperadmin") || "Superadmin"
      case "PARENT":
        return t("roleParent") || "Parent"
      case "TEACHER":
        return t("roleTeacher") || "Enseignant"
      default:
        return role
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "relative z-10 flex flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl",
              // Mobile : modale flottante compacte (pas plein écran)
              "w-[calc(100%-2rem)] max-w-md h-auto max-h-[80vh] rounded-2xl border border-gray-200 dark:border-gray-800 mb-4",
              // Desktop : drawer latéral classique
              "sm:h-full sm:w-[480px] sm:max-h-none sm:rounded-none sm:mb-0 sm:border-l sm:border-y-0 sm:border-r-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tahfidz-green to-emerald-600 flex items-center justify-center text-white font-bold">
                  {otherUserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <MessageCircle size={16} className="text-tahfidz-green" />
                    {otherUserName}
                  </h3>
                  {otherUserRole && (
                    <p className="text-[11px] text-gray-500">{roleLabel(otherUserRole)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={clear}
                    disabled={deleting}
                    title={t("clear")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                  >
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    {t("clear")}
                  </button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-950/30"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                  <p className="text-xs">{t("loading")}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <MessageCircle size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">{t("noMessagesTitle")}</p>
                  <p className="text-xs text-gray-400 mt-1">{t("noMessagesDesc")}</p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.fromUserId === currentUserId
                  const showAvatar = idx === 0 || messages[idx - 1].fromUserId !== m.fromUserId
                  return (
                    <div key={m.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                      {showAvatar ? (
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                            isMe
                              ? "bg-tahfidz-green text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          )}
                        >
                          {(isMe ? session?.user?.name : otherUserName)?.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}
                      <div className={cn("max-w-[80%] min-w-0", isMe ? "items-end" : "items-start")}>
                        {showAvatar && (
                          <div
                            className={cn(
                              "flex items-center gap-1.5 mb-1",
                              isMe ? "justify-end" : "justify-start"
                            )}
                          >
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                              {isMe ? session?.user?.name : otherUserName}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                              {roleLabel(isMe ? session?.user?.role || "" : otherUserRole || "")}
                            </span>
                          </div>
                        )}
                        <div
                          className={cn(
                            "relative px-3 py-2 rounded-2xl text-xs leading-relaxed",
                            isMe
                              ? "rounded-tr-sm bg-tahfidz-green text-white"
                              : "rounded-tl-sm " + roleBubbleColor(isMe ? session?.user?.role || "" : otherUserRole || "", false)
                          )}
                        >
                          {m.body}
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1.5 mt-1",
                            isMe ? "justify-end" : "justify-start"
                          )}
                        >
                          <span className="text-[9px] text-gray-400">
                            {new Date(m.sentAt).toLocaleTimeString(
                              L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                          {isMe && <CheckCheck size={10} className="text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={t("writeMessage")}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 focus:border-tahfidz-green/50"
                />
                <button
                  onClick={send}
                  disabled={sending || !body.trim()}
                  className="p-2.5 bg-tahfidz-green text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
