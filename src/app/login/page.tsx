// src/app/login/page.tsx — avec mode Super Admin
"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Eye, EyeOff, School, BookOpen, Users, BarChart2, Check, ArrowLeft, ShieldCheck } from "lucide-react"
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

// ═══════════════════════════════════════════════════════════
// Composant qui utilise useSearchParams (doit être dans Suspense)
// ═══════════════════════════════════════════════════════════
function LoginForm() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const callbackUrl   = searchParams.get("callbackUrl") || "/"
  const [showPwd, setShowPwd]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [slugCleared, setSlugCleared] = useState(false)
  const [superMode, setSuperMode]     = useState(false)

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
        setError(superMode
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

  const toggleMode = () => {
    setSuperMode(v => !v)
    setError(null)
    schoolForm.reset()
    superForm.reset()
  }

  const isSubmitting = superMode
    ? superForm.formState.isSubmitting
    : schoolForm.formState.isSubmitting

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-xl">ط</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">TAHFIDZ</span>
          </div>
        </div>
        <div className="relative">
          <p className="text-emerald-200 text-sm font-medium uppercase tracking-wider mb-3">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
            La plateforme<br /><span className="text-emerald-300">coranique</span>
          </h2>
          <p className="text-emerald-100 text-base leading-relaxed mb-8">
            Gerez votre ecole de memorisation du Coran avec des outils modernes.
          </p>
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-white" />
                </div>
                <span className="text-emerald-100 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-8">
          {[{ val: "200+", label: "Ecoles" }, { val: "20K+", label: "Eleves" }, { val: "1K+", label: "Enseignants" }].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white">{s.val}</div>
              <div className="text-xs text-emerald-300">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panneau droit */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="hidden lg:flex items-center px-12 pt-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-600 transition">
            <ArrowLeft size={14} />Retour
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-16">
          <div className="w-full max-w-md">

            {/* En-tete */}
            <div className="mb-8">
              {superMode ? (
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={22} className="text-purple-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {superMode
                  ? "Acces reserve a l'administrateur de la plateforme."
                  : "Accedez a l'espace de gestion de votre ecole"}
              </p>
            </div>

            {registered && (
              <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
                <span className="mt-0.5">✅</span>
                <span>Compte cree avec succes ! Connectez-vous pour acceder a votre tableau de bord.</span>
              </div>
            )}

            {linked && (
              <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-start gap-2">
                <span className="mt-0.5">🔗</span>
                <span>Nouvel enfant lie a votre compte ! Connectez-vous pour le consulter.</span>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                <span className="mt-0.5">⚠</span>{error}
              </div>
            )}

            {/* Formulaire ecole */}
            {!superMode && (
              <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Identifiant de l'ecole <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <School size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      autoComplete="organization"
                      placeholder="EX : EC-ALG-001"
                      style={{ textTransform: "uppercase" }}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal ${slugCleared ? "border-amber-400" : "border-gray-200"} ${schoolForm.formState.errors.schoolSlug ? "border-red-300" : ""}`}
                      {...schoolForm.register("schoolSlug", {
                        onChange: (e) => { e.target.value = e.target.value.toUpperCase() }
                      })}
                    />
                  </div>
                  {schoolForm.formState.errors.schoolSlug && (
                    <p className="mt-1 text-xs text-red-600">{schoolForm.formState.errors.schoolSlug.message}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Ex : <span className="font-mono font-bold text-gray-500">AB-12345</span> ou <span className="font-mono font-bold text-gray-500">EC-ALG-001</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adresse email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="directeur@ecole.dz"
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm ${schoolForm.formState.errors.email ? "border-red-300" : ""}`}
                    {...schoolForm.register("email")}
                  />
                  {schoolForm.formState.errors.email && <p className="mt-1 text-xs text-red-600">{schoolForm.formState.errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm ${schoolForm.formState.errors.password ? "border-red-300" : ""}`}
                      {...schoolForm.register("password")}
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {schoolForm.formState.errors.password && <p className="mt-1 text-xs text-red-600">{schoolForm.formState.errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm mt-2">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : "Se connecter →"}
                </button>
              </form>
            )}

            {/* Formulaire super admin */}
            {superMode && (
              <form onSubmit={superForm.handleSubmit(onSuperSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Super Admin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="superadmin@tahfidz.com"
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-sm ${superForm.formState.errors.email ? "border-red-300" : ""}`}
                    {...superForm.register("email")}
                  />
                  {superForm.formState.errors.email && <p className="mt-1 text-xs text-red-600">{superForm.formState.errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-sm ${superForm.formState.errors.password ? "border-red-300" : ""}`}
                      {...superForm.register("password")}
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {superForm.formState.errors.password && <p className="mt-1 text-xs text-red-600">{superForm.formState.errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm mt-2">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : <><ShieldCheck size={16} /> Acces Super Admin</>}
                </button>
              </form>
            )}

            {/* Toggle */}
            <div className="mt-6 text-center">
              <button onClick={toggleMode}
                className="text-xs text-gray-400 hover:text-gray-600 transition underline underline-offset-2">
                {superMode ? "← Connexion ecole normale" : "Connexion Super Admin →"}
              </button>
            </div>

            {!superMode && (
              <div className="mt-4 text-center">
                <Link href="/register-school"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition">
                  🏫 Inscrire mon ecole sur TAHFIDZ
                </Link>
              </div>
            )}

            <div className="mt-5 text-center">
              <p className="text-[10px] text-gray-300 select-none">TAHFIDZ Platform v2.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Page exportée avec Suspense wrapper
// ═══════════════════════════════════════════════════════════
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}