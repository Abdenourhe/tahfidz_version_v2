// src/components/halaqa/HalaqaForm.tsx
// Formulaire partagé intelligent de création / édition d'une Halaqa Online (admin + teacher)

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  teacherUserId?: string | null
}

interface GroupOption {
  id: string
  name: string
  teacherUserId?: string | null
  teacherName?: string | null
  maxCapacity?: number
  studentCount?: number
}

export interface HalaqaSession {
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
  group?: { id: string; name: string } | null
  invitedGroups?: { group: { id: string; name: string } }[]
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
  const groupsRef = useRef<GroupOption[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [quotaStatus, setQuotaStatus] = useState<{ halaqaMaxDuration: number; plan: string } | null>(null)
  const [existingSessions, setExistingSessions] = useState<ExistingSession[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [invitedGroupIds, setInvitedGroupIds] = useState<string[]>([])
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
        groupId: isAdmin ? z.string().optional() : z.string().min(1, t("groupRequired")),
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
    getValues,
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
        const groupEndpoint = isAdmin ? "/api/groups" : "/api/groups?mine=true"
        const endpoints: Promise<Response>[] = [
          fetch("/api/students"),
          fetch(groupEndpoint),
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
                teacherUserId: s.teacher?.user?.id || null,
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
              teacherName: g.teacher?.user?.fullName || null,
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

          // En mode enseignant, seuls ses groupes sont retournés. Si la session
          // possède un groupe hors de cette liste, on l'ajoute pour permettre l'édition.
          const sessionGroupId = session.groupId
          if (!isAdmin && sessionGroupId && !groupsRef.current.some((g) => g.id === sessionGroupId)) {
            setGroups((prev) => [
              ...prev,
              {
                id: sessionGroupId,
                name: session.group?.name || "Groupe",
                teacherUserId: session.teacherId || null,
              },
            ])
          }

          setInvitedGroupIds(session.invitedGroups?.map((g) => g.group.id) || [])
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
          setInvitedGroupIds(duplicateFrom.invitedGroups?.map((g) => g.group.id) || [])
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
  useEffect(() => {
    groupsRef.current = groups
  }, [groups])

  // ─── Récupération de l'utilisateur connecté ───────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) setCurrentUserId(data.user.id)
      })
      .catch(console.error)
  }, [])

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

  // Pré-sélectionne automatiquement le groupe principal s'il n'y en a qu'un
  useEffect(() => {
    if (selectedGroupId) return
    if (visibleGroups.length === 1) {
      setValue("groupId", visibleGroups[0].id, { shouldValidate: true })
    }
  }, [visibleGroups, selectedGroupId, setValue])

  // ─── Pré-remplissage intelligent du nom de séance ─────────────────────────────
  useEffect(() => {
    if (mode !== "create" || duplicateFrom) return
    if (!selectedGroupId || !scheduledAt) return
    const group = visibleGroups.find((g) => g.id === selectedGroupId)
    if (!group) return
    const current = getValues("meetingName")
    if (current) return
    const dateStr = new Date(scheduledAt).toLocaleDateString(
      locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR",
      { day: "2-digit", month: "short" }
    )
    setValue("meetingName", `Halaqa – ${group.name} – ${dateStr}`)
  }, [mode, duplicateFrom, selectedGroupId, scheduledAt, visibleGroups, getValues, setValue, locale])

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

  // ─── Participants : filtre par enseignant + auto-réduction au groupe ──────────
  const skipAutoGroupFilterRef = useRef(false)

  useEffect(() => {
    if (skipAutoGroupFilterRef.current) {
      skipAutoGroupFilterRef.current = false
      return
    }
    setFilterByGroup(!!selectedGroupId)
  }, [selectedGroupId])

  // ─── Mise à jour intelligente des élèves selon les groupes autorisés ──────────
  const prevAllowedGroupsRef = useRef<string[]>([])

  useEffect(() => {
    const allowedGroupIds = [selectedGroupId, ...invitedGroupIds].filter(Boolean)
    const prevAllowed = prevAllowedGroupsRef.current

    const addedGroups = allowedGroupIds.filter((id) => !prevAllowed.includes(id))
    const removedGroups = prevAllowed.filter((id) => !allowedGroupIds.includes(id))

    if (addedGroups.length === 0 && removedGroups.length === 0) return

    const currentStudentIds = new Set(selectedStudents)

    addedGroups.forEach((groupId) => {
      students.filter((s) => s.groupId === groupId).forEach((s) => currentStudentIds.add(s.id))
    })

    removedGroups.forEach((groupId) => {
      students.filter((s) => s.groupId === groupId).forEach((s) => {
        const stillAllowed = allowedGroupIds.some((gid) => s.groupId === gid)
        if (!stillAllowed) currentStudentIds.delete(s.id)
      })
    })

    setValue("studentIds", Array.from(currentStudentIds), { shouldValidate: true })
    prevAllowedGroupsRef.current = allowedGroupIds
  }, [selectedGroupId, invitedGroupIds, students, selectedStudents, setValue])

  const visibleStudents = useMemo(() => {
    const allowedGroupIds = new Set([selectedGroupId, ...invitedGroupIds].filter(Boolean))

    // Admin : si aucun groupe n'est sélectionné, on n'affiche pas la liste entière des élèves
    if (isAdmin && allowedGroupIds.size === 0) return []

    let list = [...students]

    // Admin : on réduit aux élèves de l'enseignant choisi (par enseignant assigné ou par groupe)
    if (isAdmin && selectedTeacherId) {
      const teacherGroupIds = new Set(visibleGroups.map((g) => g.id))
      list = list.filter(
        (s) =>
          s.teacherUserId === selectedTeacherId ||
          (s.groupId && teacherGroupIds.has(s.groupId))
      )
    }

    // Enseignant : on restreint aux élèves du groupe principal + groupes invités
    if (!isAdmin && currentUserId) {
      list = list.filter(
        (s) =>
          s.teacherUserId === currentUserId ||
          (s.groupId && allowedGroupIds.has(s.groupId))
      )
    }

    // Groupe sélectionné : réduction optionnelle (activée automatiquement, désactivable)
    if (filterByGroup && selectedGroupId) {
      list = list.filter((s) => s.groupId === selectedGroupId)
    }

    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase()
      list = list.filter((s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    }
    return list
  }, [students, isAdmin, selectedTeacherId, visibleGroups, currentUserId, invitedGroupIds, filterByGroup, selectedGroupId, studentSearch])

  // ─── Soumission ───────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const payload: any = {
        ...data,
        invitedGroupIds,
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

  const availableGroupsForInvite = useMemo(
    () => groups.filter((g) => g.id !== selectedGroupId),
    [groups, selectedGroupId]
  )

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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setValue("duration", Math.min(d, maxDuration), { shouldValidate: true })}
                        className={cn(
                          "px-2.5 py-1 rounded-lg border text-xs font-medium transition",
                          durationValue === d
                            ? "border-tahfidz-green bg-tahfidz-green/5 text-tahfidz-green"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                      >
                        {d} min
                      </button>
                    ))}
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
                <label className={labelClass}>{t("group")}</label>
                {isAdmin && !selectedTeacherId ? (
                  <p className="text-xs text-gray-400 mb-1.5">{t("selectTeacherFirst")}</p>
                ) : (
                  <>
                    {!selectedGroupId && visibleGroups.length > 1 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {t("selectGroup")}
                      </p>
                    )}
                    {selectedGroupId && (
                      <p className="text-xs text-tahfidz-green mb-1.5 flex items-center gap-1">
                        <CheckSquare size={12} />
                        {t("groupAutoSelected")}
                      </p>
                    )}
                  </>
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

                {selectedGroupId && (() => {
                  const group = visibleGroups.find((g) => g.id === selectedGroupId)
                  if (!group) return null
                  const count = group.studentCount ?? 0
                  const capacity = group.maxCapacity ?? 0
                  const full = count >= capacity
                  return (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {t("groupCapacity")}: {count} / {capacity}
                      </span>
                      {full && (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          {t("groupFull")}
                        </span>
                      )}
                    </div>
                  )
                })()}

                {/* Groupes invités (admin uniquement) */}
                {isAdmin && (
                  <div className="mt-4">
                    <label className={labelClass}>{t("invitedGroups")}</label>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1.5 flex items-start gap-1">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      {t("invitedGroupsHint")}
                    </p>
                    {availableGroupsForInvite.length === 0 ? (
                      <p className="text-xs text-gray-400">{t("noInvitedGroupsAvailable")}</p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                        {availableGroupsForInvite.map((g) => {
                          const checked = invitedGroupIds.includes(g.id)
                          return (
                            <label
                              key={g.id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const current = new Set(invitedGroupIds)
                                  if (e.target.checked) current.add(g.id)
                                  else current.delete(g.id)
                                  setInvitedGroupIds(Array.from(current))
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green/50"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {g.name}
                                {g.teacherName && (
                                  <span className="block text-[10px] text-gray-400">{g.teacherName}</span>
                                )}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Groupes invités en mode enseignant (lecture seule) */}
                {!isAdmin && invitedGroupIds.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-medium mb-1 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {t("invitedGroupsByAdmin")}
                    </p>
                    <ul className="space-y-0.5">
                      {invitedGroupIds.map((id) => {
                        const g = groups.find((grp) => grp.id === id)
                        if (!g) return null
                        return (
                          <li key={id} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>
                              {g.name}
                              {g.teacherName && <span className="text-amber-600/80 dark:text-amber-400/80"> — {g.teacherName}</span>}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
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
                      !selectedGroupId && "hidden"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={filterByGroup}
                      onChange={(e) => {
                        skipAutoGroupFilterRef.current = true
                        setFilterByGroup(e.target.checked)
                      }}
                      disabled={!selectedGroupId}
                    />
                    {t("groupStudentsOnly")}
                  </label>

                </div>

                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedStudents.length} {t("studentsSelected")}
                  </span>
                  {visibleStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = visibleStudents.every((s) => selectedStudents.includes(s.id))
                        if (allSelected) {
                          const toKeep = selectedStudents.filter(
                            (id) => !visibleStudents.some((s) => s.id === id)
                          )
                          setValue("studentIds", toKeep, { shouldValidate: true })
                        } else {
                          const newSet = new Set([...selectedStudents, ...visibleStudents.map((s) => s.id)])
                          setValue("studentIds", Array.from(newSet), { shouldValidate: true })
                        }
                      }}
                      className="text-xs font-medium text-tahfidz-green hover:underline"
                    >
                      {visibleStudents.every((s) => selectedStudents.includes(s.id))
                        ? t("deselectAll")
                        : t("selectAll")}
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                  {visibleStudents.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">
                      {isAdmin && !selectedGroupId && invitedGroupIds.length === 0
                        ? t("selectGroupToSeeStudents")
                        : t("noStudentsInGroup")}
                    </p>
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
                          <span className="text-xs text-gray-400 ml-auto flex items-center gap-2">
                            {s.groupId && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                                {groups.find((g) => g.id === s.groupId)?.name || t("noGroup")}
                              </span>
                            )}
                            {s.email}
                          </span>
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
