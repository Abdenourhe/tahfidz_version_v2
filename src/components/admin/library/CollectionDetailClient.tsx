"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Edit, FolderOpen, Plus, Users, X, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useState } from "react"

interface Content {
  id: string
  title: string
  type: string
  status: string
  thumbnail?: string | null
  category: { name: string; color?: string | null }
  _count: { episodes: number }
}

interface Enrollment {
  id: string
  status: string
  student: { id: string; user: { fullName: string | null; email: string } }
}

interface AvailableStudent {
  id: string
  user: { id: string; fullName: string | null; email: string }
}

interface Collection {
  id: string
  name: string
  nameAr?: string | null
  description?: string | null
  coverImage?: string | null
  color?: string | null
  groupId?: string | null
  group?: { name: string } | null
  contents: Content[]
  enrollments: Enrollment[]
  createdAt: string | Date
}

interface Props {
  collection: Collection
  availableStudents: AvailableStudent[]
}

export function CollectionDetailClient({ collection, availableStudents }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const typeLabel: Record<string, string> = {
    PDF: t("typePdf"),
    VIDEO_SINGLE: t("typeVideoSingle"),
    VIDEO_SERIES: t("typeVideoSeries"),
    AUDIO: t("typeAudio"),
  }

  const handleEnroll = async () => {
    if (!selectedStudentId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/library/collections/${collection.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, action: "enroll" }),
      })
      if (res.ok) {
        setSelectedStudentId("")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUnenroll = async (studentId: string) => {
    if (!confirm(t("confirmUnenroll") || "Retirer cet élève de la collection ?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/library/collections/${collection.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action: "unenroll" }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/library/collections" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{collection.name}</h1>
            {collection.nameAr && <p className="arabic text-sm text-gray-500">{collection.nameAr}</p>}
          </div>
        </div>
        <Link href={`/admin/library/collections/${collection.id}/edit`} className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <Edit size={14} /> {t("edit") || "Modifier"}
        </Link>
      </div>

      <div
        className="h-48 rounded-2xl bg-cover bg-center relative"
        style={{ backgroundColor: collection.color || "#1D9E75", backgroundImage: collection.coverImage ? `url(${collection.coverImage})` : undefined }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl" />
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-white/90 text-sm max-w-2xl">{collection.description || "—"}</p>
          <div className="flex items-center gap-4 mt-3 text-white/80 text-xs">
            <span className="flex items-center gap-1"><BookOpen size={12} /> {collection.contents.length} {t("contents").toLowerCase()}</span>
            <span className="flex items-center gap-1"><Users size={12} /> {collection.enrollments.length} {t("enrolled").toLowerCase()}</span>
            {collection.group && <span>{collection.group.name}</span>}
          </div>
        </div>
      </div>

      {/* Enrollments (standalone collections only) */}
      {!collection.groupId && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("enrollments")}</h2>

          {availableStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
              >
                <option value="">{t("selectStudent") || "Sélectionner un élève"}</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.user.fullName || s.user.email}</option>
                ))}
              </select>
              <button
                onClick={handleEnroll}
                disabled={!selectedStudentId || loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-tahfidz-green text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {t("enroll") || "Inscrire"}
              </button>
            </div>
          )}

          {collection.enrollments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noEnrollments") || "Aucun élève inscrit."}</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {collection.enrollments.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{e.student.user.fullName || e.student.user.email}</p>
                    <p className="text-xs text-gray-500">{e.student.user.email}</p>
                  </div>
                  <button
                    onClick={() => handleUnenroll(e.student.id)}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title={t("unenroll") || "Désinscrire"}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("contents")}</h2>
        <Link href={`/admin/library/contents/new?collectionId=${collection.id}`} className="flex items-center gap-2 px-4 py-2 bg-tahfidz-green text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition">
          <Plus size={16} /> {t("newContent")}
        </Link>
      </div>

      {collection.contents.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <FolderOpen size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">{t("noContents")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collection.contents.map((content, i) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 card-hover flex gap-4"
            >
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                {content.thumbnail ? (
                  <img src={content.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><BookOpen size={20} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{content.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{typeLabel[content.type] || content.type}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: content.category.color ? `${content.category.color}20` : "#E8F8F2", color: content.category.color || "#1D9E75" }}>{content.category.name}</span>
                </div>
              </div>
              <Link href={`/admin/library/contents/${content.id}/edit`} className="self-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <Edit size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
