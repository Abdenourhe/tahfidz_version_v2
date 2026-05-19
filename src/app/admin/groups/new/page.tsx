"use client"
// src/app/admin/groups/new/page.tsx

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createGroupSchema } from "@/lib/validations/auth"
import { z } from "zod"
import { Loader2, ArrowLeft, CheckCircle2, Plus, X } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

type CreateGroupInput = z.input<typeof createGroupSchema>

interface Teacher { id: string; user: { fullName: string } }

export default function NewGroupPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router = useRouter()

  const T = {
    back:         { fr: "Retour",                   en: "Back",                  ar: "رجوع" },
    title:        { fr: "Créer un groupe",          en: "Create a group",        ar: "إنشاء مجموعة" },
    subtitle:     { fr: "Configurer un nouveau groupe de mémorisation",
                    en: "Configure a new memorization group",
                    ar: "إعداد مجموعة حفظ جديدة" },
    info:         { fr: "Informations du groupe",   en: "Group information",     ar: "معلومات المجموعة" },
    name:         { fr: "Nom du groupe *",          en: "Group name *",          ar: "اسم المجموعة *" },
    namePlaceholder:{ fr: "Groupe Avancé A",       en: "Advanced Group A",      ar: "المجموعة المتقدمة أ" },
    nameAr:       { fr: "Nom en arabe",             en: "Name in Arabic",        ar: "الاسم بالعربية" },
    nameArPlaceholder:{ fr: "المجموعة أ",          en: "المجموعة أ",            ar: "المجموعة أ" },
    level:        { fr: "Niveau *",                 en: "Level *",               ar: "المستوى *" },
    beginner:     { fr: "Débutant",                 en: "Beginner",              ar: "مبتدئ" },
    intermediate: { fr: "Intermédiaire",            en: "Intermediate",          ar: "متوسط" },
    advanced:     { fr: "Avancé",                   en: "Advanced",              ar: "متقدم" },
    maxCapacity:  { fr: "Capacité maximale *",      en: "Max capacity *",        ar: "الطاقة القصوى *" },
    teacher:      { fr: "Enseignant responsable *",  en: "Responsible teacher *", ar: "المعلم المسؤول *" },
    selectTeacher:{ fr: "— Sélectionner un enseignant —", en: "— Select a teacher —", ar: "— اختر معلماً —" },
    teacherPlaceholder:{ fr: "Choisir un enseignant", en: "Choose a teacher", ar: "اختر معلماً" },
    schedule:     { fr: "Horaires des sessions",    en: "Session schedules",     ar: "جداول الجلسات" },
    scheduleDesc: { fr: "Ajoutez les jours et horaires de ce groupe", en: "Add the days and times for this group", ar: "أضف أيام وأوقات هذه المجموعة" },
    day:          { fr: "Jour",                     en: "Day",                   ar: "اليوم" },
    selectDay:    { fr: "Jour",                     en: "Day",                   ar: "اليوم" },
    time:         { fr: "Heure",                    en: "Time",                  ar: "الوقت" },
    cancel:       { fr: "Annuler",                  en: "Cancel",                ar: "إلغاء" },
    create:       { fr: "Créer le groupe",          en: "Create group",          ar: "إنشاء المجموعة" },
    creating:     { fr: "Création…",                en: "Creating…",             ar: "جارٍ الإنشاء…" },
    created:      { fr: "Groupe créé !",            en: "Group created!",        ar: "تم إنشاء المجموعة!" },
    error:        { fr: "Erreur",                   en: "Error",                 ar: "خطأ" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const DAYS = [
    { key: "monday",    label: L === "ar" ? "الإثنين" : L === "en" ? "Monday" : "Lundi" },
    { key: "tuesday",   label: L === "ar" ? "الثلاثاء" : L === "en" ? "Tuesday" : "Mardi" },
    { key: "wednesday", label: L === "ar" ? "الأربعاء" : L === "en" ? "Wednesday" : "Mercredi" },
    { key: "thursday",  label: L === "ar" ? "الخميس" : L === "en" ? "Thursday" : "Jeudi" },
    { key: "friday",    label: L === "ar" ? "الجمعة" : L === "en" ? "Friday" : "Vendredi" },
    { key: "saturday",  label: L === "ar" ? "السبت" : L === "en" ? "Saturday" : "Samedi" },
    { key: "sunday",    label: L === "ar" ? "الأحد" : L === "en" ? "Sunday" : "Dimanche" },
  ]

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [schedule, setSchedule] = useState<Record<string, string>>({})
  const [selectedDay, setSelectedDay] = useState("")
  const [selectedTime, setSelectedTime] = useState("")

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { level: "beginner", maxCapacity: 15 },
  })

  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(data => setTeachers(data.teachers || []))
  }, [])

  const addSchedule = () => {
    if (!selectedDay || !selectedTime) return
    setSchedule(prev => ({ ...prev, [selectedDay]: selectedTime }))
    setSelectedDay("")
    setSelectedTime("")
  }

  const removeSchedule = (day: string) => {
    setSchedule(prev => { const n = { ...prev }; delete n[day]; return n })
  }

  const onSubmit = async (data: CreateGroupInput) => {
    setError(null)
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, schedule }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.formErrors?.[0] || t("error"))
      }
      setSuccess(true)
      setTimeout(() => router.push("/admin/groups"), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"))
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("created")}</h2>
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

      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Informations du groupe */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("info")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("name")}</label>
              <input type="text" placeholder={t("namePlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("nameAr")}</label>
              <input type="text" placeholder={t("nameArPlaceholder")} dir="rtl" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm arabic" {...register("nameAr")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("level")}</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("level")}>
                <option value="beginner">{t("beginner")}</option>
                <option value="intermediate">{t("intermediate")}</option>
                <option value="advanced">{t("advanced")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("maxCapacity")}</label>
              <input type="number" min={1} max={50} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("maxCapacity", { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("teacher")}</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("teacherId")}>
              <option value="">{t("teacherPlaceholder")}</option>
              {teachers.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.user.fullName}</option>
              ))}
            </select>
            {errors.teacherId && <p className="mt-1 text-xs text-red-500">{errors.teacherId.message}</p>}
          </div>
        </div>

        {/* Horaires */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("schedule")}</h2>
          <div className="flex gap-2">
            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white">
              <option value="">{t("selectDay")}</option>
              {DAYS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm" />
            <button type="button" onClick={addSchedule}
              className="px-3 py-2 bg-tahfidz-green text-white rounded-lg hover:bg-tahfidz-green-dark transition">
              <Plus size={16} />
            </button>
          </div>
          {Object.entries(schedule).map(([day, time]) => (
            <div key={day} className="flex items-center justify-between px-3 py-2 bg-tahfidz-green-light rounded-lg">
              <span className="text-sm text-tahfidz-green font-medium">{DAYS.find(d => d.key === day)?.label} — {time}</span>
              <button type="button" onClick={() => removeSchedule(day)} className="text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            {t("cancel")}
          </button>
          <button type="submit" disabled={isSubmitting}
            className="px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-tahfidz-green-dark disabled:opacity-50 transition flex items-center gap-2">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" />{t("creating")}</> : t("create")}
          </button>
        </div>
      </form>
    </div>
  )
}
