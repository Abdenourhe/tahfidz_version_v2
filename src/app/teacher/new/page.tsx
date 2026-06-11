"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  GraduationCap,
  Users,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

export default function NewTeacherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    fullNameAr: "",
    email: "",
    password: "",
    phone: "",
    gender: "MALE",
    specialization: "",
    maxStudents: "20",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // ✅ APPEL CORRECT vers /api/teachers
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      // Gestion défensive de la réponse
      const contentType = response.headers.get("content-type")
      let data

      if (contentType?.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error("Réponse non-JSON:", text.substring(0, 500))
        throw new Error(`Erreur serveur ${response.status}: réponse non-JSON reçue`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Erreur ${response.status}`)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/teachers")
        router.refresh()
      }, 1500)

    } catch (err: any) {
      console.error("Erreur création enseignant:", err)
      setError(err.message || "Erreur lors de la création de l'enseignant")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/admin/teachers" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-tahfidz-green transition mb-4"
        >
          <ArrowLeft size={16} />
          Retour aux enseignants
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Ajouter un enseignant</h1>
        <p className="text-sm text-gray-500 mt-1">Créer un compte enseignant pour votre école</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erreur</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Succès</p>
            <p className="text-sm text-green-600">Enseignant créé avec succès ! Redirection...</p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Identité */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={16} className="text-tahfidz-green" />
            Identité
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="ex: Ahmed Benali"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Nom en arabe
              </label>
              <input
                type="text"
                name="fullNameAr"
                value={formData.fullNameAr}
                onChange={handleChange}
                dir="rtl"
                placeholder="أحمد بنعلي"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-transparent font-arabic"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Genre</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-transparent bg-white"
              >
                <option value="MALE">Masculin</option>
                <option value="FEMALE">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Téléphone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="06 XX XX XX XX"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profil pédagogique */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-tahfidz-green" />
            Profil pédagogique
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Spécialisation</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="ex: Tajweed, Qira&apos;at, Hifz..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Users size={14} />
                Capacité max d&apos;élèves
              </label>
              <input
                type="number"
                name="maxStudents"
                value={formData.maxStudents}
                onChange={handleChange}
                min="1"
                max="100"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Accès au compte */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lock size={16} className="text-tahfidz-green" />
            Accès au compte
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="enseignant@ecole.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Min 6 caractères"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link
            href="/admin/teachers"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || success}
            className="flex items-center gap-2 px-6 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save size={16} />
                Créer l&apos;enseignant
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}