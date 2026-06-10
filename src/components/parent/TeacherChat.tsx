"use client"
import { useState, useEffect, useRef } from "react"
import { Send, Loader2, MessageCircle, X, Trash2 } from "lucide-react"

interface Message {
  id: string
  fromUserId: string
  toUserId: string
  subject: string
  body: string
  sentAt: string
  fromUser: { fullName: string; role: string }
}

export function TeacherChat({ teacherUserId, teacherName, parentUserId, childName }: {
  teacherUserId: string
  teacherName: string
  parentUserId: string
  childName: string
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
    }, 50)
  }

  const load = async () => {
    try {
      const res = await fetch(`/api/messages?type=all`)
      const data = await res.json()
      const filtered = (data.messages || []).filter((m: Message) =>
        (m.fromUserId === parentUserId && m.toUserId === teacherUserId) ||
        (m.fromUserId === teacherUserId && m.toUserId === parentUserId)
      )
      setMessages(filtered.reverse())
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (open) {
      setLoading(true)
      load().finally(() => {
        setLoading(false)
        scrollToBottom(false)
      })
      const id = setInterval(() => {
        load().then(() => scrollToBottom(true))
      }, 5000)
      return () => clearInterval(id)
    }
  }, [open])

  useEffect(() => {
    scrollToBottom(true)
  }, [messages.length])

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
          body: text.trim()
        }),
      })
      if (res.ok) {
        setText("")
        await load()
        scrollToBottom(true)
      }
    } catch (e) { console.error(e) }
    finally { setSending(false) }
  }

  const clearChat = async () => {
    if (!confirm("Vider cette conversation ?")) return
    try {
      await fetch(`/api/messages?otherUserId=${teacherUserId}`, { method: "DELETE" })
      setMessages([])
    } catch (e) { console.error(e) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-tahfidz-green text-white text-xs font-bold rounded-xl hover:opacity-90 transition active:scale-95 shadow-sm">
        <MessageCircle size={14} /> Contacter
      </button>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mt-3">
      {/* Header compact — pas de nom dupliqué */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Discussion</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition" title="Vider">
            <Trash2 size={13} />
          </button>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollAreaRef} className="h-64 overflow-y-auto p-3 space-y-2 scroll-smooth">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-300" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">Aucun message. Écrivez le premier !</p>
        ) : (
          messages.map(m => {
            const isMe = m.fromUserId === parentUserId
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                  isMe
                    ? "bg-tahfidz-green text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-bl-sm"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? "text-white/60" : "text-gray-400"}`}>
                    {new Date(m.sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 border-t border-gray-100 dark:border-gray-700">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Écrivez un message..."
          className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-tahfidz-green"
        />
        <button onClick={send} disabled={sending || !text.trim()}
          className="p-2.5 rounded-xl bg-tahfidz-green text-white hover:opacity-90 disabled:opacity-40 transition">
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}
