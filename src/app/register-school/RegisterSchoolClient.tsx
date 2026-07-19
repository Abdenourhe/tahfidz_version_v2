"use client"
// src/app/register-school/RegisterSchoolClient.tsx — Formulaire d'inscription d'école (client)

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, CheckCircle2, School, ArrowLeft, Building2, User, Mail,
  Phone, Lock, MapPin, Globe, Users, GraduationCap, BookOpen,
  ChevronRight, Check, Sparkles, ShieldCheck, Eye, EyeOff, ImagePlus, X, Clock
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { PLAN_CONFIG, PLANS, PlanLocale } from "@/lib/halaqa-quota"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import type { LandingContent } from "@/lib/landing/default-content"

/* ─── Types ──────────────────────────────────────────────── */
type Step = 1 | 2 | 3

interface FormData {
  schoolName:      string
  address:         string
  city:            string
  country:         string
  adminName:       string
  adminEmail:      string
  adminPhone:      string
  adminPassword:   string
  confirmPassword: string
  classCount:      string
  studentsPerClass:string
  teachersCount:   string
  plan:            string
  billingCycle:    string
  halaqaSessionDuration: string
}

type LandingPlan = LandingContent["pricing"]["plans"][number]

/* ─── Step config ────────────────────────────────────────── */

type SchoolPlanKey = keyof typeof PLANS
const planOrder: SchoolPlanKey[] = ["FREE", "STARTER", "ECONOMIQUE", "PRO", "ENTERPRISE"]

function planLabel(plan: SchoolPlanKey, plans: LandingPlan[], lang: PlanLocale): string {
  return plans.find((p) => p.key === plan)?.name ?? PLANS[plan].name[lang] ?? PLANS[plan].name.fr
}

function getRecommendedPlan(totalStudents: number, teachersCount: number): SchoolPlanKey {
  for (const plan of planOrder) {
    const config = PLAN_CONFIG[plan]
    const fitsStudents = config.maxStudents === null || totalStudents <= config.maxStudents
    const fitsTeachers = config.maxTeachers === null || teachersCount <= config.maxTeachers
    if (fitsStudents && fitsTeachers) return plan
  }
  return "ENTERPRISE"
}

/* ─── Component ──────────────────────────────────────────── */
export default function RegisterSchoolClient() {
  const [step, setStep]       = useState<Step>(1)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan") ?? "FREE"
  const periodParam = searchParams.get("period") ?? "year"
  const billingCycleParam = periodParam === "month" ? "MONTHLY" : "YEARLY"
  const { locale } = useLanguage()
  const lang: PlanLocale = (locale === "ar" ? "ar" : locale === "en" ? "en" : "fr") as PlanLocale
  const t = useT("registerSchool")

  const steps = [
    { num: 1, label: t("stepSchool"), icon: Building2 },
    { num: 2, label: t("stepAdmin"), icon: User },
    { num: 3, label: t("stepCapacity"), icon: Users },
  ]

  const [landingPlans, setLandingPlans] = useState<LandingPlan[]>([])
  const [landingCurrency, setLandingCurrency] = useState("CAD")

  useEffect(() => {
    fetch(`/api/site-config/landing/plans?lang=${lang}`)
      .then((res) => res.json())
      .then((data: { plans?: LandingPlan[]; currency?: string }) => {
        setLandingPlans(data.plans ?? [])
        setLandingCurrency(data.currency ?? "CAD")
      })
      .catch(() => setLandingPlans([]))
  }, [lang])

  const [form, setForm] = useState<FormData>({
    schoolName:      "",
    address:         "",
    city:            "",
    country:         "DZ",
    adminName:       "",
    adminEmail:      "",
    adminPhone:      "",
    adminPassword:   "",
    confirmPassword: "",
    classCount:      "",
    studentsPerClass:"",
    teachersCount:   "",
    plan:            planParam,
    billingCycle:    billingCycleParam,
    halaqaSessionDuration: "45",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const update = (k: keyof FormData, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setError(null)
  }

  const canGoNext = () => {
    if (step === 1) return form.schoolName.length >= 2
    if (step === 2) {
      return (
        form.adminName.length >= 2 &&
        form.adminEmail.includes("@") &&
        form.adminPassword.length >= 8 &&
        form.adminPassword === form.confirmPassword
      )
    }
    return true
  }

  const next = () => {
    if (step === 2 && form.adminPassword !== form.confirmPassword) {
      setError(t("passwordMismatch"))
      return
    }
    if (step === 2 && form.adminPassword.length < 8) {
      setError(t("passwordMinLength"))
      return
    }
    if (step < 3) setStep((s => (s + 1) as Step))
  }

  const prev = () => {
    if (step > 1) setStep((s => (s - 1) as Step))
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const submit = async () => {
    if (!canGoNext()) return
    setLoading(true)
    setError(null)
    try {
      let logo: string | undefined
      if (logoFile) {
        logo = await readFileAsBase64(logoFile)
      }
      const res = await fetch("/api/register-school", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName:       form.schoolName,
          address:          form.address || undefined,
          city:             form.city,
          country:          form.country,
          adminName:        form.adminName,
          adminEmail:       form.adminEmail,
          adminPhone:       form.adminPhone || undefined,
          adminPassword:    form.adminPassword,
          classCount:       Number(form.classCount),
          studentsPerClass: Number(form.studentsPerClass),
          teachersCount:    Number(form.teachersCount),
          plan:             form.plan,
          billingCycle:     form.billingCycle,
          halaqaSessionDuration: Number(form.halaqaSessionDuration),
          locale:           locale === "ar" ? "ar" : locale === "en" ? "en" : "fr",
          logo,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || t("submitError"))
      } else {
        setSuccess(true)
      }
    } catch {
      setError(t("networkError"))
    }
    setLoading(false)
  }

  const totalStudents = form.classCount && form.studentsPerClass
    ? Number(form.classCount) * Number(form.studentsPerClass)
    : 0

  /* ─── Success screen ─────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tahfidz-green-light/40 via-white to-tahfidz-purple-light/20 dark:from-emerald-900/10 dark:via-gray-950 dark:to-purple-900/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-tahfidz-green/10 mb-6">
            <CheckCircle2 size={44} className="text-tahfidz-green" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t("successTitle")}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {t("successMessage")}<strong>{form.schoolName}</strong>{t("successMessage2")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {t("successDetail")}
          </p>
          <div className="p-4 bg-tahfidz-green-light dark:bg-emerald-900/20 rounded-xl text-sm text-tahfidz-green font-medium mb-6">
            {t("emailRegistered")} {form.adminEmail}
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-tahfidz-green text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-tahfidz-green/20">
            {t("login")}
          </Link>
        </motion.div>
      </div>
    )
  }

  /* ─── Main form ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-tahfidz-green-light/30 dark:from-gray-950 dark:via-gray-950 dark:to-emerald-900/10">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo variant="full" width={75} height={20} priority className="h-5 w-auto" />
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-tahfidz-green transition">
            <ArrowLeft size={14} /> {t("alreadyRegistered")}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green text-xs font-semibold mb-4">
            <Sparkles size={14} />
            {t("freeBadge")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t("title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            {t("subtitle")}
          </p>

          {form.plan && (
            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-tahfidz-green/10 to-emerald-500/10 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-tahfidz-green/20 dark:border-emerald-800/30">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t("planSelected")}</span>
                <span className="text-sm font-bold text-tahfidz-green">
                  {form.plan ? planLabel(form.plan as SchoolPlanKey, landingPlans, lang) : form.plan} · {form.billingCycle === "MONTHLY" ? t("monthly") : t("yearly")}
                </span>
              </div>
              {form.halaqaSessionDuration && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-300">
                  <Clock size={12} />
                  <span className="text-xs font-medium">{t("sessionDuration")} {form.halaqaSessionDuration} {t("minutes")}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            {/* Connector line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800 -z-10" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-tahfidz-green transition-all duration-500 -z-10"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />

            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    step >= s.num
                      ? "bg-tahfidz-green text-white border-tahfidz-green"
                      : "bg-white dark:bg-gray-900 text-gray-400 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {step > s.num ? <Check size={18} /> : <s.icon size={18} />}
                </div>
                <span className={`text-xs font-medium mt-2 ${step >= s.num ? "text-tahfidz-green" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Step content */}
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/20 flex items-center justify-center text-tahfidz-green">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("schoolInfoTitle")}</h2>
                        <p className="text-xs text-gray-500">{t("stepIndicator").replace("{0}", "1").replace("{1}", "3")}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t("schoolNameLabel")} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={form.schoolName}
                          onChange={(e) => update("schoolName", e.target.value)}
                          placeholder={t("schoolNamePlaceholder")}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Logo upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t("logoLabel")} <span className="text-gray-400 font-normal">{t("optional")}</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                          ) : (
                            <ImagePlus size={18} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                            className="hidden"
                            id="logo-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              if (file.size > 2 * 1024 * 1024) { setError(t("logoSizeError")); return }
                              setLogoFile(file)
                              const reader = new FileReader()
                              reader.onload = () => setLogoPreview(reader.result as string)
                              reader.readAsDataURL(file)
                              setError(null)
                            }}
                          />
                          <label htmlFor="logo-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer">
                            {logoFile ? logoFile.name : t("chooseLogo")}
                          </label>
                          {logoFile && (
                            <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                              className="ml-2 text-xs text-red-400 hover:text-red-600 inline-flex items-center gap-1">
                              <X size={11} /> {t("remove")}
                            </button>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">{t("logoHint")}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("addressLabel")}</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={form.address}
                          onChange={(e) => update("address", e.target.value)}
                          placeholder={t("addressPlaceholder")}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("cityLabel")}</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            value={form.city}
                            onChange={(e) => update("city", e.target.value)}
                            placeholder={t("cityPlaceholder")}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("countryLabel")}</label>
                        <div className="relative">
                          <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <select
                            value={form.country}
                            onChange={(e) => update("country", e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white appearance-none"
                          >
                            <option value="DZ">{t("countryDZ")}</option>
                            <option value="MA">{t("countryMA")}</option>
                            <option value="TN">{t("countryTN")}</option>
                            <option value="FR">{t("countryFR")}</option>
                            <option value="BE">{t("countryBE")}</option>
                            <option value="CA">{t("countryCA")}</option>
                            <option value="SA">{t("countrySA")}</option>
                            <option value="OTHER">{t("countryOther")}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                        <User size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("adminTitle")}</h2>
                        <p className="text-xs text-gray-500">{t("stepIndicator").replace("{0}", "2").replace("{1}", "3")}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t("fullNameLabel")} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={form.adminName}
                          onChange={(e) => update("adminName", e.target.value)}
                          placeholder={t("fullNamePlaceholder")}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {t("emailLabel")} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            value={form.adminEmail}
                            onChange={(e) => update("adminEmail", e.target.value)}
                            placeholder={t("emailPlaceholder")}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("phoneLabel")}</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={form.adminPhone}
                            onChange={(e) => update("adminPhone", e.target.value)}
                            placeholder={t("phonePlaceholder")}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {t("passwordLabel")} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type={showPwd ? "text" : "password"}
                            value={form.adminPassword}
                            onChange={(e) => update("adminPassword", e.target.value)}
                            placeholder={t("passwordPlaceholder")}
                            className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                          />
                          <button type="button" onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {t("confirmLabel")} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type={showConfirm ? "text" : "password"}
                            value={form.confirmPassword}
                            onChange={(e) => update("confirmPassword", e.target.value)}
                            placeholder={t("confirmPlaceholder")}
                            className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                          />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("capacityTitle")}</h2>
                        <p className="text-xs text-gray-500">{t("stepIndicator").replace("{0}", "3").replace("{1}", "3")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {t("classesLabel")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={form.classCount}
                          onChange={(e) => update("classCount", e.target.value)}
                          placeholder={t("classesPlaceholder")}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {t("studentsPerClassLabel")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={form.studentsPerClass}
                          onChange={(e) => update("studentsPerClass", e.target.value)}
                          placeholder={t("studentsPerClassPlaceholder")}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {t("teachersLabel")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={form.teachersCount}
                          onChange={(e) => update("teachersCount", e.target.value)}
                          placeholder={t("teachersPlaceholder")}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <Clock size={14} className="inline mr-1" />
                        {t("sessionDurationLabel")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={180}
                        value={form.halaqaSessionDuration}
                        onChange={(e) => update("halaqaSessionDuration", e.target.value)}
                        placeholder={t("sessionDurationPlaceholder")}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1.5">
                        {t("sessionDurationHint")}
                      </p>
                    </div>

                    {totalStudents > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-tahfidz-green-light dark:bg-emerald-900/20 rounded-xl border border-tahfidz-green/10"
                      >
                        <div className="flex items-center gap-2 text-sm text-tahfidz-green font-semibold">
                          <BookOpen size={16} />
                          {t("totalEstimate")} {totalStudents} {t("totalStudents")}
                        </div>
                      </motion.div>
                    )}

                    {/* Dépassement de capacité vs plan sélectionné */}
                    {(() => {
                      const currentPlan = form.plan as SchoolPlanKey
                      const currentConfig = PLAN_CONFIG[currentPlan]
                      const recommended = getRecommendedPlan(totalStudents, Number(form.teachersCount) || 0)
                      const overStudents = currentConfig.maxStudents !== null && totalStudents > currentConfig.maxStudents
                      const overTeachers = currentConfig.maxTeachers !== null && Number(form.teachersCount) > currentConfig.maxTeachers
                      const overLimit = overStudents || overTeachers
                      const recommendedIndex = planOrder.indexOf(recommended)
                      const currentIndex = planOrder.indexOf(currentPlan)

                      if (!overLimit || recommendedIndex <= currentIndex) return null

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30"
                        >
                          <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200 mb-3">
                            <span className="mt-0.5">⚠</span>
                            <div>
                              <p className="font-semibold">{t("capacityExceeded")} {planLabel(currentPlan, landingPlans, lang)}</p>
                              {overStudents && (
                                <p>{t("maxStudentsExceeded").replace("{plan}", planLabel(currentPlan, landingPlans, lang)).replace("{max}", String(currentConfig.maxStudents)).replace("{count}", String(totalStudents))}</p>
                              )}
                              {overTeachers && (
                                <p>{t("maxTeachersExceeded").replace("{plan}", planLabel(currentPlan, landingPlans, lang)).replace("{max}", String(currentConfig.maxTeachers)).replace("{count}", String(form.teachersCount))}</p>
                              )}
                              <p className="mt-1 font-medium">{t("recommendPlan").replace("{plan}", planLabel(recommended, landingPlans, lang))}</p>
                            </div>
                          </div>

                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t("chooseOffer")}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {planOrder
                              .slice(recommendedIndex)
                              .filter((plan) => landingPlans.find((p) => p.key === plan)?.enabled !== false)
                              .map((plan) => {
                              const planDef = landingPlans.find((p) => p.key === plan)
                              const config = PLAN_CONFIG[plan]
                              const isRecommended = plan === recommended
                              const priceRaw = form.billingCycle === "MONTHLY" ? planDef?.monthlyPrice : planDef?.yearlyPrice
                              const price = Number(priceRaw)
                              const features = form.billingCycle === "MONTHLY" ? planDef?.monthlyFeatures : planDef?.yearlyFeatures
                              const isSelected = form.plan === plan
                              if (!planDef) return null
                              return (
                                <button
                                  key={plan}
                                  type="button"
                                  onClick={() => update("plan", plan)}
                                  className={`text-left p-4 rounded-xl border transition relative flex flex-col h-full ${
                                    isSelected
                                      ? "border-tahfidz-green bg-tahfidz-green-light dark:bg-emerald-900/20"
                                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-tahfidz-green/50"
                                  }`}
                                >
                                  {isRecommended && (
                                    <span className="absolute -top-2 left-3 px-2 py-0.5 bg-tahfidz-green text-white text-[10px] font-bold rounded-full">
                                      {t("recommended")}
                                    </span>
                                  )}
                                  <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{planDef.name}</p>
                                    <p className="text-sm font-bold text-tahfidz-green">{Number.isFinite(price) ? price : priceRaw} {landingCurrency}</p>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{planDef.students}</p>
                                  <ul className="space-y-1 mt-auto">
                                    {(features ?? []).slice(0, 4).map((feature, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                        <Check size={12} className="text-tahfidz-green mt-0.5 shrink-0" />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  <p className="text-xs text-tahfidz-green mt-2 font-medium">
                                    {config.monthlyHalaqas === null ? t("unlimitedHalaqas") : `${config.monthlyHalaqas} ${t("halaqasPerMonth")}`} · {config.halaqaMaxDuration} {t("maxDuration")}
                                  </p>
                                  {isSelected && (
                                    <div className="mt-2 text-xs font-semibold text-tahfidz-green">
                                      {t("selected")}
                                    </div>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2"
                >
                  <span className="mt-0.5">⚠</span> {error}
                </motion.div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 sm:px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={step === 1}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t("back")}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canGoNext()}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-tahfidz-green rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-tahfidz-green/20"
                >
                  {t("next")}
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading || !canGoNext()}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-tahfidz-green rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-tahfidz-green/20"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> {t("sending")}</> : <>{t("submit")}</>}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            {t("termsNote")}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
