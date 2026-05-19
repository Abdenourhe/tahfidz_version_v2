"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Users, 
  GraduationCap,
  AlertCircle
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  fullName: z.string().min(2, "Nom trop court"),
  fullNameAr: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  role: z.literal("STUDENT"),
  groupId: z.string().optional(),
  teacherId: z.string().optional(),
  dateOfBirth: z.string().optional(),
})
type FormInput = z.infer<typeof schema>

interface Group { 
  id: string; 
  name: string; 
  level: string; 
  _count?: { students: number }; 
  maxCapacity?: number; 
  teacher?: { id: string; user: { fullName: string } } 
}
interface Teacher { 
  id: string; 
  user: { fullName: string; gender?: string | null }; 
  specialization?: string | null 
}

export default function NewStudentPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router = useRouter()

  const T = {
    back:         { fr: "Retour",                   en: "Back",                  ar: "رجوع" },
    title:        { fr: "Ajouter un élève",         en: "Add a student",         ar: "إضافة طالب" },
    subtitle:     { fr: "Le code élève sera généré automatiquement",
                    en: "Student code will be generated automatically",
                    ar: "سيتم إنشاء رمز الطالب تلقائياً" },
    personalInfo: { fr: "Informations personnelles", en: "Personal information", ar: "المعلومات الشخصية" },
    fullName:     { fr: "Nom complet *",            en: "Full name *",           ar: "الاسم الكامل *" },
    fullNamePlaceholder: { fr: "Ahmed Benali",      en: "Ahmed Benali",          ar: "أحمد بن علي" },
    fullNameAr:   { fr: "Nom en arabe",             en: "Name in Arabic",        ar: "الاسم بالعربية" },
    fullNameArPlaceholder: { fr: "أحمد بن علي",    en: "أحمد بن علي",           ar: "أحمد بن علي" },
    dob:          { fr: "Date de naissance",        en: "Date of birth",         ar: "تاريخ الميلاد" },
    gender:       { fr: "Genre",                    en: "Gender",                ar: "الجنس" },
    male:         { fr: "Masculin",                 en: "Male",                  ar: "ذكر" },
    female:       { fr: "Féminin",                  en: "Female",                ar: "أنثى" },
    phone:        { fr: "Téléphone",                en: "Phone",                 ar: "الهاتف" },
    phonePlaceholder: { fr: "+1 418-XXX-XXXX",     en: "+1 418-XXX-XXXX",       ar: "+1 418-XXX-XXXX" },
    account:      { fr: "Compte & accès",           en: "Account & access",      ar: "الحساب والوصول" },
    email:        { fr: "Email *",                  en: "Email *",               ar: "البريد *" },
    emailPlaceholder: { fr: "eleve@ecole.com",     en: "student@school.com",    ar: "طالب@مدرسة.com" },
    password:     { fr: "Mot de passe *",           en: "Password *",            ar: "كلمة المرور *" },
    passwordPlaceholder: { fr: "Minimum 6 caractères", en: "Minimum 6 characters", ar: "6 أحرف على الأقل" },
    pedagogy:     { fr: "Affectation pédagogique",   en: "Pedagogical assignment", ar: "التعيين التربوي" },
    group:        { fr: "Groupe",                   en: "Group",                 ar: "المجموعة" },
    noGroup:      { fr: "— Sans groupe —",          en: "— No group —",          ar: "— بدون مجموعة —" },
    level:        { fr: "Niveau",                   en: "Level",                 ar: "المستوى" },
    teacher:      { fr: "Enseignant",               en: "Teacher",               ar: "المعلم" },
    teacherRef:   { fr: "Enseignant référent",      en: "Referent teacher",      ar: "المعلم المرجعي" },
    lockedByGroup:{ fr: "défini par le groupe",     en: "defined by group",      ar: "محدد من قبل المجموعة" },
    noTeacher:    { fr: "— Aucun —",                en: "— None —",              ar: "— لا أحد —" },
    cancel:       { fr: "Annuler",                  en: "Cancel",                ar: "إلغاء" },
    create:       { fr: "Créer l'élève",            en: "Create student",        ar: "إنشاء الطالب" },
    creating:     { fr: "Création…",                en: "Creating…",             ar: "جارٍ الإنشاء…" },
    created:      { fr: "Élève créé avec succès !",  en: "Student created successfully!", ar: "تم إنشاء الطالب بنجاح!" },
    redirecting:  { fr: "Redirection vers la liste…", en: "Redirecting to list…", ar: "جارٍ إعادة التوجيه إلى القائمة…" },
    error:        { fr: "Erreur",                   en: "Error",                 ar: "خطأ" },
    loadingData:  { fr: "Chargement des données…",  en: "Loading data…",         ar: "جارٍ تحميل البيانات…" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<Group | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { role: "STUDENT", gender: "MALE" },
  })

  const watchedGroupId = watch("groupId")

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupsRes, teachersRes] = await Promise.all([
          fetch("/api/groups"),
          fetch("/api/teachers"),
        ])

        if (!groupsRes.ok || !teachersRes.ok) {
          throw new Error(t("error"))
        }

        const [gd, td] = await Promise.all([groupsRes.json(), teachersRes.json()])
        setGroups(gd.groups || [])
        setTeachers(td.teachers || [])
      } catch (err: any) {
        console.error("Erreur chargement données:", err)
        setError(err.message)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const grp = groups.find(g => g.id === watchedGroupId)
    setSelectedGroupInfo(grp || null)
    if (grp?.teacher?.id) {
      setValue("teacherId", grp.teacher.id)
    }
  }, [watchedGroupId, groups, setValue])

  const onSubmit = async (data: FormInput) => {
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const contentType = res.headers.get("content-type")
      let result

      if (contentType?.includes("application/json")) {
        result = await res.json()
      } else {
        const text = await res.text()
        console.error("Réponse non-JSON:", text.substring(0, 500))
        throw new Error(`Erreur serveur ${res.status}: réponse non-JSON`)
      }

      if (!res.ok) {
        throw new Error(result.error || `Erreur ${res.status}`)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/students")
        router.refresh()
      }, 2000)

    } catch (e: any) {
      console.error("Erreur création élève:", e)
      setError(e.message || t("error"))
    }
  }

  const levelLabel: Record<string, string> = { 
    beginner: L === "ar" ? "مبتدئ" : L === "en" ? "Beginner" : "Débutant", 
    intermediate: L === "ar" ? "متوسط" : L === "en" ? "Intermediate" : "Intermédiaire", 
    advanced: L === "ar" ? "متقدم" : L === "en" ? "Advanced" : "Avancé" 
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("created")}</h2>
          <p className="text-gray-500 mt-2">{t("redirecting")}</p>
        </div>
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-tahfidz-green" />
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

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Infos personnelles */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("personalInfo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("fullName")} <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder={t("fullNamePlaceholder")} 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" 
                {...register("fullName")} 
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("fullNameAr")}</label>
              <input 
                type="text" 
                placeholder={t("fullNameArPlaceholder")} 
                dir="rtl" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm arabic" 
                {...register("fullNameAr")} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("dob")}</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" 
                {...register("dateOfBirth")} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("gender")}</label>
              <select 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" 
                {...register("gender")}
              >
                <option value="MALE">{t("male")}</option>
                <option value="FEMALE">{t("female")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("phone")}</label>
            <input 
              type="tel" 
              placeholder={t("phonePlaceholder")} 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
              {...register("phone")}
            />
          </div>
        </div>

        {/* Compte */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("account")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("email")}</label>
              <input type="email" placeholder={t("emailPlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("password")}</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} placeholder={t("passwordPlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm pr-10" {...register("password")} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
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
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" />{t("creating")}</> : t("create")}
          </button>
        </div>
      </form>
    </div>
  )
}
