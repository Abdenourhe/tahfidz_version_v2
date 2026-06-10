"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, MessageCircle, X, Trash2, ChevronDown } from "lucide-react"
import { ChatBubble, ChatMessage } from "@/components/shared/ChatBubble"

interface Message extends ChatMessage {
  toUserId: string
  subject: string
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

export function TeacherChat({ teacherUserId, teacherName, parentUserId, childName, studentId }: {
  teacherUserId: string
  teacherName: string
  parentUserId: string
  childName: string
  studentId: string
}) {
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(searchParams.get("chat") === "open")
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { showJumpBtn, scrollToBottom, onScroll } = useScrollBehavior(scrollRef, [messages.length])

  const load = async () => {
    try {
      const res = await fetch(`/api/messages?type=all`)
      const data = await res.json()
      const filtered = (data.messages || []).filter((m: Message) =>
        (m.fromUserId === parentUserId && m.toUserId === teacherUserId) ||
        (m.fromUserId === teacherUserId && m.toUserId === parentUserId)
      )
      setMessages(filtered.sort((a: Message, b: Message) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()))
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (open) {
      setLoading(true)
      load().finally(() => {
        setLoading(false)
        setTimeout(() => scrollToBottom("auto"), 60)
        inputRef.current?.focus()
      })
      const id = setInterval(load, 5000)
      return () => clearInterval(id)
    }
  }, [open]) // eslint-disable-line

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: teacherUserId,
          subject: `Parent de ${childName}`,
          body: text.trim(),
          replyToId: replyingTo?.id,
          studentId,
        }),
      })
      if (res.ok) {
        setText("")
        setReplyingTo(null)
        await load()
        scrollToBottom("smooth")
      }
    } catch (e) { console.error(e) }
    finally { setSending(false) }
  }

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/reaction`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji }),
      })
      if (res.ok) load()
    } catch (e) { console.error(e) }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Supprimer ce message ?")) return
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" })
      if (res.ok) load()
    } catch (e) { console.error(e) }
  }

  const clearChat = async () => {
    if (!confirm("Vider cette conversation ?")) return
    try {
      await fetch(`/api/messages?otherUserId=${teacherUserId}`, { method: "DELETE" })
      setMessages([])
    } catch (e) { console.error(e) }
  }

  const groups: { isMe: boolean; items: Message[] }[] = []
  messages.forEach(m => {
    const isMe = m.fromUserId === parentUserId
    if (groups.length && groups[groups.length - 1].isMe === isMe) groups[groups.length - 1].items.push(m)
    else groups.push({ isMe, items: [m] })
  })

  let lastDateLabel = ""

  if (!open) {
    return (
      <motion.button onClick={() => setOpen(true)} whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2.5 bg-tahfidz-green text-white text-xs font-bold rounded-xl hover:opacity-90 transition shadow-sm">
        <MessageCircle size={14} /> Contacter
      </motion.button>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden mt-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Discussion</span>
        </div>
        <div className="flex items-center gap-0.5">
          <motion.button whileTap={{ scale: 0.85 }} onClick={clearChat} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Vider">
            <Trash2 size={14} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition">
            <X size={16} />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="h-72 overflow-y-auto p-3 space-y-1 scroll-smooth relative">
        <AnimatePresence initial={false}>
          {loading && messages.length === 0 ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </motion.div>
          ) : messages.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <MessageCircle size={28} className="opacity-40" />
              <p className="text-xs">Écrivez le premier message</p>
            </motion.div>
          ) : (
            groups.map((group, gi) => (
              <motion.div key={gi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28, delay: gi * 0.02 }}
                className={`flex flex-col ${group.isMe ? "items-end" : "items-start"}`}
              >
                {group.items.map((m, mi) => {
                  const dLabel = dateLabel(m.sentAt)
                  const showDate = dLabel !== lastDateLabel
                  if (showDate) lastDateLabel = dLabel
                  return (
                    <ChatBubble
                      key={m.id}
                      m={m}
                      isMe={m.fromUserId === parentUserId}
                      myId={parentUserId}
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
            ))
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showJumpBtn && (
            <motion.button initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={() => scrollToBottom("smooth")}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 bg-tahfidz-green text-white text-[11px] font-bold rounded-full shadow-xl hover:bg-emerald-700 transition"
            >
              <ChevronDown size={12} /> Nouveaux messages
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Reply banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="px-3 pt-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
          >
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
      <div className="flex items-center gap-2 p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={replyingTo ? "Votre réponse..." : "Écrivez un message..."}
          className="flex-1 text-sm px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/30 focus:border-tahfidz-green transition"
        />
        <motion.button whileTap={{ scale: 0.85 }} onClick={send} disabled={sending || !text.trim()}
          className="p-3 rounded-full bg-tahfidz-green text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </motion.button>
      </div>
    </motion.div>
  )
}
