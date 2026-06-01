// src/app/parent/halaqa/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { FileVideo, Calendar, Loader2, User, BarChart3 } from "lucide-react"

interface Recording {
  id: string
  meetingName: string
  scheduledAt: string
  recordingUrl?: string
  teacher: { fullName: string }
  evaluations: { memorizationScore?: number | null }[]
}

export default function ParentHalaqaPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecordings()
  }, [])

  const fetchRecordings = async () => {
    try {
      const res = await fetch("/api/halaqa/recordings")
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setRecordings(data.recordings || [])
    } catch {
      setRecordings([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <FileVideo size={28} className="text-tahfidz-green" />
          Enregistrements Halaqa Online
        </h1>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={32} className="animate-spin text-tahfidz-green mx-auto" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-20">
            <FileVideo size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun enregistrement disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{r.meetingName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(r.scheduledAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><User size={14} /> {r.teacher.fullName}</span>
                      {r.evaluations.length > 0 && r.evaluations[0]?.memorizationScore !== null && (
                        <span className="flex items-center gap-1 text-tahfidz-green">
                          <BarChart3 size={14} />
                          Note: {r.evaluations[0].memorizationScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.recordingUrl ? (
                      <a
                        href={r.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-tahfidz-green hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
                      >
                        <FileVideo size={16} className="inline mr-1" />
                        Regarder
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">En cours de traitement</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
