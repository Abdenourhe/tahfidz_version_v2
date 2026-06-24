// src/components/halaqa/HalaqaForm.tsx
// Formulaire partagé de création / édition d'une Halaqa Online (admin + teacher)

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import Link from "next/link"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import {
  Video, ArrowLeft, Calendar, Clock, Users, BookOpen,
  Mic, Monitor, Video as VideoIcon, Loader2, GraduationCap, Pencil
} from "lucide-react"

interface TeacherOption {
  id: string
  fullName: string
  email: string
}

interface HalaqaSession {
  id: string
  meetingName: string
  type: "INDIVIDUAL" | "COLLECTIVE"
  mode: "AUDIO_ONLY" | "VIDEO" | "SCREEN_SHARE"
  scheduledAt: string
  duration: number
  sourah?: string | null
  verses?: string | null
  studentIds: string[]
  groupId?: string | null
  teacherId?: string
  status: string
}

interface HalaqaFormProps {
  mode: "create" | "edit"
  sessionId?: string
  backHref: string
  isAdmin: boolean
  initialTeacherId?: string
  duplicateFrom?: HalaqaSession | null
  title: string
  subtitle: string
  submitLabel: string
}

export default function HalaqaForm({
  mode,
  sessionId,
  backHref,
  isAdmin,
  initialTeacherId,
  duplicateFrom,
  title,
  subtitle,
  submitLabel,
}: HalaqaFormProps) {
  const router = useRouter()
  const { locale } = useLanguage()
  const t = useT("halaqa")
  const isRTL = locale === "ar"

  type FormData = z.infer<typeof schema>

  const [students, setStudents] = useState<{ id: string; fullName: string; email: string }[]>([])
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [quotaStatus, setQuotaStatus] = useState<{ halaqaMaxDuration: number; plan: string } | null>(null)

  const schema = z.object({
    meetingName: z.string().min(2, t("nameRequired")),
    studentIds: z.array(z.string()).min(1, t("minOneStudent")),
    groupId: z.string().optional(),
    scheduledAt: z.string().min(1, t("dateRequired")),
    type: z.enum(["INDIVIDUAL", "COLLECTIVE"]),
    mode: z.enum(["AUDIO_ONLY", "VIDEO", "SCREEN_SHARE"]),
    sourah: z.string().optional(),
    verses: z.string().optional(),
    duration: z.number().min(15).max(quotaStatus?.halaqaMaxDuration ?? 180),
    teacherId: isAdmin ? z.string().min(1, "Enseignant requis") : z.string().optional(),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "INDIVIDUAL",
      mode: "AUDIO_ONLY",
      duration: 60,
      studentIds: [],
      teacherId: isAdmin ? initialTeacherId || "" : undefined,
    },
  })

  const selectedStudents = watch("studentIds") || []
  const selectedMode = watch("mode")

  // Chargement des données de référence + session en édition
  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoints = [
          fetch("/api/students"),
          fetch("/api/groups"),
          fetch("/api/halaqa/quota"),
        ]
        if (isAdmin) endpoints.push(fetch("/api/teachers"))

        const responses = await Promise.all(endpoints)
        const [sRes, gRes, qRes, tRes] = responses

        if (sRes.ok) {
          const sData = await sRes.json()
          setStudents(sData.students?.map((s: any) => s.user) || [])
        }
        if (gRes.ok) {
          const gData = await gRes.json()
          setGroups(gData.groups || [])
        }
        if (qRes.ok) {
          const qData = await qRes.json()
          if (qData.status) {
            setQuotaStatus({
              halaqaMaxDuration: qData.status.halaqaMaxDuration,
              plan: qData.status.plan,
            })
          }
        }
        if (isAdmin && tRes?.ok) {
          const tData = await tRes.json()
          setTeachers(
            (tData.teachers || []).map((teacher: any) => ({
              id: teacher.user.id,
              fullName: teacher.user.fullName,
              email: teacher.user.email,
            }))
          )
        }

        // Pré-remplissage en édition ou duplication
        if (mode === "edit" && sessionId) {
          const res = await fetch(`/api/halaqa/${sessionId}`)
          if (!res.ok) throw new Error("Session introuvable")
          const data = await res.json()
          const session: HalaqaSession = data.session
          reset({
            meetingName: session.meetingName,
            studentIds: session.studentIds,
            groupId: session.groupId || "",
            scheduledAt: new Date(session.scheduledAt).toISOString().slice(0, 16),
            type: session.type,
            mode: session.mode,
            sourah: session.sourah || "",
            verses: session.verses || "",
            duration: session.duration,
            teacherId: session.teacherId || initialTeacherId || "",
          })
        } else if (duplicateFrom) {
          const nextDate = new Date(duplicateFrom.scheduledAt)
          nextDate.setDate(nextDate.getDate() + 7)
          reset({
            meetingName: duplicateFrom.meetingName,
            studentIds: duplicateFrom.studentIds,
            groupId: duplicateFrom.groupId || "",
            scheduledAt: nextDate.toISOString().slice(0, 16),
            type: duplicateFrom.type,
            mode: duplicateFrom.mode,
            sourah: duplicateFrom.sourah || "",
            verses: duplicateFrom.verses || "",
            duration: duplicateFrom.duration,
            teacherId: duplicateFrom.teacherId || initialTeacherId || "",
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [mode, sessionId, isAdmin, initialTeacherId, duplicateFrom, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      }

      let res: Response
      if (mode === "edit" && sessionId) {
        res = await fetch(`/api/halaqa/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/halaqa/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erreur")
      }
      router.push(backHref)
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const modeOptions = [
    { value: "AUDIO_ONLY", label: t("audioOnly"), icon: Mic, desc: t("audioOnlyDesc") },
    { value: "VIDEO", label: t("video"), icon: VideoIcon, desc: t("videoDesc") },
    { value: "SCREEN_SHARE", label: t("screenShare"), icon: Monitor, desc: t("screenShareDesc") },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-6 transition"
        >
          <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
          {t("backToSessions")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            {mode === "edit" ? <Pencil size={24} className="text-tahfidz-green" /> : <Video size={24} className="text-tahfidz-green" />}
            {title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {subtitle}
          </p>

          {fetching ? (
            <div className="text-center py-12 text-gray-400">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
              {t("loading")}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Enseignant (admin uniquement) */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <GraduationCap size={14} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                    Enseignant
                  </label>
                  <select
                    {...register("teacherId")}
                    className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                  >
                    <option value="">Sélectionner un enseignant</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName} ({teacher.email})
                      </option>
                    ))}
                  </select>
                  {errors.teacherId && <p className="mt-1 text-xs text-red-600">{errors.teacherId.message}</p>}
                </div>
              )}

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("sessionName")}
                </label>
                <input
                  {...register("meetingName")}
                  placeholder={t("sessionNamePlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                />
                {errors.meetingName && <p className="mt-1 text-xs text-red-600">{errors.meetingName.message}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("sessionType")}
                </label>
                <div className="flex gap-3">
                  {(["INDIVIDUAL", "COLLECTIVE"] as const).map((typeVal) => (
                    <button
                      key={typeVal}
                      type="button"
                      onClick={() => setValue("type", typeVal)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
                        watch("type") === typeVal
                          ? "border-tahfidz-green bg-tahfidz-green/5 text-tahfidz-green"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {typeVal === "INDIVIDUAL" ? t("individual") : t("collective")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("communicationMode")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {modeOptions.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setValue("mode", m.value as any)}
                      className={`p-4 rounded-xl border text-left transition ${
                        selectedMode === m.value
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
                    <Calendar size={14} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                    {t("dateTime")}
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
                    <Clock size={14} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                    {t("durationMin")}
                  </label>
                  <input
                    type="number"
                    {...register("duration", { valueAsNumber: true })}
                    min={15}
                    max={quotaStatus?.halaqaMaxDuration ?? 180}
                    className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                  />
                  {quotaStatus && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Durée maximum autorisée par votre plan ({quotaStatus.plan}) : {quotaStatus.halaqaMaxDuration} minutes.
                    </p>
                  )}
                </div>
              </div>

              {/* Sourah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <BookOpen size={14} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                    {t("sourahOptional")}
                  </label>
                  <input
                    {...register("sourah")}
                    placeholder={t("sourahPlaceholder")}
                    className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("versesOptional")}
                  </label>
                  <input
                    {...register("verses")}
                    placeholder={t("versesPlaceholder")}
                    className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                  />
                </div>
              </div>

              {/* Élèves */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Users size={14} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                  {t("participants")}
                </label>
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
                {errors.studentIds && <p className="mt-1 text-xs text-red-600">{errors.studentIds.message}</p>}
              </div>

              {/* Groupe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("groupOptional")}
                </label>
                <select
                  {...register("groupId")}
                  className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                >
                  <option value="">{t("noGroup")}</option>
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
                {loading ? <><Loader2 size={16} className="animate-spin" /> {t("creating")}</> : <><Video size={16} /> {submitLabel}</>}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
