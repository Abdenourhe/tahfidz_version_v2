"use client"
// src/app/admin/parents/new/page.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  AlertCircle
} from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  fullName: z.string().min(2, "Nom trop court"),
  fullNameAr: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  role: z.literal("PARENT"),
})

type FormInput = z.infer<typeof schema>

export default function NewParentPage() {
  const router = useRouter()

    const t = useT("parents_new")

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { role: "PARENT", gender: "MALE" },
  })

  const onSubmit = async (data: FormInput) => {
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const contentType = res.headers.get("content-type")
      let result

      if (contentType?.includes("application/json")) {
        result = await res.json()
      } else {
        const text = await res.text()
        console.error("Réponse non-JSON:", text.substring(0, 500))
        throw new Error(`Erreur serveur ${res.status}: réponse non-JSON reçue`)
      }

      if (!res.ok) {
        throw new Error(result.error || `Erreur ${res.status}`)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/parents")
        router.refresh()
      }, 2000)

    } catch (e: any) {
      console.error("Erreur création parent:", e)
      setError(e.message || t("error"))
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("created")}</h2>
          <p className="text-gray-500 mt-2">{t("redirecting")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Informations personnelles */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("personalInfo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("fullName")}</label>
              <input type="text" placeholder={t("fullNamePlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("fullName")} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("fullNameAr")}</label>
              <input type="text" placeholder={t("fullNameArPlaceholder")} dir="rtl" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm arabic" {...register("fullNameAr")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("gender")}</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" {...register("gender")}>
                <option value="MALE">{t("male")}</option>
                <option value="FEMALE">{t("female")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("phone")}</label>
              <input type="tel" placeholder={t("phonePlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("phone")} />
            </div>
          </div>
        </div>

        {/* Compte */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("account")}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("email")}</label>
            <input type="email" placeholder={t("emailPlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("password")}</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder={t("passwordPlaceholder")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm pr-10" {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        {/* Info liaison */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">{t("linkInfo")}</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">{t("linkDesc")}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            {t("cancel")}
          </button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-tahfidz-green-dark disabled:opacity-50 transition flex items-center gap-2">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" />{t("creating")}</> : t("create")}
          </button>
        </div>
      </form>
    </div>
  )
}
