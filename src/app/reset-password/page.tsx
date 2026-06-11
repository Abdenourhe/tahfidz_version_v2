"use client"
// src/app/reset-password/page.tsx — Reinitialisation du mot de passe

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, KeyRound, Loader2, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

function ResetPasswordForm() {
  const searchParams = useSearchParams() ?? new URLSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  // Valider le token au chargement
  useEffect(() => {
    if (!token) {
      setError("Lien invalide ou expire.")
      setValidating(false)
      return
    }
    // Le token sera valide par l'API au submit, on fait juste un check visuel ici
    setTokenValid(true)
    setValidating(false)
  }, [token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caracteres."); return }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
    setLoading(false)
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="animate-spin text-tahfidz-green" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2NGgtNHpNMzQgMzZoNHY0aC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 text-center px-10 max-w-md">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">ط</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">TAHFIDZ</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Securite renforcee</h2>
          <p className="text-emerald-100/70 text-sm leading-relaxed">
            Choisissez un mot de passe fort pour proteger votre compte et les donnees de votre ecole.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        <div className="hidden lg:flex items-center px-10 xl:px-16 pt-8">
          <Link href="/login" className="flex items-center gap-2 text-sm text-gray-400 hover:text-tahfidz-green transition">
            <ArrowLeft size={14} /> Retour a la connexion
          </Link>
        </div>
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-tahfidz-green flex items-center justify-center text-white font-bold">ط</div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">TAHFIDZ</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-10 xl:px-20">
          <div className="w-full max-w-md">
            {success ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mot de passe mis a jour !</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Votre mot de passe a ete reinitialise avec succes.
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition">
                  <ArrowLeft size={14} /> Se connecter
                </Link>
              </motion.div>
            ) : !tokenValid ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-5">
                  <KeyRound size={32} className="text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lien invalide</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                <Link href="/forgot-password" className="inline-flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition">
                  Nouvelle demande
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/20 flex items-center justify-center text-tahfidz-green mb-4">
                    <KeyRound size={24} />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Nouveau mot de passe</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Choisissez un mot de passe securise pour votre compte.
                  </p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nouveau mot de passe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="min. 8 caracteres"
                        className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Confirmer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="repeter le mot de passe"
                        className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-tahfidz-green hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-tahfidz-green/20 mt-2">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</> : "Reinitialiser le mot de passe"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 size={32} className="animate-spin text-tahfidz-green" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
