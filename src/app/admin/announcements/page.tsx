"use client"
// src/app/admin/announcements/page.tsx — with edit + delete

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Megaphone, Pin, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface Announcement {
  id: string; title: string; titleAr?: string | null; type: string
  isPinned: boolean; isPublished: boolean; createdAt: string
  expiresAt?: string | null; targetRoles: string[]
  author: { fullName: string }
  targetGroups: { group: { name: string } }[]
}

export default function AdminAnnouncementsPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router = useRouter()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const T = {
    title:        { fr: "Annonces",                 en: "Announcements",         ar: "الإعلانات" },
    subtitle:     { fr: "annonce",                  en: "announcement",          ar: "إعلان" },
    new:          { fr: "Nouvelle annonce",         en: "New announcement",      ar: "إعلان جديد" },
    noAnn:        { fr: "Aucune annonce",           en: "No announcements",      ar: "لا توجد إعلانات" },
    edit:         { fr: "Modifier",                 en: "Edit",                  ar: "تعديل" },
    delete:       { fr: "Supprimer",                en: "Delete",                ar: "حذف" },
    confirm:      { fr: "Confirmer",                en: "Confirm",               ar: "تأكيد" },
    cancel:       { fr: "Annuler",                  en: "Cancel",                ar: "إلغاء" },
    by:           { fr: "Par",                      en: "By",                    ar: "بواسطة" },
    on:           { fr: "le",                       en: "on",                    ar: "في" },
    expires:      { fr: "Expire le",                en: "Expires on",            ar: "ينتهي في" },
    target:       { fr: "Cible",                    en: "Target",                ar: "الهدف" },
    pinned:       { fr: "Épinglé",                  en: "Pinned",                ar: "مثبَّت" },
    draft:        { fr: "Brouillon",                en: "Draft",                 ar: "مسودة" },
    expired:      { fr: "Expirée",                  en: "Expired",               ar: "منتهية" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    GENERAL:     { label: L === "ar" ? "عام" : L === "en" ? "General" : "Général",   color: "bg-gray-100 text-gray-600" },
    EVENT:       { label: L === "ar" ? "حدث" : L === "en" ? "Event" : "Événement",     color: "bg-blue-100 text-blue-700" },
    ACHIEVEMENT: { label: L === "ar" ? "إنجاز" : L === "en" ? "Achievement" : "Réussite", color: "bg-yellow-100 text-yellow-700" },
    URGENT:      { label: L === "ar" ? "عاجل" : L === "en" ? "Urgent" : "Urgent",      color: "bg-red-100 text-red-700" },
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(
    L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
    { day: "2-digit", month: "short", year: "numeric" }
  )

  const fetchAnnouncements = async () => {
    setLoading(true)
    const res = await fetch("/api/announcements?limit=100")
    const d   = await res.json()
    setAnnouncements(d.announcements || [])
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const deleteAnn = async (id: string) => {
    setDeleting(id)
    setConfirmId(null)
    try {
      await fetch(`/api/announcements/${id}`, { method: "DELETE" })
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {announcements.length} {t("subtitle")}{announcements.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/announcements/new"
          className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Plus size={16} /> {t("new")}
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-tahfidz-green" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <Megaphone size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400">{t("noAnn")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const tc = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.GENERAL
            const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date()
            return (
              <div key={ann.id} className={`bg-white dark:bg-gray-900 rounded-xl border p-5 ${ann.isPinned ? "border-tahfidz-green" : "border-gray-100 dark:border-gray-800"} ${isExpired ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-4">
                  {ann.isPinned && <Pin size={16} className="text-tahfidz-green flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{ann.title}</h3>
                      {ann.titleAr && <span className="arabic text-sm text-gray-400">{ann.titleAr}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tc.color}`}>{tc.label}</span>
                      {isExpired && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">{t("expired")}</span>}
                      {!ann.isPublished && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{t("draft")}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>{t("by")} {ann.author.fullName}</span>
                      <span>· {t("on")} {fmtDate(ann.createdAt)}</span>
                      {ann.expiresAt && <span>· {t("expires")} {fmtDate(ann.expiresAt)}</span>}
                      <span>· {t("target")}: {ann.targetRoles.join(", ")}</span>
                      {ann.targetGroups.length > 0 && (
                        <span>· {ann.targetGroups.map(tg => tg.group.name).join(", ")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/admin/announcements/${ann.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <Pencil size={13} /> {t("edit")}
                    </Link>
                    {confirmId === ann.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteAnn(ann.id)} disabled={deleting === ann.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition">
                          {deleting === ann.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                          {t("confirm")}
                        </button>
                        <button onClick={() => setConfirmId(null)}
                          className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          {t("cancel")}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(ann.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        <Trash2 size={13} /> {t("delete")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
