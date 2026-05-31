// src/app/login/page.tsx — Design professionnel avec onglets École / SuperAdmin
"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, Eye, EyeOff, School, BookOpen, Users, BarChart2,
  Check, ArrowLeft, ShieldCheck, Globe, Lock, Mail,
  Sparkles, TrendingUp, KeyRound, Sun, Moon
} from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/LanguageContext"
import Image from "next/image"
import Link from "next/link"

const schoolSchema = z.object({
  schoolSlug: z.string().min(2, "Identifiant ecole requis"),
  email:      z.string().email("Email invalide"),
  password:   z.string().min(6, "Mot de passe trop court"),
})
const superSchema = z.object({
  email:    z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
})

type SchoolInput = z.infer<typeof schoolSchema>
type SuperInput  = z.infer<typeof superSchema>

/* ─── Petits composants header ─────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition"
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}

function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const langs: { code: "fr" | "en" | "ar"; label: string }[] = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
    { code: "ar", label: "AR" },
  ]
  return (
    <div className="flex items-center rounded-lg bg-white/10 border border-white/15 overflow-hidden">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          className={`px-2 py-1 text-[11px] font-bold transition ${
            locale === l.code
              ? "bg-white/20 text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

const ROLE_DASHBOARD: Record<string, string> = {
  SUPERADMIN: "/admin/super",
  ADMIN:      "/admin/dashboard",
  TEACHER:    "/teacher/dashboard",
  PARENT:     "/parent/dashboard",
  STUDENT:    "/student/dashboard",
}

const features = [
  { icon: BookOpen,  text: "Suivi de memorisation sourate par sourate" },
  { icon: Users,     text: "Gestion complete eleves, enseignants, parents" },
  { icon: BarChart2, text: "Rapports et statistiques detailles" },
]

/* ═══════════════════════════════════════════════════════════════════ */
function LoginForm() {
  const router        = useRouter()
  const searchParams  = useSearchParams() ?? new URLSearchParams()
  const callbackUrl   = searchParams.get("callbackUrl") || "/"
  const [showPwd, setShowPwd]         = useState(false)
  const [rememberMe, setRememberMe]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const [activeTab, setActiveTab]     = useState<"school" | "super">("school")

  const registered = searchParams.get("registered") === "true"
  const linked     = searchParams.get("linked") === "true"
  const prefillEmail     = searchParams.get("email") || ""
  const prefillSchoolSlug = searchParams.get("schoolSlug") || ""

  const schoolForm = useForm<SchoolInput>({
    resolver: zodResolver(schoolSchema),
    defaultValues: { schoolSlug: prefillSchoolSlug, email: prefillEmail, password: "" },
  })
  const superForm = useForm<SuperInput>({
    resolver: zodResolver(superSchema),
    defaultValues: { email: prefillEmail, password: "" },
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault()
        setActiveTab("super")
        setError(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const doSignIn = async (email: string, password: string, schoolSlug = "") => {
    setError(null)
    try {
      const result = await signIn("credentials", { email, password, schoolSlug, redirect: false })
      if (result?.error) {
        setError(activeTab === "super"
          ? "Email ou mot de passe incorrect."
          : "Identifiant ecole, email ou mot de passe incorrect.")
        return
      }
      const res     = await fetch("/api/auth/session")
      const session = await res.json()
      const role    = session?.user?.role
      router.push(ROLE_DASHBOARD[role] ?? callbackUrl)
      router.refresh()
    } catch {
      setError("Une erreur est survenue. Veuillez reessayer.")
    }
  }

  const onSchoolSubmit = async (data: SchoolInput) =>
    doSignIn(data.email, data.password, data.schoolSlug.trim())

  const onSuperSubmit = async (data: SuperInput) =>
    doSignIn(data.email, data.password, "")

  const isSubmitting = activeTab === "super"
    ? superForm.formState.isSubmitting
    : schoolForm.formState.isSubmitting

  const switchTab = (tab: "school" | "super") => {
    setActiveTab(tab)
    setError(null)
    schoolForm.reset()
    superForm.reset()
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* ═══ Panneau gauche ═══ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[48%] bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 relative overflow-hidden h-screen">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2NGgtNHpNMzQgMzZoNHY0aC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-6 xl:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 mb-4 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center group-hover:bg-white/20 transition">
                <span className="text-white font-bold text-xl">ط</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">TAHFIDZ</span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {/* Main content grid */}
          <div className="flex-1 flex flex-col gap-3 min-h-0 justify-center">
            {/* ═══ CERCLE ISLAMIQUE ANIMÉ ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0 flex justify-center"
            >
              <div className="relative w-[280px] h-[280px] xl:w-[340px] xl:h-[340px]">
                {/* Cercle décoratif islamique tournant */}
                <svg
                  viewBox="0 0 200 200"
                  className="absolute inset-0 w-full h-full animate-[spin_20s_linear_infinite]"
                  style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.15))" }}
                >
                  {/* Cercle extérieur */}
                  <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
                  {/* Rosace islamique géométrique */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <g key={angle} transform={`rotate(${angle} 100 100)`}>
                      <path
                        d="M100 4 Q130 30 140 50 Q120 55 100 60 Q80 55 60 50 Q70 30 100 4Z"
                        fill="none"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="0.8"
                      />
                      <circle cx="100" cy="18" r="3" fill="rgba(255,255,255,0.3)" />
                      <circle cx="100" cy="32" r="2" fill="rgba(255,255,255,0.15)" />
                    </g>
                  ))}
                  {/* Étoile centrale */}
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <g key={`s-${angle}`} transform={`rotate(${angle} 100 100)`}>
                      <line x1="100" y1="100" x2="100" y2="70" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                    </g>
                  ))}
                  <circle cx="100" cy="100" r="8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                  <circle cx="100" cy="100" r="4" fill="rgba(255,255,255,0.15)" />
                  {/* Petits cercles sur le périmètre */}
                  {Array.from({ length: 24 }).map((_, i) => {
                    const a = (i * 15 * Math.PI) / 180
                    const r = 85
                    return (
                      <circle
                        key={`p-${i}`}
                        cx={100 + r * Math.cos(a)}
                        cy={100 + r * Math.sin(a)}
                        r={i % 3 === 0 ? 1.5 : 0.8}
                        fill={i % 3 === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)"}
                      />
                    )
                  })}
                </svg>

                {/* Image centrale dans un cercle */}
                <div className="absolute inset-[18%] rounded-full overflow-hidden border-2 border-white/20 shadow-xl bg-white/5 backdrop-blur-sm">
                  <Image
                    src="/images/hero-illustration.png"
                    alt="TAHFIDZ Illustration"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
            </motion.div>

            {/* ═══ Features (design professionnel) ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 xl:p-6 overflow-hidden flex flex-col justify-center w-full"
            >
              {/* En-tête */}
              <div className="mb-5 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 text-emerald-100 text-xs font-medium mb-3">
                  <Sparkles size={13} />
                  Plateforme N°1 pour les ecoles coraniques
                </div>
                <h2 className="text-xl xl:text-2xl font-bold text-white">
                  La plateforme <span className="text-emerald-300">coranique</span> moderne
                </h2>
              </div>

              {/* Features en colonne unique centrée */}
              <div className="flex flex-col gap-3 w-full">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.1 }}
                    className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition w-full"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <f.icon size={16} className="text-emerald-300" />
                    </div>
                    <span className="text-emerald-50/90 text-sm font-medium leading-snug">{f.text}</span>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </div>

          {/* Bottom spacer */}
          <div className="flex-shrink-0 h-2" />
        </div>
      </div>

      {/* ═══ Panneau droit ═══ */}
      <div className="w-full lg:w-1/2 xl:w-[52%] flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-tahfidz-green flex items-center justify-center text-white font-bold">ط</div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">TAHFIDZ</span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <ArrowLeft size={14} /> Retour
          </Link>
        </div>

        {/* Desktop back link */}
        <div className="hidden lg:flex items-center px-10 xl:px-16 pt-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-tahfidz-green transition">
            <ArrowLeft size={14} /> Retour a l&apos;accueil
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-10 xl:px-20">
          <div className="w-full max-w-md">

            {/* Alerts */}
            <AnimatePresence>
              {registered && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} className="text-green-600" />
                  </div>
                  <span>Compte cree avec succes ! Connectez-vous pour acceder a votre tableau de bord.</span>
                </motion.div>
              )}

              {linked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe size={14} className="text-blue-600" />
                  </div>
                  <span>Nouvel enfant lie a votre compte ! Connectez-vous pour le consulter.</span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock size={14} className="text-red-600" />
                  </div>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Bienvenue</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Connectez-vous a votre espace TAHFIDZ</p>
            </div>

            {/* Mode indicator (only visible in super mode) */}
            {activeTab === "super" && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-sm font-medium">
                  <ShieldCheck size={16} />
                  Mode Super Admin
                </div>
                <button
                  type="button"
                  onClick={() => switchTab("school")}
                  className="text-xs text-purple-500 hover:text-purple-700 underline"
                >
                  Retour
                </button>
              </motion.div>
            )}

            {/* Forms */}
            <AnimatePresence mode="wait">
              {activeTab === "school" ? (
                <motion.form
                  key="school"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={schoolForm.handleSubmit(onSchoolSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Identifiant de l&apos;ecole <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        autoComplete="organization"
                        placeholder="EC-ALG-001"
                        style={{ textTransform: "uppercase" }}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal dark:text-white ${"border-gray-200 dark:border-gray-700"} ${schoolForm.formState.errors.schoolSlug ? "border-red-300" : ""}`}
                        {...schoolForm.register("schoolSlug", {
                          onChange: (e) => { e.target.value = e.target.value.toUpperCase() }
                        })}
                      />
                    </div>
                    {schoolForm.formState.errors.schoolSlug && (
                      <p className="mt-1.5 text-xs text-red-600">{schoolForm.formState.errors.schoolSlug.message}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Format : <span className="font-mono font-bold text-gray-500">EC-ALG-001</span> ou <span className="font-mono font-bold text-gray-500">AB-12345</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Adresse email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="directeur@ecole.dz"
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white ${schoolForm.formState.errors.email ? "border-red-300" : "border-gray-200 dark:border-gray-700"}`}
                        {...schoolForm.register("email")}
                      />
                    </div>
                    {schoolForm.formState.errors.email && <p className="mt-1.5 text-xs text-red-600">{schoolForm.formState.errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPwd ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white ${schoolForm.formState.errors.password ? "border-red-300" : "border-gray-200 dark:border-gray-700"}`}
                        {...schoolForm.register("password")}
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {schoolForm.formState.errors.password && <p className="mt-1.5 text-xs text-red-600">{schoolForm.formState.errors.password.message}</p>}
                  </div>

                  {/* Remember me + Forgot password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green/50 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition">
                        Memorise-moi
                      </span>
                    </label>
                    <Link href="/forgot-password" className="text-xs text-tahfidz-green hover:text-emerald-700 font-medium transition">
                      Mot de passe oublie ?
                    </Link>
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="w-full py-3.5 bg-tahfidz-green hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-tahfidz-green/20 hover:shadow-tahfidz-green/30 mt-2">
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : "Se connecter"}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="super"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={superForm.handleSubmit(onSuperSubmit)}
                  className="space-y-4"
                >


                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Super Admin <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="superadmin@tahfidz.com"
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm dark:text-white ${superForm.formState.errors.email ? "border-red-300" : "border-gray-200 dark:border-gray-700"}`}
                        {...superForm.register("email")}
                      />
                    </div>
                    {superForm.formState.errors.email && <p className="mt-1.5 text-xs text-red-600">{superForm.formState.errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPwd ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm dark:text-white ${superForm.formState.errors.password ? "border-red-300" : "border-gray-200 dark:border-gray-700"}`}
                        {...superForm.register("password")}
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {superForm.formState.errors.password && <p className="mt-1.5 text-xs text-red-600">{superForm.formState.errors.password.message}</p>}
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 mt-2">
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : <><ShieldCheck size={16} /> Acceder au Super Admin</>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Register link */}
            {activeTab === "school" && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">Vous n&apos;avez pas encore d&apos;ecole sur TAHFIDZ ?</p>
                <Link href="/register-school"
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-tahfidz-green border-2 border-tahfidz-green/20 hover:border-tahfidz-green hover:bg-tahfidz-green-light dark:hover:bg-emerald-900/20 rounded-xl transition">
                  <TrendingUp size={16} />
                  Inscrire mon ecole gratuitement
                </Link>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-[11px] text-gray-300 dark:text-gray-600">TAHFIDZ Platform v2.0 · Securise par NextAuth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 size={32} className="animate-spin text-tahfidz-green" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
