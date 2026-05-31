"use client"
// src/components/parent/ParentRegisterForm.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle, School, User, Mail, Phone, Lock, Globe, Languages } from "lucide-react"

interface InviteData {
  valid: boolean
  error?: string
  studentName?: string
  studentNameAr?: string | null
  schoolName?: string
  schoolNameAr?: string | null
}

interface Props {
  inviteCode: string
  studentCode: string
  inviteData: InviteData
}

const TEXTS: Record<string, Record<string, string>> = {
  title:         { fr: "Inscription parent", en: "Parent registration", ar: "تسجيل ولي الأمر" },
  subtitle:      { fr: "Rejoignez TAHFIDZ et suivez la progression de votre enfant", en: "Join TAHFIDZ and track your child's progress", ar: "انضم إلى TAHFIDZ وتابع تقدم طفلك" },
  linkedTo:      { fr: "Vous serez lié à", en: "You will be linked to", ar: "سيتم ربطك بـ" },
  school:        { fr: "École", en: "School", ar: "المدرسة" },
  fullName:      { fr: "Nom complet *", en: "Full name *", ar: "الاسم الكامل *" },
  fullNameAr:    { fr: "Nom en arabe", en: "Name in Arabic", ar: "الاسم بالعربية" },
  gender:        { fr: "Genre *", en: "Gender *", ar: "الجنس *" },
  male:          { fr: "Homme", en: "Male", ar: "ذكر" },
  female:        { fr: "Femme", en: "Female", ar: "أنثى" },
  relation:      { fr: "Relation avec l'enfant *", en: "Relation to child *", ar: "العلاقة بالطفل *" },
  mother:        { fr: "Maman", en: "Mother", ar: "أم" },
  father:        { fr: "Papa", en: "Father", ar: "أب" },
  tutor:         { fr: "Tuteur", en: "Guardian", ar: "ولي أمر" },
  brother:       { fr: "Frère", en: "Brother", ar: "أخ" },
  sister:        { fr: "Sœur", en: "Sister", ar: "أخت" },
  uncle:         { fr: "Oncle", en: "Uncle", ar: "عم/خال" },
  aunt:          { fr: "Tante", en: "Aunt", ar: "عمة/خالة" },
  grandfather:   { fr: "Grand-père", en: "Grandfather", ar: "جد" },
  grandmother:   { fr: "Grand-mère", en: "Grandmother", ar: "جدة" },
  other:         { fr: "Autre", en: "Other", ar: "آخر" },
  email:         { fr: "Email *", en: "Email *", ar: "البريد الإلكتروني *" },
  phone:         { fr: "Téléphone", en: "Phone", ar: "الهاتف" },
  password:      { fr: "Mot de passe *", en: "Password *", ar: "كلمة المرور *" },
  confirmPassword: { fr: "Confirmer le mot de passe *", en: "Confirm password *", ar: "تأكيد كلمة المرور *" },
  studentCode:   { fr: "Code élève", en: "Student code", ar: "رمز الطالب" },
  register:      { fr: "S'inscrire", en: "Register", ar: "التسجيل" },
  registering:   { fr: "Inscription…", en: "Registering…", ar: "جارٍ التسجيل…" },
  successTitle:  { fr: "Inscription réussie !", en: "Registration successful!", ar: "تم التسجيل بنجاح!" },
  successMsg:    { fr: "Redirection vers votre tableau de bord…", en: "Redirecting to your dashboard…", ar: "جارٍ إعادة التوجيه إلى لوحة التحكم…" },
  linkedSuccess: { fr: "Lien ajouté ! Connectez-vous pour accéder à votre compte.", en: "Link added! Log in to access your account.", ar: "تمت إضافة الرابط! سجل الدخول للوصول إلى حسابك." },
  goToLogin:     { fr: "Aller à la connexion", en: "Go to login", ar: "الذهاب إلى تسجيل الدخول" },
  nationality:   { fr: "Nationalité de l'enfant", en: "Child's nationality", ar: "جنسية الطفل" },
  spokenLanguages: { fr: "Langues parlées par l'enfant", en: "Child's spoken languages", ar: "اللغات المحكية من قبل الطفل" },
  nationalityOther: { fr: "Précisez la nationalité", en: "Specify nationality", ar: "حدد الجنسية" },
  languageOther: { fr: "Précisez la langue", en: "Specify language", ar: "حدد اللغة" },
}

const ERROR_TEXTS: Record<string, Record<string, string>> = {
  invalid:       { fr: "Lien d'invitation invalide.", en: "Invalid invitation link.", ar: "رابط الدعوة غير صالح." },
  used:          { fr: "Cette invitation a déjà été utilisée.", en: "This invitation has already been used.", ar: "تم استخدام هذه الدعوة بالفعل." },
  expired:       { fr: "Cette invitation a expiré.", en: "This invitation has expired.", ar: "انتهت صلاحية هذه الدعوة." },
  mismatch:      { fr: "Le code élève ne correspond pas.", en: "Student code does not match.", ar: "رمز الطالب غير متطابق." },
  missing:       { fr: "Lien incomplet. Veuillez scanner le QR code à nouveau.", en: "Incomplete link. Please scan the QR code again.", ar: "الرابط غير مكتمل. يرجى مسح رمز الاستجابة السريعة مرة أخرى." },
  passwordMatch: { fr: "Les mots de passe ne correspondent pas.", en: "Passwords do not match.", ar: "كلمات المرور غير متطابقة." },
  passwordMin:   { fr: "Le mot de passe doit contenir au moins 6 caractères.", en: "Password must be at least 6 characters.", ar: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." },
}

function tx(key: string, locale: string = "fr"): string {
  return TEXTS[key]?.[locale] || TEXTS[key]?.fr || key
}

function err(key: string, locale: string = "fr"): string {
  return ERROR_TEXTS[key]?.[locale] || ERROR_TEXTS[key]?.fr || key
}

export function ParentRegisterForm({ inviteCode, studentCode, inviteData }: Props) {
  const { locale } = useLanguage()
  const L = (locale || "fr") as "fr" | "en" | "ar"
  const router = useRouter()
  const isRtl = L === "ar"

  const [form, setForm] = useState({
    fullName: "",
    fullNameAr: "",
    email: "",
    phone: "",
    gender: "",
    relation: "",
    password: "",
    confirmPassword: "",
    nationality: "",
    nationalityCustom: "",
    spokenLanguages: "",
    languageCustom: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isExistingParent, setIsExistingParent] = useState(false)

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password.length < 6) {
      setError(err("passwordMin", L))
      return
    }
    if (form.password !== form.confirmPassword) {
      setError(err("passwordMatch", L))
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/parent-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          fullNameAr: form.fullNameAr,
          email: form.email,
          phone: form.phone,
          gender: form.gender,
          relation: form.relation,
          password: form.password,
          inviteCode,
          studentCode,
          nationality: form.nationality === "OTHER" ? (form.nationalityCustom || "OTHER") : form.nationality,
          spokenLanguages: form.spokenLanguages.split(",").map((s: string) => s.trim()).filter((k: string) => k !== "other").concat(form.languageCustom || "").filter(Boolean).join(","),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Erreur")
      }

      // Si parent déjà existant → rediriger vers login (pas d'auto-login possible)
      if (data.existingParent) {
        setIsExistingParent(true)
        setSuccess(true)
        setTimeout(() => {
          window.location.href = `/login?linked=true&email=${encodeURIComponent(form.email.toLowerCase())}&schoolSlug=${encodeURIComponent(data.schoolSlug || "")}`
        }, 1500)
        return
      }

      // Auto-login après inscription (nouveau parent)
      // On utilise redirect:true pour forcer une vraie navigation POST via NextAuth callback,
      // ce qui garantit que le cookie de session est bien posé par le navigateur.
      try {
        await signIn("credentials", {
          email: form.email.toLowerCase(),
          password: form.password,
          schoolSlug: data.schoolSlug || "",
          redirect: true,
          callbackUrl: "/parent/dashboard",
        })
      } catch {
        // Si signIn échoue (ex: credentials invalides), rediriger vers login
        window.location.href = `/login?registered=true&email=${encodeURIComponent(form.email.toLowerCase())}&schoolSlug=${encodeURIComponent(data.schoolSlug || "")}`
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  // Invitation invalide → page d'erreur
  if (!inviteData.valid) {
    const errorKey = inviteData.error || "invalid"
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir={isRtl ? "rtl" : "ltr"}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{tx("title", L)}</h1>
          <p className="text-red-600 dark:text-red-400">{err(errorKey, L)}</p>
        </div>
      </div>
    )
  }

  // Succès → message de confirmation
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir={isRtl ? "rtl" : "ltr"}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 max-w-md w-full text-center">
          <CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isExistingParent ? tx("linkedSuccess", L) : tx("successTitle", L)}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isExistingParent ? tx("goToLogin", L) : tx("successMsg", L)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-3">
            <School size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tx("title", L)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tx("subtitle", L)}</p>
        </div>

        {/* Carte élève lié */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 mb-6">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider mb-1">{tx("linkedTo", L)}</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
              <User size={18} className="text-emerald-600 dark:text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{inviteData.studentName}</p>
              {inviteData.studentNameAr && <p className="arabic text-xs text-gray-400 truncate">{inviteData.studentNameAr}</p>}
              <p className="text-xs text-gray-400">{tx("school", L)} : {inviteData.schoolName}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Infos complémentaires élève */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L === "ar" ? "معلومات إضافية عن الطفل" : L === "en" ? "Additional child information" : "Informations complémentaires sur l'enfant"}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Globe size={14} /> {tx("nationality", L)}
                </label>
                <select
                  value={form.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="">{L === "ar" ? "— اختر —" : L === "en" ? "— Select —" : "— Sélectionner —"}</option>
                  <option value="DZ">{L === "ar" ? "جزائري(ة)" : L === "en" ? "Algerian" : "Algérien(ne)"}</option>
                  <option value="MA">{L === "ar" ? "مغربي(ة)" : L === "en" ? "Moroccan" : "Marocain(e)"}</option>
                  <option value="TN">{L === "ar" ? "تونسي(ة)" : L === "en" ? "Tunisian" : "Tunisien(ne)"}</option>
                  <option value="EG">{L === "ar" ? "مصري(ة)" : L === "en" ? "Egyptian" : "Égyptien(ne)"}</option>
                  <option value="SA">{L === "ar" ? "سعودي(ة)" : L === "en" ? "Saudi" : "Saoudien(ne)"}</option>
                  <option value="AE">{L === "ar" ? "إماراتي(ة)" : L === "en" ? "Emirati" : "Émirien(ne)"}</option>
                  <option value="QA">{L === "ar" ? "قطري(ة)" : L === "en" ? "Qatari" : "Qatari(e)"}</option>
                  <option value="KW">{L === "ar" ? "كويتي(ة)" : L === "en" ? "Kuwaiti" : "Koweïtien(ne)"}</option>
                  <option value="LB">{L === "ar" ? "لبناني(ة)" : L === "en" ? "Lebanese" : "Libanais(e)"}</option>
                  <option value="SY">{L === "ar" ? "سوري(ة)" : L === "en" ? "Syrian" : "Syrien(ne)"}</option>
                  <option value="IQ">{L === "ar" ? "عراقي(ة)" : L === "en" ? "Iraqi" : "Irakien(ne)"}</option>
                  <option value="JO">{L === "ar" ? "أردني(ة)" : L === "en" ? "Jordanian" : "Jordanien(ne)"}</option>
                  <option value="PS">{L === "ar" ? "فلسطيني(ة)" : L === "en" ? "Palestinian" : "Palestinien(ne)"}</option>
                  <option value="SD">{L === "ar" ? "سوداني(ة)" : L === "en" ? "Sudanese" : "Soudanais(e)"}</option>
                  <option value="LY">{L === "ar" ? "ليبي(ة)" : L === "en" ? "Libyan" : "Libyen(ne)"}</option>
                  <option value="MR">{L === "ar" ? "موريتاني(ة)" : L === "en" ? "Mauritanian" : "Mauritanien(ne)"}</option>
                  <option value="SO">{L === "ar" ? "صومالي(ة)" : L === "en" ? "Somali" : "Somalien(ne)"}</option>
                  <option value="TR">{L === "ar" ? "تركي(ة)" : L === "en" ? "Turkish" : "Turc/Turque"}</option>
                  <option value="CA">{L === "ar" ? "كندي(ة)" : L === "en" ? "Canadian" : "Canadien(ne)"}</option>
                  <option value="OTHER">{L === "ar" ? "أخرى" : L === "en" ? "Other" : "Autre"}</option>
                </select>
                {form.nationality === "OTHER" && (
                  <input
                    type="text"
                    value={form.nationalityCustom}
                    onChange={(e) => handleChange("nationalityCustom", e.target.value)}
                    placeholder={tx("nationalityOther", L)}
                    className="w-full mt-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Languages size={14} /> {tx("spokenLanguages", L)}
                </label>
                <div className="flex flex-wrap gap-2">
                  {["ar", "fr", "en", "other"].map((key) => {
                    const current = form.spokenLanguages.split(",").map(s => s.trim()).filter(Boolean)
                    const checked = current.includes(key)
                    const labelMap: Record<string, Record<string, string>> = {
                      fr: { ar: "Arabe", fr: "Français", en: "Anglais", other: "Autre" },
                      en: { ar: "Arabic", fr: "French", en: "English", other: "Other" },
                      ar: { ar: "العربية", fr: "الفرنسية", en: "الإنجليزية", other: "أخرى" },
                    }
                    return (
                      <label key={key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border cursor-pointer transition ${checked ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked ? [...current, key] : current.filter(k => k !== key)
                            handleChange("spokenLanguages", next.join(","))
                          }}
                        />
                        {labelMap[L]?.[key] ?? key}
                      </label>
                    )
                  })}
                </div>
                {form.spokenLanguages.split(",").map(s => s.trim()).includes("other") && (
                  <input
                    type="text"
                    value={form.languageCustom}
                    onChange={(e) => handleChange("languageCustom", e.target.value)}
                    placeholder={tx("languageOther", L)}
                    className="w-full mt-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("fullName", L)}</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("fullNameAr", L)}</label>
              <input
                type="text"
                dir="rtl"
                value={form.fullNameAr}
                onChange={(e) => handleChange("fullNameAr", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm arabic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("email", L)}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("phone", L)}</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("gender", L)}</label>
              <select
                required
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">{L === "ar" ? "اختر" : L === "en" ? "Select" : "Sélectionner"}</option>
                <option value="MALE">{tx("male", L)}</option>
                <option value="FEMALE">{tx("female", L)}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("relation", L)}</label>
              <select
                required
                value={form.relation}
                onChange={(e) => handleChange("relation", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">{L === "ar" ? "اختر" : L === "en" ? "Select" : "Sélectionner"}</option>
                <option value="MOTHER">{tx("mother", L)}</option>
                <option value="FATHER">{tx("father", L)}</option>
                <option value="TUTOR">{tx("tutor", L)}</option>
                <option value="BROTHER">{tx("brother", L)}</option>
                <option value="SISTER">{tx("sister", L)}</option>
                <option value="UNCLE">{tx("uncle", L)}</option>
                <option value="AUNT">{tx("aunt", L)}</option>
                <option value="GRANDFATHER">{tx("grandfather", L)}</option>
                <option value="GRANDMOTHER">{tx("grandmother", L)}</option>
                <option value="OTHER">{tx("other", L)}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("password", L)}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("confirmPassword", L)}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tx("studentCode", L)}</label>
            <input
              type="text"
              readOnly
              value={studentCode}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" />{tx("registering", L)}</> : tx("register", L)}
          </button>
        </form>
      </div>
    </div>
  )
}
