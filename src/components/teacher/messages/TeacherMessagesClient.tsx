"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Mail, Loader2, ArrowLeft, MessageCircle, Trash2, ChevronDown, GraduationCap, X } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"
import { useSession } from "next-auth/react"
import { ChatBubble, ChatMessage } from "@/components/shared/ChatBubble"

interface Message extends ChatMessage {
  subject: string
  isRead: boolean
  toUserId: string
  toUser: { fullName: string; role: string }
}

const SCROLL_THRESHOLD = 100

function dateLabel(d: string): string {
  const date = new Date(d)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const dayMs = 86400000
  if (diff < dayMs && date.getDate() === now.getDate()) return "Aujourd'hui"
  if (diff < 2 * dayMs && date.getDate() === now.getDate() - 1) return "Hier"
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
}

function useScrollBehavior(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  deps: React.DependencyList
) {
  const [showJumpBtn, setShowJumpBtn] = useState(false)
  const isAtBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD
  }, [scrollRef])
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
    setShowJumpBtn(false)
  }, [scrollRef])
  const onScroll = useCallback(() => setShowJumpBtn(!isAtBottom()), [isAtBottom])
  useEffect(() => { if (isAtBottom()) scrollToBottom("smooth") }, deps) // eslint-disable-line
  return { showJumpBtn, scrollToBottom, onScroll }
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
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { showJumpBtn, scrollToBottom, onScroll } = useScrollBehavior(scrollRef, [activeOtherId, messages.length])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages")
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchMessages()
    const id = setInterval(fetchMessages, 5000)
    return () => clearInterval(id)
  }, [fetchMessages])

  // Mark as read
  useEffect(() => {
    if (!activeOtherId || !myId) return
    const unread = messages.filter(m => m.fromUserId === activeOtherId && m.toUserId === myId && !m.isRead)
    if (unread.length > 0) {
      Promise.all(unread.map(m =>
        fetch(`/api/messages/${m.id}/read`, { method: "POST" }).catch(() => {})
      )).then(() => fetchMessages())
    }
  }, [activeOtherId, messages, myId, fetchMessages])

  const conversations = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const otherId = msg.fromUserId === myId ? msg.toUserId : msg.fromUserId
    if (!acc[otherId]) acc[otherId] = []
    acc[otherId].push(msg)
    return acc
  }, {})

  const activeMessages = activeOtherId
    ? (conversations[activeOtherId] || []).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    : []

  const firstActive = activeMessages[0]
  const activeOtherName = firstActive ? (firstActive.fromUserId === myId ? firstActive.toUser.fullName : firstActive.fromUser.fullName) : ""
  const activeChildName = firstActive ? extractChildName(firstActive.subject) : null

  const groups: { isMe: boolean; items: Message[] }[] = []
  activeMessages.forEach(m => {
    const isMe = m.fromUserId === myId
    if (groups.length && groups[groups.length - 1].isMe === isMe) groups[groups.length - 1].items.push(m)
    else groups.push({ isMe, items: [m] })
  })

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
          subject: activeChildName ? `Re: Parent de ${activeChildName}` : "Re: Message",
          body,
          replyToId: replyingTo?.id,
        }),
      })
      if (res.ok) {
        setBody("")
        setReplyingTo(null)
        await fetchMessages()
        scrollToBottom("smooth")
      } else alert(t("errorSend"))
    } catch { alert(t("errorSend")) }
    finally { setSending(false) }
  }

  async function handleClearConversation() {
    if (!activeOtherId) return
    if (!confirm(t("confirmClear"))) return
    setClearing(true)
    try {
      const res = await fetch(`/api/messages?otherUserId=${activeOtherId}`, { method: "DELETE" })
      if (res.ok) { setActiveOtherId(null); await fetchMessages() }
    } catch { /* ignore */ }
    finally { setClearing(false) }
  }

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/reaction`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji }),
      })
      if (res.ok) fetchMessages()
    } catch (e) { console.error(e) }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Supprimer ce message ?")) return
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" })
      if (res.ok) fetchMessages()
    } catch (e) { console.error(e) }
  }

  let lastDateLabel = ""

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/dashboard" className="text-sm text-gray-500 hover:text-tahfidz-green transition">{t("back")}</Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <Mail size={20} className="text-tahfidz-green" />
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("title")}</h1>
            <p className="text-xs text-gray-500">{t("subtitle")}</p>
          </div>
        </div>

        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-tahfidz-green" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p>{t("noMessages")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Liste */}
            <div className="md:col-span-1 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="p-3 space-y-1 max-h-[600px] overflow-y-auto">
                {Object.entries(conversations).map(([otherId, msgs]) => {
                  const last = msgs[msgs.length - 1]
                  const otherName = last.fromUserId === myId ? last.toUser.fullName : last.fromUser.fullName
                  const childName = extractChildName(last.subject)
                  const unreadCount = msgs.filter(m => m.fromUserId === otherId && !m.isRead).length
                  return (
                    <motion.button key={otherId} whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveOtherId(otherId); setBody(""); setReplyingTo(null)
                        setTimeout(() => { scrollToBottom("auto"); inputRef.current?.focus() }, 80)
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition text-sm ${
                        activeOtherId === otherId
                          ? "bg-tahfidz-green-light/30 dark:bg-emerald-900/20 border border-tahfidz-green/30"
                          : "bg-white dark:bg-gray-800 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full gradient-tahfidz flex items-center justify-center text-white text-sm font-bold">{otherName.charAt(0).toUpperCase()}</div>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">{unreadCount}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{otherName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{childName ? `Parent de ${childName}` : last.subject}</p>
                        <p className="text-[10px] text-gray-300 truncate">{last.body.slice(0,40)}{last.body.length>40?"…":""}</p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Active conversation */}
            <div className="md:col-span-2 flex flex-col h-[600px]">
              <AnimatePresence mode="wait">
                {activeOtherId ? (
                  <motion.div key={activeOtherId} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button onClick={() => setActiveOtherId(null)} className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft size={16} /></button>
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full gradient-tahfidz flex items-center justify-center text-white text-sm font-bold">{activeOtherName.charAt(0).toUpperCase()}</div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{activeOtherName}</p>
                          {activeChildName && <p className="text-[10px] text-tahfidz-green flex items-center gap-1"><GraduationCap size={10} /> Parent de {activeChildName}</p>}
                        </div>
                      </div>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={handleClearConversation} disabled={clearing} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-red-50 shrink-0">
                        {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        <span className="hidden sm:inline">{t("clearConversation")}</span>
                      </motion.button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth relative">
                      <AnimatePresence initial={false}>
                        {groups.map((group, gi) => (
                          <motion.div key={`${activeOtherId}-${gi}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 28, delay: gi * 0.02 }} className={`flex flex-col ${group.isMe ? "items-end" : "items-start"}`}>
                            {group.items.map((m, mi) => {
                              const dLabel = dateLabel(m.sentAt)
                              const showDate = dLabel !== lastDateLabel
                              if (showDate) lastDateLabel = dLabel
                              return (
                                <ChatBubble
                                  key={m.id}
                                  m={m}
                                  isMe={m.fromUserId === myId}
                                  myId={myId || ""}
                                  isFirst={mi === 0}
                                  isLast={mi === group.items.length - 1}
                                  only={group.items.length === 1}
                                  mi={mi}
                                  showDate={showDate}
                                  dLabel={dLabel}
                                  onReact={toggleReaction}
                                  onReply={(msg) => setReplyingTo(msg as Message)}
                                  onDelete={deleteMessage}
                                />
                              )
                            })}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <AnimatePresence>
                        {showJumpBtn && (
                          <motion.button initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            onClick={() => scrollToBottom("smooth")} className="sticky bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 bg-tahfidz-green text-white text-[11px] font-bold rounded-full shadow-xl hover:bg-emerald-700 transition"
                          >
                            <ChevronDown size={12} /> Nouveaux messages
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Reply banner */}
                    <AnimatePresence>
                      {replyingTo && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-3 pt-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border-l-2 border-tahfidz-green bg-white dark:bg-gray-800">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-tahfidz-green">Répondre à {replyingTo.fromUser.fullName}</p>
                              <p className="text-[11px] text-gray-400 truncate">{replyingTo.body}</p>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={12} /></button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Input */}
                    <form onSubmit={handleSend} className="flex items-end gap-2 p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <textarea ref={inputRef} value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e) } }} placeholder={replyingTo ? "Votre réponse..." : "Écrivez un message..."} rows={1} className="flex-1 text-sm px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/30 focus:border-tahfidz-green transition resize-none max-h-32" />
                      <motion.button whileTap={{ scale: 0.85 }} type="submit" disabled={sending || !body.trim()} className="p-3 rounded-full bg-tahfidz-green text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm shrink-0">
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </motion.button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <MessageCircle size={40} className="opacity-40" />
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
