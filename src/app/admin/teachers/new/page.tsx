"use client"
// src/app/admin/teachers/new/page.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createUserSchema, type CreateUserInput } from "@/lib/validations/auth"
import { Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function NewTeacherPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router = useRouter()

  const T = {
    back:         { fr: "Retour",                   en: "Back",                  ar: "رجوع" },
    title:        { fr: "Ajouter un enseignant",    en: "Add a teacher",         ar: "إضافة معلم" },
    subtitle:     { fr: "Créer un compte enseignant", en: "Create a teacher account", ar: "إنشاء حساب معلم" },
    identity:     { fr: "Identité",                 en: "Identity",              ar: "الهوية" },
    fullName:     { fr: "Nom complet *",            en: "Full name *",           ar: "الاسم الكامل *" },
    fullNamePlaceholder: { fr: "Sheikh Ahmed",      en: "Sheikh Ahmed",          ar: "الشيخ أحمد" },
    fullNameAr:   { fr: "Nom en arabe",             en: "Name in Arabic",        ar: "الاسم بالعربية" },
    fullNameArPlaceholder: { fr: "الشيخ أحمد",     en: "الشيخ أحمد",            ar: "الشيخ أحمد" },
    gender:       { fr: "Genre",                    en: "Gender",                ar: "الجنس" },
    choose:       { fr: "— Choisir —",              en: "— Choose —",            ar: "— اختر —" },
    male:         { fr: "Masculin",                 en: "Male",                  ar: "ذكر" },
    female:       { fr: "Féminin",                  en: "Female",                ar: "أنثى" },
    phone:        { fr: "Téléphone",                en: "Phone",                 ar: "الهاتف" },
    phonePlaceholder: { fr: "+212 6XX XXX XXX",    en: "+212 6XX XXX XXX",      ar: "+212 6XX XXX XXX" },
    profile:      { fr: "Profil pédagogique",       en: "Teaching profile",      ar: "الملف التربوي" },
    specialization:{ fr: "Spécialisation",          en: "Specialization",        ar: "التخصص" },
    specPlaceholder:{ fr: "ex: Tajweed et mémorisation enfants", en: "e.g. Tajweed and children memorization", ar: "مثال: التجويد وحفظ الأطفال" },
    maxCapacity:  { fr: "Capacité maximale d'élèves", en: "Max student capacity", ar: "الطاقة القصوى للطلاب" },
    maxCapacityDesc:{ fr: "Nombre maximum d'élèves que cet enseignant peut gérer", en: "Maximum number of students this teacher can manage", ar: "الحد الأقصى لعدد الطلاب الذي يمكن لهذا المعلم إدارته" },
    account:      { fr: "Accès au compte",          en: "Account access",        ar: "الوصول إلى الحساب" },
    email:        { fr: "Email *",                  en: "Email *",               ar: "البريد *" },
    emailPlaceholder: { fr: "enseignant@example.com", en: "teacher@example.com", ar: "معلم@example.com" },
    password:     { fr: "Mot de passe *",           en: "Password *",            ar: "كلمة المرور *" },
    passwordPlaceholder: { fr: "Minimum 8 caractères", en: "Minimum 8 characters", ar: "8 أحرف على الأقل" },
    cancel:       { fr: "Annuler",                  en: "Cancel",                ar: "إلغاء" },
    create:       { fr: "Créer l'enseignant",       en: "Create teacher",        ar: "إنشاء المعلم" },
    creating:     { fr: "Création…",                en: "Creating…",             ar: "جارٍ الإنشاء…" },
    created:      { fr: "Enseignant créé !",        en: "Teacher created!",      ar: "تم إنشاء المعلم!" },
    redirecting:  { fr: "Redirection…",             en: "Redirecting…",          ar: "جارٍ إعادة التوجيه…" },
    error:        { fr: "Erreur",                   en: "Error",                 ar: "خطأ" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<
    CreateUserInput & { specialization?: string; maxStudents?: number }
  >({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "TEACHER", maxStudents: 20 },
  })

  const onSubmit = async (data: CreateUserInput & { specialization?: string; maxStudents?: number }) => {
    setError(null)
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.formErrors?.[0] || t("error"))
      }
      setSuccess(true)
      setTimeout(() => router.push("/admin/teachers"), 2000)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Identité */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("identity")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("fullName")}</label>
              <input type="text" placeholder={t("fullNamePlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("fullName")} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("fullNameAr")}</label>
              <input type="text" placeholder={t("fullNameArPlaceholder")} dir="rtl" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm arabic" {...register("fullNameAr")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("gender")}</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("gender")}>
                <option value="">{t("choose")}</option>
                <option value="MALE">{t("male")}</option>
                <option value="FEMALE">{t("female")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("phone")}</label>
              <input type="tel" placeholder={t("phonePlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("phone")} />
            </div>
          </div>
        </div>

        {/* Profil */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("profile")}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("specialization")}</label>
            <input type="text" placeholder={t("specPlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("specialization" as any)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("maxCapacity")}</label>
            <p className="text-xs text-gray-400 mb-1.5">{t("maxCapacityDesc")}</p>
            <input type="number" min={1} max={200} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("maxStudents" as any, { valueAsNumber: true })} />
          </div>
        </div>

        {/* Compte */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("account")}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("email")}</label>
            <input type="email" placeholder={t("emailPlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("password")}</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder={t("passwordPlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm pr-10" {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
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
