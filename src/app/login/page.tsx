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
  Check, ArrowLeft, ShieldCheck, Globe, Lock, Mail, Building2,
  Sparkles, TrendingUp, Award, KeyRound
} from "lucide-react"
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

const stats = [
  { val: "200+", label: "Ecoles", icon: Building2 },
  { val: "20K+", label: "Eleves", icon: Users },
  { val: "1K+", label: "Enseignants", icon: Award },
]

/* ═══════════════════════════════════════════════════════════════════ */
function LoginForm() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const callbackUrl   = searchParams.get("callbackUrl") || "/"
  const [showPwd, setShowPwd]         = useState(false)
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
          <div className="flex-shrink-0 mb-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center group-hover:bg-white/20 transition">
                <span className="text-white font-bold text-xl">ط</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">TAHFIDZ</span>
            </Link>
          </div>

          {/* Main content grid */}
          <div className="flex-1 flex flex-col gap-5 min-h-0">
            {/* ═══ CADRE ROUGE : Illustration ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0"
            >
              <div className="mx-auto max-w-[280px] xl:max-w-[320px]">
                <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/25 bg-white/5 backdrop-blur-sm">
                  <Image
                    src="/images/hero-illustration.png"
                    alt="TAHFIDZ Illustration"
                    width={380}
                    height={300}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>
              </div>
            </motion.div>

            {/* ═══ CADRES ORANGE : Features & Stats ═══ */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              {/* Left card : title + features */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col bg-white/6 border border-white/10 backdrop-blur-md rounded-2xl p-5 overflow-hidden"
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-emerald-100 text-xs font-medium mb-4 w-fit backdrop-blur-sm">
                  <Sparkles size={14} />
                  Plateforme N°1 pour les ecoles coraniques
                </div>

                {/* Title */}
                <h2 className="text-xl xl:text-2xl font-bold text-white leading-snug mb-3">
                  La plateforme <span className="text-emerald-300">coranique</span> moderne
                </h2>
                <p className="text-emerald-100/70 text-sm leading-relaxed mb-5">
                  Gerez votre ecole de memorisation du Coran avec des outils intelligents.
                </p>

                {/* Features */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 border border-white/8"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-emerald-300" />
                      </div>
                      <span className="text-emerald-50/95 text-sm font-medium">{f.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right card : stats */}
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col bg-white/6 border border-white/10 backdrop-blur-md rounded-2xl p-5 overflow-hidden"
              >
                <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-300" />
                  Notre impact
                </h3>

                <div className="flex-1 flex flex-col gap-3 justify-center">
                  {stats.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-white/5 border border-white/8"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <s.icon size={20} className="text-emerald-300" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white leading-none">{s.val}</div>
                        <div className="text-xs text-emerald-300/70 uppercase tracking-wide mt-1">{s.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Decorative bottom element */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-emerald-200/60 text-center">
                    Deja present dans 8 pays
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom spacer for balance */}
          <div className="flex-shrink-0 h-6" />
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
                        placeholder="EX : EC-ALG-001"
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
                      Exemple : <span className="font-mono font-bold text-gray-500">AB-12345</span> ou <span className="font-mono font-bold text-gray-500">EC-ALG-001</span>
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

                  {/* Forgot password */}
                  <div className="flex justify-end">
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
