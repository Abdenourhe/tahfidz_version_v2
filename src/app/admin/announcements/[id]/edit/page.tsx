"use client"
// src/app/admin/announcements/[id]/edit/page.tsx

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, CheckCircle2, Pin, XCircle } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface Group { id: string; name: string }

export default function EditAnnouncementPage({ params }: { params: { id: string } }) {
  const router = useRouter()

    const t = useT("announcements_id_edit")

  const [groups, setGroups]             = useState<Group[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["ADMIN","TEACHER","PARENT","STUDENT"])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState("GENERAL")
  const [isPinned, setIsPinned]         = useState(false)
  const [title, setTitle]               = useState("")
  const [titleAr, setTitleAr]           = useState("")
  const [content, setContent]           = useState("")
  const [contentAr, setContentAr]       = useState("")
  const [expiresAt, setExpiresAt]       = useState("")
  const [loading, setLoading]           = useState(false)
  const [fetching, setFetching]         = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)

  const ROLE_OPTIONS = [
    { value: "ADMIN",   label: t("admin"),   icon: "🔑" },
    { value: "TEACHER", label: t("teacher"), icon: "👩‍🏫" },
    { value: "PARENT",  label: t("parent"),  icon: "👨‍👩‍👦" },
    { value: "STUDENT", label: t("student"), icon: "🎓" },
  ]

  const TYPE_OPTIONS = [
    { value: "GENERAL",     label: t("general"),     activeCls: "bg-gray-100 border-gray-500",    inactiveCls: "bg-gray-50 border-gray-300" },
    { value: "EVENT",       label: t("event"),       activeCls: "bg-blue-100 border-blue-500",    inactiveCls: "bg-blue-50 border-blue-200" },
    { value: "ACHIEVEMENT", label: t("achievement"), activeCls: "bg-yellow-100 border-yellow-500",inactiveCls: "bg-yellow-50 border-yellow-200" },
    { value: "URGENT",      label: t("urgent"),      activeCls: "bg-red-100 border-red-500",      inactiveCls: "bg-red-50 border-red-200" },
  ]

  useEffect(() => {
    Promise.all([
      fetch(`/api/announcements/${params.id}`).then(r => r.json()),
      fetch("/api/groups").then(r => r.json()),
    ]).then(([annData, gData]) => {
      const ann = annData.announcement
      if (ann) {
        setTitle(ann.title || "")
        setTitleAr(ann.titleAr || "")
        setContent(ann.content || "")
        setContentAr(ann.contentAr || "")
        setSelectedType(ann.type || "GENERAL")
        setIsPinned(ann.isPinned || false)
        setSelectedRoles(ann.targetRoles || ["ADMIN","TEACHER","PARENT","STUDENT"])
        setSelectedGroups((ann.targetGroups || []).map((tg: any) => tg.group.id))
        if (ann.expiresAt) {
          const d = new Date(ann.expiresAt)
          setExpiresAt(d.toISOString().slice(0, 16))
        }
      }
      setGroups(gData.groups || [])
      setFetching(false)
    }).catch(() => setFetching(false))
  }, [params.id])

  const toggleRole  = (r: string) => setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  const toggleGroup = (id: string) => setSelectedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError(t("errorTitle")); return }
    if (!content.trim()) { setError(t("errorContent")); return }
    if (selectedRoles.length === 0) { setError(t("errorRoles")); return }

    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/announcements/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          titleAr: titleAr.trim() || undefined,
          content: content.trim(),
          contentAr: contentAr.trim() || undefined,
          type: selectedType,
          targetRoles: selectedRoles,
          targetGroupIds: selectedGroups,
          isPinned,
          expiresAt: expiresAt || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || t("error"))
      setSuccess(true)
      setTimeout(() => router.push("/admin/announcements"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-tahfidz-green" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("saved")}</h2>
          <p className="text-gray-500 mt-2">{t("redirecting")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <XCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("typeTitle")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPE_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setSelectedType(opt.value)}
                className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition ${selectedType === opt.value ? opt.activeCls : opt.inactiveCls + " text-gray-600 dark:text-gray-400"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("contentTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("titleFr")}</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("titleAr")}</label>
              <input value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm arabic" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("contentFr")}</label>
            <textarea rows={5} value={content} onChange={e => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("contentAr")}</label>
            <textarea rows={3} value={contentAr} onChange={e => setContentAr(e.target.value)} dir="rtl"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm resize-none arabic" />
          </div>
        </div>

        {/* Destinataires */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("recipients")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ROLE_OPTIONS.map(r => (
              <button key={r.value} type="button" onClick={() => toggleRole(r.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm transition ${selectedRoles.includes(r.value) ? "border-tahfidz-green bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green font-medium" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                <span>{r.icon}</span><span>{r.label}</span>
              </button>
            ))}
          </div>
          {groups.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t("targetGroups")}</p>
              <div className="flex flex-wrap gap-2">
                {groups.map(g => (
                  <button key={g.id} type="button" onClick={() => toggleGroup(g.id)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition ${selectedGroups.includes(g.id) ? "border-tahfidz-green bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green font-medium" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("options")}</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4 rounded accent-tahfidz-green" />
            <div className="flex items-center gap-2">
              <Pin size={16} className="text-tahfidz-green" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("pin")}</p>
            </div>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("expires")}</label>
            <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            {t("cancel")}
          </button>
          <button type="submit" disabled={loading || selectedRoles.length === 0}
            className="flex-1 py-3 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" />{t("saving")}</> : t("save")}
          </button>
        </div>
      </form>
    </div>
  )
}
