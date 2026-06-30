"use client"
// src/components/admin/student-form.tsx
// Formulaire unique create + edit

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, Camera,
  AlertCircle, Globe, Languages,
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

const baseSchema = z.object({
  email: z.string().email("Email invalide"),
  fullName: z.string().min(2, "Nom trop court"),
  fullNameAr: z.string().optional(),
  phone: z.string().optional(),
  emergencyPhone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  role: z.literal("STUDENT"),
  groupIds: z.array(z.string()).optional(),
  teacherId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  medicalNotes: z.string().optional(),
  currentSurahNote: z.string().optional(),
  nationality: z.string().optional(),
  spokenLanguages: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

const formSchema = baseSchema.extend({
  password: z.string().min(6, "Minimum 6 caractères").optional().or(z.literal("")),
})

type FormInput = z.infer<typeof formSchema>

interface Group {
  id: string
  name: string
  level: string
  _count?: { students: number }
  maxCapacity?: number
  teacher?: { id: string; user: { fullName: string } }
}
interface Teacher {
  id: string
  user: { fullName: string; gender?: string | null }
  specialization?: string | null
}

export function StudentForm({ mode, studentId }: { mode: "create" | "edit"; studentId?: string }) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router = useRouter()
  const isEdit = mode === "edit"

    const t = useT("studentForm")

  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<Group | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [nationalityCustom, setNationalityCustom] = useState("")
  const [languageCustom, setLanguageCustom] = useState("")

  const languageOptions = [
    { key: "ar", label: L === "ar" ? "العربية" : L === "en" ? "Arabic" : "Arabe" },
    { key: "fr", label: L === "ar" ? "الفرنسية" : L === "en" ? "French" : "Français" },
    { key: "en", label: L === "ar" ? "الإنجليزية" : L === "en" ? "English" : "Anglais" },
    { key: "other", label: L === "ar" ? "أخرى" : L === "en" ? "Other" : "Autre" },
  ]

  const nationalityOptions = useMemo(() => [
    { value: "", label: L === "ar" ? "— اختر —" : L === "en" ? "— Select —" : "— Sélectionner —" },
    { value: "DZ", label: L === "ar" ? "جزائري(ة)" : L === "en" ? "Algerian" : "Algérien(ne)" },
    { value: "MA", label: L === "ar" ? "مغربي(ة)" : L === "en" ? "Moroccan" : "Marocain(e)" },
    { value: "TN", label: L === "ar" ? "تونسي(ة)" : L === "en" ? "Tunisian" : "Tunisien(ne)" },
    { value: "EG", label: L === "ar" ? "مصري(ة)" : L === "en" ? "Egyptian" : "Égyptien(ne)" },
    { value: "SA", label: L === "ar" ? "سعودي(ة)" : L === "en" ? "Saudi" : "Saoudien(ne)" },
    { value: "AE", label: L === "ar" ? "إماراتي(ة)" : L === "en" ? "Emirati" : "Émirien(ne)" },
    { value: "QA", label: L === "ar" ? "قطري(ة)" : L === "en" ? "Qatari" : "Qatari(e)" },
    { value: "KW", label: L === "ar" ? "كويتي(ة)" : L === "en" ? "Kuwaiti" : "Koweïtien(ne)" },
    { value: "LB", label: L === "ar" ? "لبناني(ة)" : L === "en" ? "Lebanese" : "Libanais(e)" },
    { value: "SY", label: L === "ar" ? "سوري(ة)" : L === "en" ? "Syrian" : "Syrien(ne)" },
    { value: "IQ", label: L === "ar" ? "عراقي(ة)" : L === "en" ? "Iraqi" : "Irakien(ne)" },
    { value: "JO", label: L === "ar" ? "أردني(ة)" : L === "en" ? "Jordanian" : "Jordanien(ne)" },
    { value: "PS", label: L === "ar" ? "فلسطيني(ة)" : L === "en" ? "Palestinian" : "Palestinien(ne)" },
    { value: "SD", label: L === "ar" ? "سوداني(ة)" : L === "en" ? "Sudanese" : "Soudanais(e)" },
    { value: "LY", label: L === "ar" ? "ليبي(ة)" : L === "en" ? "Libyan" : "Libyen(ne)" },
    { value: "MR", label: L === "ar" ? "موريتاني(ة)" : L === "en" ? "Mauritanian" : "Mauritanien(ne)" },
    { value: "SO", label: L === "ar" ? "صومالي(ة)" : L === "en" ? "Somali" : "Somalien(ne)" },
    { value: "TR", label: L === "ar" ? "تركي(ة)" : L === "en" ? "Turkish" : "Turc/Turque" },
    { value: "CA", label: L === "ar" ? "كندي(ة)" : L === "en" ? "Canadian" : "Canadien(ne)" },
    { value: "OTHER", label: L === "ar" ? "أخرى" : L === "en" ? "Other" : "Autre" },
  ], [L])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: "STUDENT", gender: "MALE", status: "ACTIVE" },
  })

  const watchedGroupIds = watch("groupIds")

  /* ── Load groups & teachers ── */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupsRes, teachersRes] = await Promise.all([
          fetch("/api/groups"),
          fetch("/api/teachers"),
        ])
        if (!groupsRes.ok || !teachersRes.ok) throw new Error(t("error"))
        const [gd, td] = await Promise.all([groupsRes.json(), teachersRes.json()])
        setGroups(gd.groups || [])
        setTeachers(td.teachers || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [t])

  /* ── Load student in edit mode ── */
  useEffect(() => {
    if (!isEdit || !studentId) return
    const loadStudent = async () => {
      try {
        const res = await fetch(`/api/students/${studentId}`)
        if (!res.ok) throw new Error(t("notFound"))
        const data = await res.json()
        const s = data.student
        if (s) {
          const initialGroupIds = s.studentGroups?.map((sg: any) => sg.groupId) || (s.groupId ? [s.groupId] : [])
          reset({
            email: s.user.email,
            fullName: s.user.fullName,
            fullNameAr: s.user.fullNameAr || "",
            phone: s.user.phone || "",
            emergencyPhone: s.emergencyPhone || "",
            gender: (s.user.gender as any) || "MALE",
            role: "STUDENT",
            groupIds: initialGroupIds,
            teacherId: s.teacherId || "",
            dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
            address: s.address || "",
            city: s.city || "",
            postalCode: s.postalCode || "",
            medicalNotes: s.medicalNotes || "",
            currentSurahNote: s.currentSurahNote || "",
            nationality: nationalityOptions.some(o => o.value === s.nationality) ? s.nationality : (s.nationality ? "OTHER" : ""),
            spokenLanguages: s.spokenLanguages || "",
            status: s.user.isActive ? "ACTIVE" : "INACTIVE",
          })
          setSelectedGroupIds(initialGroupIds)
          if (s.nationality && !nationalityOptions.some(o => o.value === s.nationality)) {
            setNationalityCustom(s.nationality)
          }
          setValue("password", "")
          if (s.user.avatar) setPhotoPreview(s.user.avatar)
        }
      } catch (err: any) {
        setError(err.message)
      }
    }
    loadStudent()
  }, [isEdit, studentId, reset, t, nationalityOptions, setValue])

  /* ── Auto-assign teacher from primary group ── */
  useEffect(() => {
    const ids = watchedGroupIds || selectedGroupIds || []
    const primaryId = ids[0]
    const grp = primaryId ? groups.find(g => g.id === primaryId) : null
    setSelectedGroupInfo(grp || null)
    if (grp?.teacher?.id) {
      setValue("teacherId", grp.teacher.id)
    }
  }, [watchedGroupIds, selectedGroupIds, groups, setValue])

  const levelLabel: Record<string, string> = {
    beginner:     L === "ar" ? "مبتدئ"  : L === "en" ? "Beginner"     : "Débutant",
    intermediate: L === "ar" ? "متوسط"  : L === "en" ? "Intermediate" : "Intermédiaire",
    advanced:     L === "ar" ? "متقدم"  : L === "en" ? "Advanced"     : "Avancé",
  }

  const onSubmit = async (data: FormInput) => {
    setError(null)
    setSuccess(false)
    try {
      const payload: any = { ...data }
      // Envoyer le tableau de groupes sélectionnés ; groupId n'est plus utilisé
      payload.groupIds = selectedGroupIds
      delete payload.groupId
      if (payload.nationality === "OTHER") payload.nationality = nationalityCustom || "OTHER"
      const langs = (payload.spokenLanguages || "").split(",").map((s: string) => s.trim()).filter(Boolean)
      if (langs.includes("other") && languageCustom) {
        payload.spokenLanguages = langs.filter((k: string) => k !== "other").concat(languageCustom).join(",")
      }
      if (photoPreview) {
        payload.photo = photoPreview
        if (isEdit) {
          payload.avatar = photoPreview
          delete payload.photo
        }
      }
      if (isEdit && !payload.password) delete payload.password
      const url = isEdit ? `/api/students/${studentId}` : "/api/students"
      const method = isEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json().catch(() => ({ error: "Erreur serveur" }))
      if (!res.ok) throw new Error(result.error || `Erreur ${res.status}`)
      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/students")
        router.refresh()
      }, 1500)
    } catch (e: any) {
      setError(e.message || t("error"))
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  if (loadingData && !isEdit) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-tahfidz-green" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {isEdit ? t("successEdit") : t("successCreate")}
          </h2>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? t("titleEdit") : t("titleCreate")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? t("subtitleEdit") : t("subtitleCreate")}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Photo */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t("uploadPhoto")}</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-gray-300" />
              )}
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm text-gray-500" />
          </div>
          <p className="text-xs text-gray-400 mt-1">{t("uploadHint")}</p>
        </div>

        {/* Infos personnelles */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("personalInfo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("fullName")}</label>
              <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("fullName")} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("fullNameAr")}</label>
              <input type="text" dir="rtl" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm arabic" {...register("fullNameAr")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("dob")}</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("dateOfBirth")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("gender")}</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("gender")}>
                <option value="MALE">{t("male")}</option>
                <option value="FEMALE">{t("female")}</option>
              </select>
            </div>
          </div>

          {/* Nationalité & Langues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Globe size={14} /> {t("nationality") || "Nationalité"}
              </label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("nationality")}>
                {nationalityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {watch("nationality") === "OTHER" && (
                <input
                  type="text"
                  value={nationalityCustom}
                  onChange={(e) => setNationalityCustom(e.target.value)}
                  placeholder={L === "ar" ? "أدخل الجنسية" : L === "en" ? "Enter nationality" : "Précisez la nationalité"}
                  className="w-full mt-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Languages size={14} /> {t("spokenLanguages") || "Langues parlées"}
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {languageOptions.map(lang => {
                  const current = (watch("spokenLanguages") || "").split(",").map(s => s.trim()).filter(Boolean)
                  const checked = current.includes(lang.key)
                  return (
                    <label key={lang.key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border cursor-pointer transition ${checked ? "bg-tahfidz-green/10 border-tahfidz-green text-tahfidz-green-dark" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...current, lang.key]
                            : current.filter(k => k !== lang.key)
                          setValue("spokenLanguages", next.join(","), { shouldDirty: true })
                        }}
                      />
                      {lang.label}
                    </label>
                  )
                })}
              </div>
              {(watch("spokenLanguages") || "").split(",").map(s => s.trim()).includes("other") && (
                <input
                  type="text"
                  value={languageCustom}
                  onChange={(e) => setLanguageCustom(e.target.value)}
                  placeholder={L === "ar" ? "أدخل اللغة" : L === "en" ? "Enter language" : "Précisez la langue"}
                  className="w-full mt-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("phone")}</label>
              <input type="tel" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("emergencyPhone") || "Téléphone d'urgence"}</label>
              <input type="tel" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("emergencyPhone")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("address")}</label>
            <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("address")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("city")}</label>
              <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("city")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("postalCode")}</label>
              <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("postalCode")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("medicalNotes")}</label>
            <textarea rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("medicalNotes")} />
            <p className="text-xs text-gray-400 mt-1">{t("medicalHint")}</p>
          </div>
        </div>

        {/* Compte */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("account")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("email")}</label>
              <input type="email" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("password")} {isEdit && <span className="text-gray-400 font-normal">(laisser vide pour ne pas changer)</span>}</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm pr-10" {...register("password")} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("status")}</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("status")}>
              <option value="ACTIVE">{t("active")}</option>
              <option value="INACTIVE">{t("inactive")}</option>
            </select>
          </div>
        </div>

        {/* Pédagogie */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("pedagogy")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("groups") || "Groupes"}</label>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
                {groups.length === 0 && (
                  <p className="text-sm text-gray-400">{t("noGroupAvailable") || "Aucun groupe disponible"}</p>
                )}
                {groups.map(g => {
                  const checked = selectedGroupIds.includes(g.id)
                  const isPrimary = selectedGroupIds[0] === g.id
                  return (
                    <label key={g.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border cursor-pointer transition ${checked ? "bg-tahfidz-green/10 border-tahfidz-green" : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedGroupIds, g.id]
                              : selectedGroupIds.filter(id => id !== g.id)
                            // Le premier élément reste le groupe principal ; s'il est décoché, on retire
                            const reordered = next.includes(g.id) && e.target.checked
                              ? next
                              : next
                            setSelectedGroupIds(reordered)
                            setValue("groupIds", reordered, { shouldDirty: true })
                          }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{levelLabel[g.level] ?? g.level}</span>
                        {isPrimary && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-tahfidz-green text-white">{t("primary") || "principal"}</span>}
                      </div>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{t("groupsHint") || "Le premier groupe coché est le groupe principal."}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("teacherRef")}</label>
              {selectedGroupInfo?.teacher ? (
                <p className="px-4 py-2.5 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {selectedGroupInfo.teacher.user.fullName} <span className="text-xs text-gray-400">({t("lockedByGroup")})</span>
                </p>
              ) : (
                <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("teacherId")}>
                  <option value="">{t("noTeacher")}</option>
                  {teachers.map(tc => (
                    <option key={tc.id} value={tc.id}>{tc.user.fullName}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("currentSurahNote") || "Sourah en cours / Note de mémorisation"}</label>
            <input
              type="text"
              placeholder={L === "ar" ? "مثال: البقرة - الآية 45" : L === "en" ? "Ex: Al-Baqarah - verse 45" : "Ex: Al-Baqarah - verset 45"}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
              {...register("currentSurahNote")}
            />
            <p className="text-xs text-gray-400 mt-1">{t("currentSurahHint") || "Indiquez la sourah et le verset que l'élève récite actuellement"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            {t("cancel")}
          </button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-tahfidz-green-dark disabled:opacity-50 transition flex items-center gap-2">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" />{isEdit ? t("saving") : t("creating")}</> : isEdit ? t("save") : t("create")}
          </button>
        </div>
      </form>
    </div>
  )
}
