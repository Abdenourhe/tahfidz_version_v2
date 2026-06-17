"use client"

import { useState } from "react"
import { z } from "zod"
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const contactSchema = z.object({
  fullName: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  type: z.enum(["general", "support", "demo", "partnership", "other"]),
  schoolName: z.string().optional(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(500, "500 caractères maximum"),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter la politique de confidentialité" }),
  }),
})

type ContactFormData = z.infer<typeof contactSchema>

const requestTypes = [
  { value: "general", label: "Question générale" },
  { value: "support", label: "Support technique" },
  { value: "demo", label: "Demande de démo" },
  { value: "partnership", label: "Partenariat" },
  { value: "other", label: "Autre" },
] as const

export function ContactForm() {
  const [form, setForm] = useState<ContactFormData>({
    fullName: "",
    email: "",
    type: "general",
    schoolName: "",
    message: "",
    acceptPrivacy: false as unknown as true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({})
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const updateField = <K extends keyof ContactFormData>(field: K, value: ContactFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("idle")

    const result = contactSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ContactFormData
        fieldErrors[key] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setStatus("loading")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Erreur lors de l'envoi")
      setStatus("success")
      setForm({
        fullName: "",
        email: "",
        type: "general",
        schoolName: "",
        message: "",
        acceptPrivacy: false as unknown as true,
      })
    } catch {
      setStatus("error")
    }
  }

  const inputClass = cn(
    "w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
    "text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
  )

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-tahfidz-green" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message envoyé</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.</p>
        <button
          onClick={() => setStatus("idle")}
          className="px-6 py-2.5 rounded-xl bg-tahfidz-green text-white font-medium hover:bg-tahfidz-green/90 transition"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom complet *</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            className={cn(inputClass, errors.fullName && "border-red-500 focus:border-red-500 focus:ring-red-500/50")}
            placeholder="Votre nom"
          />
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={cn(inputClass, errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500/50")}
            placeholder="votre@email.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de demande *</label>
          <select
            value={form.type}
            onChange={(e) => updateField("type", e.target.value as ContactFormData["type"])}
            className={inputClass}
          >
            {requestTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom de l&apos;école</label>
          <input
            type="text"
            value={form.schoolName}
            onChange={(e) => updateField("schoolName", e.target.value)}
            className={inputClass}
            placeholder="Optionnel"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message *</label>
        <textarea
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
          rows={5}
          maxLength={500}
          className={cn(inputClass, "resize-y min-h-[120px]", errors.message && "border-red-500 focus:border-red-500 focus:ring-red-500/50")}
          placeholder="Décrivez votre demande..."
        />
        <div className="flex items-center justify-between mt-1">
          {errors.message ? <p className="text-xs text-red-500">{errors.message}</p> : <span />}
          <span className="text-xs text-gray-400">{form.message.length}/500</span>
        </div>
      </div>

      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.acceptPrivacy}
            onChange={(e) => updateField("acceptPrivacy", e.target.checked as unknown as true)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            J&apos;accepte la{" "}
            <a href="/privacy" className="text-tahfidz-green hover:underline">politique de confidentialité</a>.
          </span>
        </label>
        {errors.acceptPrivacy && <p className="mt-1 text-xs text-red-500">{errors.acceptPrivacy}</p>}
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={18} />
          Une erreur est survenue lors de l&apos;envoi. Veuillez réessayer.
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-tahfidz-green text-white font-semibold hover:bg-tahfidz-green/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {status === "loading" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {status === "loading" ? "Envoi en cours..." : "Envoyer le message"}
      </button>
    </form>
  )
}
