// src/app/teacher/maqra/new/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Video, ArrowLeft, Calendar, Clock, Users, BookOpen,
  Mic, Monitor, Video as VideoIcon, Loader2
} from "lucide-react"

const schema = z.object({
  meetingName: z.string().min(2, "Nom requis"),
  studentIds: z.array(z.string()).min(1, "Au moins un élève"),
  groupId: z.string().optional(),
  scheduledAt: z.string().min(1, "Date requise"),
  type: z.enum(["INDIVIDUAL", "COLLECTIVE"]),
  mode: z.enum(["AUDIO_ONLY", "VIDEO", "SCREEN_SHARE"]),
  sourah: z.string().optional(),
  verses: z.string().optional(),
  duration: z.number().min(15).max(180),
})

type FormData = z.infer<typeof schema>

export default function NewMaqraPage() {
  const router = useRouter()
  const [students, setStudents] = useState<{ id: string; fullName: string; email: string }[]>([])
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "INDIVIDUAL",
      mode: "AUDIO_ONLY",
      duration: 60,
      studentIds: [],
    },
  })

  const selectedGroup = watch("groupId")
  const selectedStudents = watch("studentIds") || []
  const mode = watch("mode")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, gRes] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/groups"),
        ])
        if (sRes.ok) {
          const sData = await sRes.json()
          setStudents(sData.students?.map((s: any) => s.user) || [])
        }
        if (gRes.ok) {
          const gData = await gRes.json()
          setGroups(gData.groups || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/maqra/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Erreur création")
      router.push("/teacher/maqra")
    } catch {
      alert("Erreur lors de la création de la séance")
    } finally {
      setLoading(false)
    }
  }

  const modeOptions = [
    { value: "AUDIO_ONLY", label: "Audio uniquement", icon: Mic, desc: "Micro activé, caméra désactivée" },
    { value: "VIDEO", label: "Audio + Vidéo", icon: VideoIcon, desc: "Micro et caméra activés" },
    { value: "SCREEN_SHARE", label: "Partage d'écran", icon: Monitor, desc: "Partage mushaf PDF" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/teacher/maqra"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-6 transition"
        >
          <ArrowLeft size={16} />
          Retour aux séances
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Video size={24} className="text-tahfidz-green" />
            Nouvelle Maqra&apos;
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Planifiez une séance de récitation en ligne avec vos élèves
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom de la séance
              </label>
              <input
                {...register("meetingName")}
                placeholder="Ex: Révision Sourate Al-Fatiha"
                className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
              />
              {errors.meetingName && <p className="mt-1 text-xs text-red-600">{errors.meetingName.message}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Type de séance
              </label>
              <div className="flex gap-3">
                {(["INDIVIDUAL", "COLLECTIVE"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("type", t)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
                      watch("type") === t
                        ? "border-tahfidz-green bg-tahfidz-green/5 text-tahfidz-green"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {t === "INDIVIDUAL" ? "Individuel" : "Collectif"}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Mode de communication
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {modeOptions.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setValue("mode", m.value as any)}
                    className={`p-4 rounded-xl border text-left transition ${
                      mode === m.value
                        ? "border-tahfidz-green bg-tahfidz-green/5 text-tahfidz-green"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <m.icon size={20} className="mb-2" />
                    <p className="text-sm font-semibold">{m.label}</p>
                    <p className="text-[11px] opacity-70 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Calendar size={14} className="inline mr-1" />
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  {...register("scheduledAt")}
                  className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                />
                {errors.scheduledAt && <p className="mt-1 text-xs text-red-600">{errors.scheduledAt.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Clock size={14} className="inline mr-1" />
                  Durée (min)
                </label>
                <input
                  type="number"
                  {...register("duration", { valueAsNumber: true })}
                  min={15}
                  max={180}
                  className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                />
              </div>
            </div>

            {/* Sourah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <BookOpen size={14} className="inline mr-1" />
                  Sourate (optionnel)
                </label>
                <input
                  {...register("sourah")}
                  placeholder="Ex: Al-Fatiha"
                  className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Versets (optionnel)
                </label>
                <input
                  {...register("verses")}
                  placeholder="Ex: 1-7"
                  className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                />
              </div>
            </div>

            {/* Élèves */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Users size={14} className="inline mr-1" />
                Élèves participants
              </label>
              {fetching ? (
                <p className="text-sm text-gray-400">Chargement des élèves...</p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                  {students.map((s) => {
                    const checked = selectedStudents.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          value={s.id}
                          checked={checked}
                          onChange={(e) => {
                            const current = new Set(selectedStudents)
                            if (e.target.checked) current.add(s.id)
                            else current.delete(s.id)
                            setValue("studentIds", Array.from(current))
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green/50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{s.fullName}</span>
                        <span className="text-xs text-gray-400 ml-auto">{s.email}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              {errors.studentIds && <p className="mt-1 text-xs text-red-600">{errors.studentIds.message}</p>}
            </div>

            {/* Groupe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Groupe (optionnel)
              </label>
              <select
                {...register("groupId")}
                className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
              >
                <option value="">Aucun groupe</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-tahfidz-green hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-tahfidz-green/20"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Création...</> : <><Video size={16} /> Créer la séance</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
