"use client"
// src/app/register-school/page.tsx — Formulaire public d'inscription d'école

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, School, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Step = "form" | "success"

export default function RegisterSchoolPage() {
  const router  = useRouter()
  const [step, setStep]       = useState<Step>("form")
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    schoolName:      "",
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
  })

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.adminPassword !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    if (form.adminPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/register-school", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName:      form.schoolName,
          city:            form.city,
          country:         form.country,
          adminName:       form.adminName,
          adminEmail:      form.adminEmail,
          adminPhone:      form.adminPhone || undefined,
          adminPassword:   form.adminPassword,
          classCount:      Number(form.classCount),
          studentsPerClass:Number(form.studentsPerClass),
          teachersCount:   Number(form.teachersCount),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Erreur lors de la soumission.")
      } else {
        setStep("success")
      }
    } catch {
      setError("Une erreur réseau est survenue.")
    }
    setLoading(false)
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tahfidz-green-light via-white to-tahfidz-purple-light">
        <div className="text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-tahfidz-green-light mb-6">
            <CheckCircle2 size={44} className="text-tahfidz-green" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Demande envoyée !</h1>
          <p className="text-gray-600 mb-2">
            Votre demande d'inscription pour <strong>{form.schoolName}</strong> est en cours de validation.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Le Super-Admin examinera votre demande et vous enverrez un email de confirmation avec vos identifiants de connexion.
          </p>
          <div className="p-4 bg-tahfidz-green-light rounded-xl text-sm text-tahfidz-green font-medium mb-6">
            Email enregistré : {form.adminEmail}
          </div>
          <Link href="/login" className="text-sm text-gray-500 hover:text-tahfidz-green transition">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tahfidz-green-light via-white to-tahfidz-purple-light py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-tahfidz mb-4">
            <School size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Inscrire mon école</h1>
          <p className="text-gray-500 mt-1 text-sm">Remplissez le formulaire — le Super-Admin validera votre demande</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={submit}>
            {/* Section 1 : École */}
            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full gradient-tahfidz text-white text-xs flex items-center justify-center font-bold">1</span>
                Informations de l'école
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'école *</label>
                <input required value={form.schoolName} onChange={f("schoolName")}
                  placeholder="Medersa Al-Nour"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
                  <input value={form.city} onChange={f("city")} placeholder="Alger"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                  <select value={form.country} onChange={f("country")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
                    <option value="DZ">Algérie</option>
                    <option value="MA">Maroc</option>
                    <option value="TN">Tunisie</option>
                    <option value="FR">France</option>
                    <option value="BE">Belgique</option>
                    <option value="CA">Canada</option>
                    <option value="SA">Arabie Saoudite</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Section 2 : Admin */}
            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full gradient-tahfidz text-white text-xs flex items-center justify-center font-bold">2</span>
                Compte administrateur
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                <input required value={form.adminName} onChange={f("adminName")} placeholder="Sheikh Mohammed Benali"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input required type="email" value={form.adminEmail} onChange={f("adminEmail")} placeholder="directeur@ecole.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                  <input type="tel" value={form.adminPhone} onChange={f("adminPhone")} placeholder="(+213) 6xx xxx xxxx"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe *</label>
                  <input required type="password" value={form.adminPassword} onChange={f("adminPassword")} placeholder="min. 8 caractères"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer *</label>
                  <input required type="password" value={form.confirmPassword} onChange={f("confirmPassword")} placeholder="répéter"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Section 3 : Capacité */}
            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full gradient-tahfidz text-white text-xs flex items-center justify-center font-bold">3</span>
                Capacité prévue
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de classes *</label>
                  <input required type="number" min={1} max={100} value={form.classCount} onChange={f("classCount")} placeholder="5"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Élèves / classe *</label>
                  <input required type="number" min={1} max={100} value={form.studentsPerClass} onChange={f("studentsPerClass")} placeholder="15"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Enseignants *</label>
                  <input required type="number" min={1} max={200} value={form.teachersCount} onChange={f("teachersCount")} placeholder="4"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
              </div>

              {form.classCount && form.studentsPerClass && (
                <p className="text-xs text-tahfidz-green bg-tahfidz-green-light px-3 py-2 rounded-lg">
                  Estimation : {Number(form.classCount) * Number(form.studentsPerClass)} élèves au total
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 space-y-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 gradient-tahfidz text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={16} className="animate-spin" />Envoi en cours…</> : "Soumettre ma demande"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-tahfidz-green hover:underline font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
