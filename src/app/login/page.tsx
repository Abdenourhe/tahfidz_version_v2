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
  Sparkles, TrendingUp, Award
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
  const [slugCleared, setSlugCleared] = useState(false)
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
        schoolForm.setValue("schoolSlug", "")
        setSlugCleared(true)
        setTimeout(() => setSlugCleared(false), 3000)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [schoolForm])

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
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 relative overflow-hidden flex-col justify-between p-10 xl:p-14">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition">
              <span className="text-white font-bold text-2xl">ط</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">TAHFIDZ</span>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            {/* Illustration */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl scale-110" />
              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                <Image
                  src="/images/hero-illustration.png"
                  alt="TAHFIDZ Illustration"
                  width={400}
                  height={340}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-100 text-xs font-medium mb-4">
              <Sparkles size={14} />
              Plateforme N°1 pour les ecoles coraniques
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3">
              La plateforme<br />
              <span className="text-emerald-300">coranique</span> moderne
            </h2>
            <p className="text-emerald-100/80 text-sm leading-relaxed mb-6">
              Gerez votre ecole de memorisation du Coran avec des outils intelligents.
            </p>

            <div className="space-y-2">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/30 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-emerald-50 text-xs font-medium">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="relative z-10">
          <div className="flex items-center gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <s.icon size={18} className="text-emerald-200" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{s.val}</div>
                  <div className="text-xs text-emerald-300/80">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Panneau droit ═══ */}
      <div className="w-full lg:w-[55%] xl:w-1/2 flex flex-col min-h-screen">
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

            {/* Tabs */}
            <div className="mb-6 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => switchTab("school")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "school"
                    ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                <School size={16} />
                Connexion Ecole
              </button>
              <button
                type="button"
                onClick={() => switchTab("super")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "super"
                    ? "bg-white dark:bg-gray-700 text-purple-600 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                <ShieldCheck size={16} />
                Super Admin
              </button>
            </div>

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
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal dark:text-white ${slugCleared ? "border-amber-400" : "border-gray-200 dark:border-gray-700"} ${schoolForm.formState.errors.schoolSlug ? "border-red-300" : ""}`}
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
