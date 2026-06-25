// src/components/halaqa/HalaqaForm.tsx
// Formulaire partagé intelligent de création / édition d'une Halaqa Online (admin + teacher)

"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import Link from "next/link"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import {
  Video, ArrowLeft, Calendar, Clock, Users, BookOpen,
  Mic, Monitor, Video as VideoIcon, Loader2, GraduationCap, Pencil,
  Repeat, AlertTriangle, Search, CheckSquare
} from "lucide-react"

interface TeacherOption {
  id: string
  fullName: string
  email: string
}

interface StudentOption {
  id: string
  fullName: string
  email: string
  groupId?: string | null
}

interface GroupOption {
  id: string
  name: string
  teacherUserId?: string | null
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
  status?: string
}

interface ExistingSession {
  id: string
  meetingName: string
  scheduledAt: string
  duration: number
  teacherId: string
  groupId?: string | null
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

  const [students, setStudents] = useState<StudentOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [quotaStatus, setQuotaStatus] = useState<{ halaqaMaxDuration: number; plan: string } | null>(null)
  const [existingSessions, setExistingSessions] = useState<ExistingSession[]>([])
  const [recurrence, setRecurrence] = useState<{
    enabled: boolean
    frequency: "DAILY" | "WEEKLY"
    occurrences: number
  }>({
    enabled: false,
    frequency: "WEEKLY",
    occurrences: 4,
  })
  const [filterByGroup, setFilterByGroup] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")

  const maxDuration = quotaStatus?.halaqaMaxDuration ?? 180

  const schema = useMemo(
    () =>
      z.object({
        meetingName: z.string().min(2, t("nameRequired")),
        studentIds: z.array(z.string()).min(1, t("minOneStudent")),
        groupId: z.string().optional(),
        scheduledAt: z
          .string()
          .min(1, t("dateRequired"))
          .refine(
            (val) => {
              if (mode === "edit") return true
              return new Date(val).getTime() >= Date.now() - 60_000
            },
            { message: t("dateInPastCreate") }
          ),
        type: z.enum(["INDIVIDUAL", "COLLECTIVE"]),
        mode: z.enum(["AUDIO_ONLY", "VIDEO", "SCREEN_SHARE"]),
        sourah: z.string().optional(),
        verses: z.string().optional(),
        duration: z.number().min(15).max(maxDuration),
        teacherId: isAdmin ? z.string().min(1, "Enseignant requis") : z.string().optional(),
      }),
    [mode, isAdmin, maxDuration, t]
  )

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "INDIVIDUAL",
      mode: "AUDIO_ONLY",
      duration: 60,
      studentIds: [],
      teacherId: isAdmin ? initialTeacherId || "" : undefined,
    },
  })

  const rawSelectedStudents = watch("studentIds")
  const selectedStudents = useMemo(() => rawSelectedStudents || [], [rawSelectedStudents])
  const selectedMode = watch("mode")
  const selectedGroupId = watch("groupId") || ""
  const selectedTeacherId = watch("teacherId") || ""
  const scheduledAt = watch("scheduledAt")
  const durationValue = watch("duration") || 60

  // ─── Chargement des données de référence + session en édition ─────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoints: Promise<Response>[] = [
          fetch("/api/students"),
          fetch("/api/groups"),
          fetch("/api/halaqa/quota"),
          fetch("/api/halaqa/sessions"),
        ]
        if (isAdmin) endpoints.push(fetch("/api/teachers"))

        const responses = await Promise.all(endpoints)
        const [sRes, gRes, qRes, xRes, tRes] = responses

        if (sRes.ok) {
          const sData = await sRes.json()
          setStudents(
            (sData.students || [])
              .map((s: any) => ({
                id: s.user?.id,
                fullName: s.user?.fullName || "",
                email: s.user?.email || "",
                groupId: s.group?.id || null,
              }))
              .filter((s: StudentOption) => s.id)
          )
        }

        if (gRes.ok) {
          const gData = await gRes.json()
          setGroups(
            (gData.groups || []).map((g: any) => ({
              id: g.id,
              name: g.name,
              teacherUserId: g.teacher?.user?.id || null,
            }))
          )
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

        if (xRes.ok) {
          const xData = await xRes.json()
          setExistingSessions(xData.sessions || [])
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

  // ─── Filtre des groupes selon l'enseignant choisi (admin) ─────────────────────
  const visibleGroups = useMemo(() => {
    if (!isAdmin || !selectedTeacherId) return groups
    return groups.filter((g) => g.teacherUserId === selectedTeacherId)
  }, [groups, selectedTeacherId, isAdmin])

  useEffect(() => {
    if (!selectedGroupId) return
    if (visibleGroups.length > 0 && !visibleGroups.some((g) => g.id === selectedGroupId)) {
      setValue("groupId", "")
    }
  }, [visibleGroups, selectedGroupId, setValue])

  // ─── Détection de conflits de créneaux ────────────────────────────────────────
  function overlaps(aStart: Date, aDuration: number, bStart: Date, bDuration: number) {
    const aEnd = new Date(aStart.getTime() + aDuration * 60000)
    const bEnd = new Date(bStart.getTime() + bDuration * 60000)
    return aStart < bEnd && aEnd > bStart
  }

  const conflict = useMemo(() => {
    if (!scheduledAt || !durationValue) return null
    const start = new Date(scheduledAt)
    if (Number.isNaN(start.getTime())) return null

    return existingSessions.find((ex) => {
      if (mode === "edit" && ex.id === sessionId) return false
      const exStart = new Date(ex.scheduledAt)
      if (Number.isNaN(exStart.getTime())) return false
      if (!overlaps(start, durationValue, exStart, ex.duration)) return false

      if (isAdmin) {
        const sameTeacher = ex.teacherId && ex.teacherId === selectedTeacherId
        const sameGroup = selectedGroupId && ex.groupId === selectedGroupId
        return !!(sameTeacher || sameGroup)
      }
      // Enseignant : l'API ne retourne que SES séances, donc tout chevauchement est un conflit
      return true
    })
  }, [scheduledAt, durationValue, existingSessions, selectedTeacherId, selectedGroupId, isAdmin, mode, sessionId])

  const isPastDate = useMemo(() => {
    if (!scheduledAt) return false
    const d = new Date(scheduledAt)
    return !Number.isNaN(d.getTime()) && d.getTime() < Date.now() - 60_000
  }, [scheduledAt])

  // ─── Participants : filtre et sélection intelligente ──────────────────────────
  const visibleStudents = useMemo(() => {
    let list = [...students]
    if (filterByGroup && selectedGroupId) {
      list = list.filter((s) => s.groupId === selectedGroupId)
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase()
      list = list.filter((s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    }
    return list
  }, [students, filterByGroup, selectedGroupId, studentSearch])

  // ─── Soumission ───────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const payload: any = {
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      }
      if (mode === "create" && recurrence.enabled) {
        payload.recurrence = {
          frequency: recurrence.frequency,
          occurrences: recurrence.occurrences,
        }
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

  const inputClass =
    "w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
  const errorClass = "mt-1 text-xs text-red-600"
  const cardBase =
    "rounded-xl border text-sm font-medium transition flex items-center justify-center py-3"
  const cardActive = "border-tahfidz-green bg-tahfidz-green/5 text-tahfidz-green"
  const cardInactive =
    "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"

  function formatSessionTime(iso: string, dur: number) {
    const start = new Date(iso)
    const end = new Date(start.getTime() + dur * 60000)
    const pad = (n: number) => n.toString().padStart(2, "0")
    const date = start.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR", {
      day: "2-digit",
      month: "short",
    })
    return `${date} ${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`
  }

  const groupSelectRegister = register("groupId")

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-6 transition"
        >
          <ArrowLeft size={16} className={cn(isRTL && "rotate-180")} />
          {t("backToSessions")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            {mode === "edit" ? (
              <Pencil size={24} className="text-tahfidz-green" />
            ) : (
              <Video size={24} className="text-tahfidz-green" />
            )}
            {title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {subtitle}
            {recurrence.enabled && mode === "create" && (
              <span className="ml-2 inline-flex items-center gap-1 text-tahfidz-green text-xs font-medium">
                <Repeat size={12} />
                {recurrence.occurrences} × {recurrence.frequency === "DAILY" ? t("daily") : t("weekly")}
              </span>
            )}
          </p>

          {fetching ? (
            <div className="text-center py-12 text-gray-400">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
              {t("loading")}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* ─── Enseignant (admin uniquement) ───────────────────────────── */}
              {isAdmin && (
                <div>
                  <label className={labelClass}>
                    <GraduationCap size={14} className={cn("inline", isRTL ? "ml-1" : "mr-1")} />
                    Enseignant
                  </label>
                  <select {...register("teacherId")} className={inputClass}>
                    <option value="">Sélectionner un enseignant</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName} ({teacher.email})
                      </option>
                    ))}
                  </select>
                  {errors.teacherId && <p className={errorClass}>{errors.teacherId.message}</p>}
                </div>
              )}

              {/* ─── Nom ─────────────────────────────────────────────────────── */}
              <div>
                <label className={labelClass}>{t("sessionName")}</label>
                <input
                  {...register("meetingName")}
                  placeholder={t("sessionNamePlaceholder")}
                  className={inputClass}
                />
                {errors.meetingName && <p className={errorClass}>{errors.meetingName.message}</p>}
              </div>

              {/* ─── Type ────────────────────────────────────────────────────── */}
              <div>
                <label className={labelClass}>{t("sessionType")}</label>
                <div className="flex gap-3">
                  {(["INDIVIDUAL", "COLLECTIVE"] as const).map((typeVal) => (
                    <button
                      key={typeVal}
                      type="button"
                      onClick={() => setValue("type", typeVal)}
                      className={cn(cardBase, "flex-1", watch("type") === typeVal ? cardActive : cardInactive)}
                    >
                      {typeVal === "INDIVIDUAL" ? t("individual") : t("collective")}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── Mode ────────────────────────────────────────────────────── */}
              <div>
                <label className={labelClass}>{t("communicationMode")}</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {modeOptions.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setValue("mode", m.value as any)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition",
                        selectedMode === m.value
                          ? "border-tahfidz-green bg-tahfidz-green/5 text-tahfidz-green"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <m.icon size={20} className="mb-2" />
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-[11px] opacity-70 mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── Date / Durée ────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <Calendar size={14} className={cn("inline", isRTL ? "ml-1" : "mr-1")} />
                    {t("dateTime")}
                  </label>
                  <input
                    type="datetime-local"
                    {...register("scheduledAt")}
                    min={mode === "create" ? new Date().toISOString().slice(0, 16) : undefined}
                    className={inputClass}
                  />
                  {errors.scheduledAt && <p className={errorClass}>{errors.scheduledAt.message}</p>}
                  {mode === "edit" && isPastDate && (
                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {t("dateInPast")}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    <Clock size={14} className={cn("inline", isRTL ? "ml-1" : "mr-1")} />
                    {t("durationMin")}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={15}
                      max={maxDuration}
                      step={5}
                      value={durationValue}
                      onChange={(e) => setValue("duration", Number(e.target.value), { shouldValidate: true })}
                      className="flex-1 accent-tahfidz-green"
                    />
                    <input
                      type="number"
                      {...register("duration", { valueAsNumber: true })}
                      min={15}
                      max={maxDuration}
                      className={cn(inputClass, "w-24 text-center")}
                    />
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-tahfidz-green transition-all"
                      style={{ width: `${Math.min(100, (durationValue / maxDuration) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                    <span>{t("durationSlider")}</span>
                    <span>
                      {durationValue} / {maxDuration} min
                    </span>
                  </div>
                  {errors.duration && <p className={errorClass}>{errors.duration.message}</p>}
                  {quotaStatus && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      {t("quotaMax")} ({quotaStatus.plan}) : {maxDuration} min.
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Alerte conflit ──────────────────────────────────────────── */}
              {conflict && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{t("conflictDetected")}</p>
                    <p className="text-xs opacity-90">
                      {t("conflictWithSession")
                        .replace("{name}", conflict.meetingName)
                        .replace("{time}", formatSessionTime(conflict.scheduledAt, conflict.duration))}
                    </p>
                  </div>
                </div>
              )}

              {/* ─── Récurrence (création uniquement) ────────────────────────── */}
              {mode === "create" && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recurrence.enabled}
                      onChange={(e) => setRecurrence((prev) => ({ ...prev, enabled: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green/50"
                    />
                    <Repeat size={16} className="text-tahfidz-green" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("repeatThisSession")}
                    </span>
                  </label>

                  {recurrence.enabled && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={cn(labelClass, "text-xs")}>{t("frequency")}</label>
                        <select
                          value={recurrence.frequency}
                          onChange={(e) =>
                            setRecurrence((prev) => ({ ...prev, frequency: e.target.value as any }))
                          }
                          className={inputClass}
                        >
                          <option value="DAILY">{t("daily")}</option>
                          <option value="WEEKLY">{t("weekly")}</option>
                        </select>
                      </div>
                      <div>
                        <label className={cn(labelClass, "text-xs")}>{t("occurrences")}</label>
                        <input
                          type="number"
                          min={2}
                          max={10}
                          value={recurrence.occurrences}
                          onChange={(e) =>
                            setRecurrence((prev) => ({
                              ...prev,
                              occurrences: Math.min(10, Math.max(2, Number(e.target.value) || 2)),
                            }))
                          }
                          className={inputClass}
                        />
                        <p className="text-xs text-gray-400 mt-1">{t("occurrencesHint")}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Sourate / Versets ───────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <BookOpen size={14} className={cn("inline", isRTL ? "ml-1" : "mr-1")} />
                    {t("sourahOptional")}
                  </label>
                  <input
                    {...register("sourah")}
                    placeholder={t("sourahPlaceholder")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("versesOptional")}</label>
                  <input
                    {...register("verses")}
                    placeholder={t("versesPlaceholder")}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* ─── Groupe ──────────────────────────────────────────────────── */}
              <div>
                <label className={labelClass}>{t("groupOptional")}</label>
                {isAdmin && !selectedTeacherId && (
                  <p className="text-xs text-gray-400 mb-1.5">{t("selectTeacherFirst")}</p>
                )}
                {selectedGroupId && (
                  <p className="text-xs text-tahfidz-green mb-1.5 flex items-center gap-1">
                    <CheckSquare size={12} />
                    {t("groupAutoSelected")}
                  </p>
                )}
                <select
                  {...groupSelectRegister}
                  onChange={(e) => {
                    groupSelectRegister.onChange(e)
                    const value = e.target.value
                    if (value) {
                      const groupStudentIds = students
                        .filter((s) => s.groupId === value)
                        .map((s) => s.id)
                      if (groupStudentIds.length > 0) {
                        setValue("studentIds", groupStudentIds, { shouldValidate: true })
                      }
                    }
                  }}
                  className={inputClass}
                >
                  <option value="">{t("noGroup")}</option>
                  {visibleGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ─── Participants ────────────────────────────────────────────── */}
              <div>
                <label className={labelClass}>
                  <Users size={14} className={cn("inline", isRTL ? "ml-1" : "mr-1")} />
                  {t("participants")}
                </label>

                <div className="mb-3 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder={t("searchStudent")}
                      className={cn(inputClass, "pl-9")}
                    />
                  </div>

                  <label
                    className={cn(
                      cardBase,
                      "cursor-pointer px-3 select-none",
                      filterByGroup && selectedGroupId ? cardActive : cardInactive,
                      !selectedGroupId && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={filterByGroup}
                      onChange={(e) => setFilterByGroup(e.target.checked)}
                      disabled={!selectedGroupId}
                    />
                    {t("groupStudentsOnly")}
                  </label>

                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {selectedStudents.length} {t("studentsSelected")}
                </div>

                <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                  {visibleStudents.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">{t("noStudentsInGroup")}</p>
                  ) : (
                    visibleStudents.map((s) => {
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
                              setValue("studentIds", Array.from(current), { shouldValidate: true })
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green/50"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{s.fullName}</span>
                          <span className="text-xs text-gray-400 ml-auto">{s.email}</span>
                        </label>
                      )
                    })
                  )}
                </div>
                {errors.studentIds && <p className={errorClass}>{errors.studentIds.message}</p>}
              </div>

              {/* ─── Submit ──────────────────────────────────────────────────── */}
              <button
                type="submit"
                disabled={loading || !!conflict}
                className="w-full py-3.5 bg-tahfidz-green hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-tahfidz-green/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {t("creating")}
                  </>
                ) : (
                  <>
                    <Video size={16} /> {submitLabel}
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
