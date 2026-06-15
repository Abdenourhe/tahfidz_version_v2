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
  SmilePlus,
  Paperclip,
} from "lucide-react"

interface Reaction {
  emoji: string
  userId: string
}

interface CommentItem {
  id: string
  message: string
  createdAt: string
  userId: string
  user: {
    id: string
    fullName: string
    fullNameAr: string | null
    role: string
    avatar: string | null
  }
  reactions: Reaction[]
  attachmentKey: string | null
  attachmentName: string | null
  attachmentType: string | null
}

function getAttachmentUrl(studentId: string, key: string) {
  return `/api/students/${studentId}/daily-log/comments/attachment?key=${encodeURIComponent(key)}`
}

function isImageType(type?: string | null) {
  return type?.startsWith("image/") ?? false
}

function isAudioType(type?: string | null) {
  return type?.startsWith("audio/") ?? false
}

interface SectionData {
  comments: CommentItem[]
  unreadCount: number
}

const QUICK_REACTIONS = ["👍", "❤️", "✓", "🙏", "👏"]

function aggregateReactions(reactions: Reaction[], currentUserId?: string) {
  const map: Record<string, { emoji: string; count: number; userReacted: boolean }> = {}
  for (const r of reactions || []) {
    if (!map[r.emoji]) {
      map[r.emoji] = { emoji: r.emoji, count: 0, userReacted: false }
    }
    map[r.emoji].count++
    if (r.userId === currentUserId) {
      map[r.emoji].userReacted = true
    }
  }
  return Object.values(map).sort((a, b) => b.count - a.count)
}

const SECTIONS = ["ATTENDANCE", "HIFZ", "MURAJA", "TALQIN", "COURSE", "GENERAL"] as const

type SectionKey = (typeof SECTIONS)[number]

const SECTION_META: Record<
  SectionKey,
  { color: string; bg: string; border: string; iconColor: string }
> = {
  ATTENDANCE: {
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
  },
  HIFZ: {
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-500",
  },
  MURAJA: {
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
  },
  TALQIN: {
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-500",
  },
  COURSE: {
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-500",
  },
  GENERAL: {
    color: "text-gray-700 dark:text-gray-300",
    bg: "bg-gray-50 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    iconColor: "text-gray-500",
  },
}

interface Props {
  studentId: string
  dailyLogId: string
  date: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export default function DailyLogChatDrawer({
  studentId,
  dailyLogId,
  date,
  open,
  onOpenChange,
  onUpdate,
}: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("dailyLogChatDrawer")
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [data, setData] = useState<Record<SectionKey, SectionData> | null>(null)
  const [activeSection, setActiveSection] = useState<SectionKey>("GENERAL")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const canClearSection =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "SUPERADMIN" ||
    session?.user?.role === "TEACHER"

  const load = useCallback(async () => {
    if (!open || !dailyLogId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/students/${studentId}/daily-log/comments?dailyLogId=${dailyLogId}&section=ALL`
      )
      const json = await res.json()
      if (json.sections) {
        // S'assurer que toutes les sections existent
        const complete: Record<SectionKey, SectionData> = {} as Record<SectionKey, SectionData>
        for (const key of SECTIONS) {
          complete[key] = json.sections[key] || { comments: [], unreadCount: 0 }
        }
        setData(complete)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [open, dailyLogId, studentId])

  useEffect(() => {
    if (open) {
      load()
    } else {
      setData(null)
      setMessage("")
    }
  }, [open, load])

  const activeComments = data?.[activeSection]?.comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeComments])

  const markSectionRead = useCallback(
    async (section: SectionKey) => {
      if (!data?.[section]?.unreadCount) return
      try {
        await fetch(`/api/students/${studentId}/daily-log/comments/mark-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dailyLogId, section }),
        })
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            [section]: { ...prev[section], unreadCount: 0 },
          }
        })
      } catch (e) {
        console.error(e)
      }
    },
    [data, dailyLogId, studentId]
  )

  const handleSectionChange = (section: SectionKey) => {
    setActiveSection(section)
    markSectionRead(section)
  }

  const uploadFile = async (file: File): Promise<{ key: string; name: string; type: string } | null> => {
    setUploading(true)
    setUploadError(null)
    try {
      const res = await fetch(`/api/students/${studentId}/daily-log/comments/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setUploadError(json.error || t("uploadError"))
        return null
      }

      const uploadRes = await fetch(json.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!uploadRes.ok) {
        setUploadError(t("uploadError"))
        return null
      }

      return { key: json.key, name: file.name, type: file.type }
    } catch (e) {
      console.error(e)
      setUploadError(t("uploadError"))
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
    if (e.target) e.target.value = ""
  }

  const send = async () => {
    if ((!message.trim() && !selectedFile) || !dailyLogId) return
    setSending(true)
    try {
      let attachment = null
      if (selectedFile) {
        attachment = await uploadFile(selectedFile)
        if (!attachment) {
          setSending(false)
          return
        }
      }

      const res = await fetch(`/api/students/${studentId}/daily-log/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyLogId,
          section: activeSection,
          message,
          attachment,
        }),
      })
      const json = await res.json()
      if (res.ok && json.comment) {
        setMessage("")
        setSelectedFile(null)
        setUploadError(null)
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            [activeSection]: {
              ...prev[activeSection],
              comments: [...prev[activeSection].comments, json.comment],
            },
          }
        })
        onUpdate?.()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return
    setDeletingId(id)
    try {
      await fetch(`/api/students/${studentId}/daily-log/comments/${id}`, {
        method: "DELETE",
      })
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          [activeSection]: {
            ...prev[activeSection],
            comments: prev[activeSection].comments.filter((c) => c.id !== id),
          },
        }
      })
      onUpdate?.()
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const toggleReaction = async (commentId: string, emoji: string) => {
    try {
      const res = await fetch(
        `/api/students/${studentId}/daily-log/comments/${commentId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        }
      )
      if (!res.ok) return
      const json = await res.json()
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          [activeSection]: {
            ...prev[activeSection],
            comments: prev[activeSection].comments.map((c) => {
              if (c.id !== commentId) return c
              const existing = c.reactions.find((r) => r.userId === currentUserId && r.emoji === emoji)
              if (json.action === "removed" || existing) {
                return {
                  ...c,
                  reactions: c.reactions.filter((r) => !(r.userId === currentUserId && r.emoji === emoji)),
                }
              }
              return {
                ...c,
                reactions: [...c.reactions, { emoji, userId: currentUserId || "" }],
              }
            }),
          },
        }
      })
    } catch (e) {
      console.error(e)
    }
  }

  const clearSection = async () => {
    if (!confirm(t("confirmClearSection"))) return
    setClearing(true)
    try {
      const res = await fetch(`/api/students/${studentId}/daily-log/comments/clear-section`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyLogId, section: activeSection }),
      })
      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            [activeSection]: { ...prev[activeSection], comments: [], unreadCount: 0 },
          }
        })
        onUpdate?.()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setClearing(false)
    }
  }

  const activeData = data?.[activeSection]
  const totalUnread = data
    ? Object.values(data).reduce((sum, s) => sum + (s.unreadCount || 0), 0)
    : 0

  const roleBubbleColor = (role: string, isMe: boolean) => {
    if (isMe) return "bg-tahfidz-green text-white"
    switch (role) {
      case "TEACHER":
        return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
      case "PARENT":
        return "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100"
      case "STUDENT":
        return "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100"
      default:
        return "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case "TEACHER":
        return t("roleTeacher")
      case "PARENT":
        return t("roleParent")
      case "STUDENT":
        return t("roleStudent")
      case "ADMIN":
        return t("roleAdmin")
      case "SUPERADMIN":
        return t("roleSuperadmin")
      default:
        return role
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end sm:justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "relative z-10 h-full w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl",
              "flex flex-col border-l border-gray-200 dark:border-gray-800"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <MessageCircle size={16} className="text-tahfidz-green" />
                  {t("discussion")}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {new Date(date).toLocaleDateString(
                    L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
                    { weekday: "long", day: "2-digit", month: "long" }
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                    {totalUnread} {t("newMessages")}
                  </span>
                )}
                {canClearSection && activeData && activeData.comments.length > 0 && (
                  <button
                    onClick={clearSection}
                    disabled={clearing}
                    title={t("clearSection")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                  >
                    {clearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    {t("clearSection")}
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

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 scrollbar-hide">
              {SECTIONS.map((key) => {
                const meta = SECTION_META[key]
                const unread = data?.[key]?.unreadCount || 0
                return (
                  <button
                    key={key}
                    onClick={() => handleSectionChange(key)}
                    className={cn(
                      "relative flex-shrink-0 px-3 py-2.5 text-[11px] font-semibold transition whitespace-nowrap",
                      activeSection === key
                        ? `${meta.color} ${meta.bg} border-b-2 ${meta.border.replace("border-", "border-b-")}`
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    {t(`section_${key}`)}
                    {unread > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full bg-red-500 text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
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
              ) : !activeData || activeData.comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <MessageCircle size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">{t("noMessagesTitle")}</p>
                  <p className="text-xs text-gray-400 mt-1">{t("noMessagesDesc")}</p>
                </div>
              ) : (
                activeData.comments.map((c, idx) => {
                  const isMe = c.userId === currentUserId
                  const showAvatar =
                    idx === 0 || activeData.comments[idx - 1].userId !== c.userId
                  return (
                    <div
                      key={c.id}
                      className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}
                    >
                      {showAvatar ? (
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                            isMe
                              ? "bg-tahfidz-green text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          )}
                        >
                          {c.user.fullName.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] min-w-0",
                          isMe ? "items-end" : "items-start"
                        )}
                      >
                        {showAvatar && (
                          <div
                            className={cn(
                              "flex items-center gap-1.5 mb-1",
                              isMe ? "justify-end" : "justify-start"
                            )}
                          >
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                              {c.user.fullName}
                            </span>
                            <span
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                                SECTION_META[activeSection].bg,
                                SECTION_META[activeSection].color
                              )}
                            >
                              {roleLabel(c.user.role)}
                            </span>
                          </div>
                        )}
                        <div
                          className={cn(
                            "relative px-3 py-2 rounded-2xl text-xs leading-relaxed",
                            isMe
                              ? "rounded-tr-sm bg-tahfidz-green text-white"
                              : "rounded-tl-sm " + roleBubbleColor(c.user.role, false)
                          )}
                        >
                          {c.message}
                        </div>

                        {/* Pièce jointe */}
                        {c.attachmentKey && (
                          <div
                            className={cn(
                              "mt-1.5",
                              isMe ? "text-right" : "text-left"
                            )}
                          >
                            {isImageType(c.attachmentType) ? (
                              <a
                                href={getAttachmentUrl(studentId, c.attachmentKey)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={getAttachmentUrl(studentId, c.attachmentKey)}
                                  alt={c.attachmentName || ""}
                                  className="max-w-[200px] max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700 object-cover"
                                />
                              </a>
                            ) : isAudioType(c.attachmentType) ? (
                              <audio
                                controls
                                className="max-w-[240px] h-8"
                              >
                                <source
                                  src={getAttachmentUrl(studentId, c.attachmentKey)}
                                  type={c.attachmentType || "audio/mpeg"}
                                />
                              </audio>
                            ) : (
                              <a
                                href={getAttachmentUrl(studentId, c.attachmentKey)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                              >
                                📎 {c.attachmentName || t("attachment")}
                              </a>
                            )}
                          </div>
                        )}

                        {/* Réactions */}
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1.5 flex-wrap",
                            isMe ? "justify-end" : "justify-start"
                          )}
                        >
                          {aggregateReactions(c.reactions, currentUserId).map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => toggleReaction(c.id, r.emoji)}
                              className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition",
                                r.userReacted
                                  ? "bg-tahfidz-green/10 text-tahfidz-green border border-tahfidz-green/30"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                              )}
                            >
                              <span>{r.emoji}</span>
                              {r.count > 1 && <span className="font-medium">{r.count}</span>}
                            </button>
                          ))}
                          <div className="relative">
                            <button
                              onClick={() => setEmojiPickerFor(emojiPickerFor === c.id ? null : c.id)}
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 transition"
                              title={t("addReaction")}
                            >
                              <SmilePlus size={10} />
                            </button>
                            {emojiPickerFor === c.id && (
                              <div
                                className={cn(
                                  "absolute bottom-7 z-20 flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg",
                                  isMe ? "right-0" : "left-0"
                                )}
                              >
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      toggleReaction(c.id, emoji)
                                      setEmojiPickerFor(null)
                                    }}
                                    className="w-7 h-7 flex items-center justify-center text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-1.5 mt-1",
                            isMe ? "justify-end" : "justify-start"
                          )}
                        >
                          <span className="text-[9px] text-gray-400">
                            {new Date(c.createdAt).toLocaleTimeString(
                              L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                          {isMe && <CheckCheck size={10} className="text-emerald-500" />}
                        </div>
                      </div>

                      {isMe && (
                        <button
                          onClick={() => remove(c.id)}
                          disabled={deletingId === c.id}
                          className="self-center p-1.5 text-gray-300 hover:text-red-500 transition opacity-0 hover:opacity-100 focus:opacity-100"
                          title={t("delete")}
                        >
                          {deletingId === c.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              {selectedFile && (
                <div className="mb-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedFile.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-lg">
                        🎤
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-200 truncate max-w-[180px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-[9px] text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedFile(null); setUploadError(null) }}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {uploadError && (
                <p className="text-[10px] text-red-500 mb-2 text-center">{uploadError}</p>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-tahfidz-green hover:border-tahfidz-green/30 transition disabled:opacity-50"
                  title={t("attachFile")}
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={selectedFile ? t("addCaption") : t("writeMessage")}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 focus:border-tahfidz-green/50"
                />
                <button
                  onClick={send}
                  disabled={sending || (!message.trim() && !selectedFile)}
                  className="p-2.5 bg-tahfidz-green text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending || uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
              <p className="text-[9px] text-gray-400 mt-1.5 text-center">
                {t("activeSection")}: <span className="font-medium text-gray-500">{t(`section_${activeSection}`)}</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
