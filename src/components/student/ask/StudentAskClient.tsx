"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Send, HelpCircle, Loader2, User } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"
import { useRouter } from "next/navigation"

interface Props {
  teacherUserId: string | null
  teacherName: string | null
}

export function StudentAskClient({ teacherUserId, teacherName }: Props) {
  const t = useT("studentAsk")
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
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
        setSent(true)
        setSubject("")
        setBody("")
        setTimeout(() => router.push("/student/messages"), 1500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <HelpCircle size={20} className="text-tahfidz-green" />
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
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
              {t("subtitle")} — <span className="font-semibold">{teacherName}</span>
            </div>

            {sent && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 text-center">
                {t("success")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("subject")}</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("subject")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("question")}</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t("question")}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 bg-tahfidz-green text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? t("sending") : t("send")}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
