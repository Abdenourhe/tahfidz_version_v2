"use client"
// src/components/admin/student-form.tsx
// Formulaire unique create + edit

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, Camera,
  AlertCircle,
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

const baseSchema = z.object({
  email: z.string().email("Email invalide"),
  fullName: z.string().min(2, "Nom trop court"),
  fullNameAr: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  role: z.literal("STUDENT"),
  groupId: z.string().optional(),
  teacherId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  medicalNotes: z.string().optional(),
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

  const T = {
    back:          { fr: "Retour",                              en: "Back",                           ar: "رجوع" },
    titleCreate:   { fr: "Ajouter un élève",                   en: "Add a student",                  ar: "إضافة طالب" },
    titleEdit:     { fr: "Modifier les coordonnées",           en: "Edit student details",           ar: "تعديل بيانات الطالب" },
    subtitleCreate:{ fr: "Le code élève sera généré automatiquement", en: "Student code will be auto-generated", ar: "سيتم إنشاء رمز الطالب تلقائياً" },
    subtitleEdit:  { fr: "Mettre à jour les informations de l'élève", en: "Update student information", ar: "تحديث معلومات الطالب" },
    personalInfo:  { fr: "Informations personnelles",          en: "Personal information",           ar: "المعلومات الشخصية" },
    fullName:      { fr: "Nom complet",                        en: "Full name",                      ar: "الاسم الكامل" },
    fullNameAr:    { fr: "Nom en arabe",                       en: "Name in Arabic",                 ar: "الاسم بالعربية" },
    dob:           { fr: "Date de naissance",                  en: "Date of birth",                  ar: "تاريخ الميلاد" },
    gender:        { fr: "Genre",                              en: "Gender",                         ar: "الجنس" },
    male:          { fr: "Masculin",                           en: "Male",                           ar: "ذكر" },
    female:        { fr: "Féminin",                            en: "Female",                         ar: "أنثى" },
    phone:         { fr: "Téléphone",                          en: "Phone",                          ar: "الهاتف" },
    emergencyPhone:{ fr: "Numéro d'urgence",                   en: "Emergency phone",                ar: "هاتف الطوارئ" },
    emergencyHint: { fr: "Numéro d'un parent ou tuteur en cas d'urgence", en: "Parent or guardian phone in case of emergency", ar: "رقم ولي أو وصي في حالة الطوارئ" },
    address:       { fr: "Adresse",                            en: "Address",                        ar: "العنوان" },
    city:          { fr: "Ville",                              en: "City",                           ar: "المدينة" },
    postalCode:    { fr: "Code postal",                        en: "Postal code",                    ar: "الرمز البريدي" },
    medicalNotes:  { fr: "Notes médicales / Allergies",        en: "Medical notes / Allergies",      ar: "ملاحظات طبية / حساسية" },
    medicalHint:   { fr: "Informations importantes en cas d'urgence", en: "Important info in case of emergency", ar: "معلومات مهمة في حالة الطوارئ" },
    uploadPhoto:   { fr: "Photo de l'élève",                   en: "Student photo",                  ar: "صورة الطالب" },
    uploadHint:    { fr: "Cliquez pour télécharger ou prendre une photo", en: "Click to upload or take a photo", ar: "انقر لتحميل أو التقاط صورة" },
    account:       { fr: "Compte & accès",                     en: "Account & access",               ar: "الحساب والوصول" },
    email:         { fr: "Email",                              en: "Email",                          ar: "البريد" },
    password:      { fr: "Mot de passe",                       en: "Password",                       ar: "كلمة المرور" },
    passwordHint:  { fr: "Minimum 6 caractères",               en: "Minimum 6 characters",           ar: "6 أحرف على الأقل" },
    status:        { fr: "Statut",                             en: "Status",                         ar: "الحالة" },
    active:        { fr: "Actif",                              en: "Active",                         ar: "نشط" },
    inactive:      { fr: "Inactif",                            en: "Inactive",                       ar: "غير نشط" },
    pedagogy:      { fr: "Affectation pédagogique",            en: "Pedagogical assignment",         ar: "التعيين التربوي" },
    group:         { fr: "Groupe",                             en: "Group",                          ar: "المجموعة" },
    noGroup:       { fr: "— Sans groupe —",                    en: "— No group —",                   ar: "— بدون مجموعة —" },
    teacherRef:    { fr: "Enseignant référent",                en: "Referent teacher",               ar: "المعلم المرجعي" },
    lockedByGroup: { fr: "défini par le groupe",               en: "defined by group",               ar: "محدد من قبل المجموعة" },
    noTeacher:     { fr: "— Aucun —",                          en: "— None —",                       ar: "— لا أحد —" },
    cancel:        { fr: "Annuler",                            en: "Cancel",                         ar: "إلغاء" },
    create:        { fr: "Créer l'élève",                      en: "Create student",                 ar: "إنشاء الطالب" },
    creating:      { fr: "Création…",                          en: "Creating…",                      ar: "جارٍ الإنشاء…" },
    save:          { fr: "Enregistrer les modifications",      en: "Save changes",                   ar: "حفظ التغييرات" },
    saving:        { fr: "Enregistrement…",                    en: "Saving…",                        ar: "جارٍ الحفظ…" },
    successCreate: { fr: "Élève créé avec succès !",           en: "Student created successfully!",  ar: "تم إنشاء الطالب بنجاح!" },
    successEdit:   { fr: "Modifications enregistrées !",       en: "Changes saved!",                 ar: "تم حفظ التغييرات!" },
    redirecting:   { fr: "Redirection…",                       en: "Redirecting…",                   ar: "جارٍ إعادة التوجيه…" },
    loading:       { fr: "Chargement…",                        en: "Loading…",                       ar: "جارٍ التحميل…" },
    error:         { fr: "Erreur",                             en: "Error",                          ar: "خطأ" },
    notFound:      { fr: "Élève introuvable",                  en: "Student not found",              ar: "الطالب غير موجود" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<Group | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: "STUDENT", gender: "MALE", status: "ACTIVE" },
  })

  const watchedGroupId = watch("groupId")

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
  }, [])

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
          reset({
            email: s.user.email,
            fullName: s.user.fullName,
            fullNameAr: s.user.fullNameAr || "",
            phone: s.user.phone || "",
            gender: (s.user.gender as any) || "MALE",
            role: "STUDENT",
            groupId: s.groupId || "",
            teacherId: s.teacherId || "",
            dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
            address: s.address || "",
            city: s.city || "",
            postalCode: s.postalCode || "",
            medicalNotes: s.medicalNotes || "",
            status: s.user.isActive ? "ACTIVE" : "INACTIVE",
            password: "",
          })
          if (s.user.avatar) setPhotoPreview(s.user.avatar)
        }
      } catch (err: any) {
        setError(err.message)
      }
    }
    loadStudent()
  }, [isEdit, studentId, reset])

  /* ── Auto-assign teacher from group ── */
  useEffect(() => {
    const grp = groups.find(g => g.id === watchedGroupId)
    setSelectedGroupInfo(grp || null)
    if (grp?.teacher?.id) {
      setValue("teacherId", grp.teacher.id)
    }
  }, [watchedGroupId, groups, setValue])

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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("phone")}</label>
            <input type="tel" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("phone")} />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("group")}</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("groupId")}>
                <option value="">{t("noGroup")}</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} — {levelLabel[g.level] ?? g.level}</option>
                ))}
              </select>
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
