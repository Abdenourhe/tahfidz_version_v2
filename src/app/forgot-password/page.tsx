"use client"
// src/app/forgot-password/page.tsx — Mot de passe oublie

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, KeyRound, Loader2, Mail, School, Send, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [schoolSlug, setSchoolSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes("@")) { setError("Veuillez entrer un email valide."); return }
    if (schoolSlug.length < 2) { setError("Veuillez entrer l'identifiant de votre ecole."); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, schoolSlug: schoolSlug.toUpperCase() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || "Erreur lors de la demande.")
      } else {
        setSent(true)
      }
    } catch {
      setError("Une erreur reseau est survenue.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Left panel (same style as login) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2NGgtNHpNMzQgMzZoNHY0aC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />

        <div className="relative z-10 text-center px-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">ط</span>
              </div>
              <span className="text-white font-bold text-2xl tracking-tight">TAHFIDZ</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Recuperation de mot de passe</h2>
            <p className="text-emerald-100/70 text-sm leading-relaxed">
              Pas de panique ! Envoyez une demande de reinitialisation au Super Admin de votre plateforme.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[55%] xl:w-[58%] flex flex-col min-h-screen">
        <div className="hidden lg:flex items-center px-10 xl:px-16 pt-8">
          <Link href="/login" className="flex items-center gap-2 text-sm text-gray-400 hover:text-tahfidz-green transition">
            <ArrowLeft size={14} /> Retour a la connexion
          </Link>
        </div>

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-tahfidz-green flex items-center justify-center text-white font-bold">ط</div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">TAHFIDZ</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-10 xl:px-20">
          <div className="w-full max-w-md">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Demande envoyee !</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Le Super Admin a ete notifie de votre demande. Vous recevrez une reponse sous peu.
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition">
                  <ArrowLeft size={14} /> Retour a la connexion
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/20 flex items-center justify-center text-tahfidz-green mb-4">
                    <KeyRound size={24} />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Mot de passe oublie ?</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Remplissez le formulaire ci-dessous pour demander une reinitialisation.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Identifiant de l&apos;ecole <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={schoolSlug}
                        onChange={e => setSchoolSlug(e.target.value.toUpperCase())}
                        placeholder="EX : EC-ALG-001"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Adresse email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="directeur@ecole.dz"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-tahfidz-green hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-tahfidz-green/20 mt-2">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Envoi...</> : <><Send size={16} /> Envoyer la demande</>}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm text-gray-500 hover:text-tahfidz-green transition">
                    Vous vous en souvenez ? <span className="font-medium">Se connecter</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
