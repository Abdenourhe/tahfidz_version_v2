"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Smile, Reply, Trash, X } from "lucide-react"

interface Reaction { emoji: string; userId: string }
interface ReplyTo { body: string; fromUser: { fullName: string } }

export interface ChatMessage {
  id: string
  fromUserId: string
  body: string
  sentAt: string
  fromUser: { fullName: string; role: string }
  replyTo: ReplyTo | null
  reactions: Reaction[]
}

const EMOJI_LIST = ["👍", "❤️", "🙏", "😂", "😮"]

export function ChatBubble({
  m,
  isMe,
  myId,
  isFirst,
  isLast,
  only,
  mi,
  showDate,
  dLabel,
  onReact,
  onReply,
  onDelete,
}: {
  m: ChatMessage
  isMe: boolean
  myId: string
  isFirst: boolean
  isLast: boolean
  only: boolean
  mi: number
  showDate: boolean
  dLabel: string
  onReact: (id: string, emoji: string) => void
  onReply: (msg: ChatMessage) => void
  onDelete: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Click outside to close picker
  useEffect(() => {
    if (!pickerOpen) return
    const handle = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [pickerOpen])

  const reactionCounts = m.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1
    return acc
  }, {})
  const myReactions = new Set(m.reactions.filter(r => r.userId === myId).map(r => r.emoji))

  const bubbleRadius = only
    ? "rounded-2xl " + (isMe ? "rounded-br-md" : "rounded-bl-md")
    : isFirst
    ? "rounded-t-2xl " + (isMe ? "rounded-br-md rounded-bl-lg" : "rounded-bl-md rounded-br-lg")
    : isLast
    ? "rounded-b-2xl " + (isMe ? "rounded-br-md rounded-tr-lg" : "rounded-bl-md rounded-tl-lg")
    : "rounded-lg " + (isMe ? "rounded-r-md" : "rounded-l-md")

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} w-full`}>
      {showDate && (
        <div className="flex justify-center w-full my-2">
          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full font-medium">{dLabel}</span>
        </div>
      )}

      <div
        className={`relative group self-${isMe ? "end" : "start"} max-w-[85%]`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hover actions - in flow above bubble */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className={`flex items-center gap-1 mb-1 ${isMe ? "justify-end" : "justify-start"}`}
            >
              <button
                onClick={() => setPickerOpen(!pickerOpen)}
                className="p-1 rounded-full bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-tahfidz-green transition"
              >
                <Smile size={12} />
              </button>
              <button
                onClick={() => onReply(m)}
                className="p-1 rounded-full bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-tahfidz-green transition"
              >
                <Reply size={12} />
              </button>
              {isMe && (
                <button
                  onClick={() => onDelete(m.id)}
                  className="p-1 rounded-full bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash size={12} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji picker - in flow above bubble */}
        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center gap-1 mb-1 p-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {EMOJI_LIST.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact(m.id, emoji); setPickerOpen(false) }}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm ${
                    myReactions.has(emoji) ? "bg-tahfidz-green-light" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply preview */}
        {m.replyTo && (
          <div className={`mb-1 px-2.5 py-1 rounded-lg text-[10px] border-l-2 ${
            isMe
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 text-emerald-700 dark:text-emerald-300"
              : "bg-gray-50 dark:bg-gray-800 border-gray-300 text-gray-500"
          }`}>
            <p className="font-semibold">{m.replyTo.fromUser.fullName}</p>
            <p className="truncate">{m.replyTo.body}</p>
          </div>
        )}

        {/* Bubble */}
        <div className={`px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
          isMe ? "bg-tahfidz-green text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        } ${bubbleRadius} ${mi > 0 ? "mt-0.5" : "mt-1"}`}>
          <p className="whitespace-pre-wrap">{m.body}</p>
          {isLast && (
            <p className={`text-[9px] mt-1 ${isMe ? "text-emerald-100" : "text-gray-400"}`}>
              {new Date(m.sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Reactions bar */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(m.id, emoji)}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition ${
                  myReactions.has(emoji)
                    ? "bg-tahfidz-green-light border-tahfidz-green text-tahfidz-green"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500"
                }`}
              >
                {emoji} {count > 1 && <span>{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
