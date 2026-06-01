// src/app/teacher/halaqa/[id]/evaluation/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowLeft, Star, BookOpen, Save, Loader2,
  BarChart3, MessageSquare
} from "lucide-react"

const schema = z.object({
  tajweedScore: z.number().min(0).max(100).optional(),
  memorizationScore: z.number().min(0).max(100).optional(),
  fluencyScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface StudentEval {
  userId: string
  fullName: string
  evaluation?: {
    id: string
    tajweedScore?: number | null
    memorizationScore?: number | null
    fluencyScore?: number | null
    notes?: string | null
  }
}

export default function MaqraEvaluationPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [students, setStudents] = useState<StudentEval[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!sessionId) return
    fetchSession()
  }, [sessionId])

  useEffect(() => {
    const student = students.find((s) => s.userId === selectedStudent)
    if (student?.evaluation) {
      reset({
        tajweedScore: student.evaluation.tajweedScore ?? undefined,
        memorizationScore: student.evaluation.memorizationScore ?? undefined,
        fluencyScore: student.evaluation.fluencyScore ?? undefined,
        notes: student.evaluation.notes ?? undefined,
      })
    } else {
      reset({ tajweedScore: undefined, memorizationScore: undefined, fluencyScore: undefined, notes: "" })
    }
  }, [selectedStudent, students, reset])

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/maqra/sessions?sessionId=${sessionId}`)
      const data = await res.json()
      const session = data.sessions?.[0]
      if (!session) return

      // Récupérer les infos des élèves
      const sRes = await fetch("/api/students")
      const sData = await sRes.json()
      const allStudents = sData.students?.map((s: any) => s.user) || []

      const mapped = session.studentIds.map((id: string) => {
        const u = allStudents.find((st: any) => st.id === id)
        const evalObj = session.evaluations?.find((e: any) => e.studentId === id)
        return {
          userId: id,
          fullName: u?.fullName || "Élève",
          evaluation: evalObj,
        }
      })

      setStudents(mapped)
      if (mapped.length > 0) setSelectedStudent(mapped[0].userId)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!selectedStudent) return
    setSaving(true)
    try {
      const res = await fetch("/api/maqra/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          studentId: selectedStudent,
          ...data,
        }),
      })
      if (!res.ok) throw new Error("Erreur")
      // Rafraîchir
      await fetchSession()
    } catch {
      alert("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const currentStudent = students.find((s) => s.userId === selectedStudent)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-tahfidz-green" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/teacher/halaqa"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-6 transition"
        >
          <ArrowLeft size={16} />
          Retour aux séances
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <BarChart3 size={24} className="text-tahfidz-green" />
            Évaluation Halaqa Online
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Notez la récitation de vos élèves
          </p>

          {/* Liste élèves */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {students.map((s) => (
              <button
                key={s.userId}
                onClick={() => setSelectedStudent(s.userId)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  selectedStudent === s.userId
                    ? "bg-tahfidz-green text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {s.fullName}
                {s.evaluation && <span className="ml-1 text-[10px] opacity-70">✓</span>}
              </button>
            ))}
          </div>

          {currentStudent && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tajweed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <Star size={14} className="inline mr-1 text-amber-500" />
                    Tajwîd (/100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register("tajweedScore", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                  />
                  {errors.tajweedScore && <p className="mt-1 text-xs text-red-600">{errors.tajweedScore.message}</p>}
                </div>

                {/* Mémorisation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <BookOpen size={14} className="inline mr-1 text-blue-500" />
                    Mémorisation (/100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register("memorizationScore", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                  />
                </div>

                {/* Fluidité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <BarChart3 size={14} className="inline mr-1 text-green-500" />
                    Fluidité (/100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register("fluencyScore", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <MessageSquare size={14} className="inline mr-1" />
                  Notes et corrections
                </label>
                <textarea
                  {...register("notes")}
                  rows={4}
                  placeholder="Points forts, erreurs à corriger, conseils..."
                  className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-tahfidz-green hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-60 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-tahfidz-green/20"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Sauvegarde...</> : <><Save size={16} /> Enregistrer l&apos;évaluation</>}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
