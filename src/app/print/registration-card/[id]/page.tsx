"use client"

import { useEffect, useState } from "react"
import { RegistrationCard } from "@/components/admin/RegistrationCard"
import { useParams } from "next/navigation"

export default function PrintRegistrationCardPage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/print/registration-card/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError(true))
  }, [id])

  useEffect(() => {
    if (data?.student) {
      const timer = setTimeout(() => {
        window.print()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [data])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Erreur lors du chargement de la fiche.</p>
      </div>
    )
  }

  if (!data?.student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-0">
      <RegistrationCard
        student={data.student}
        school={data.school || { name: "TAHFIDZ" }}
        inviteUrl={data.inviteUrl || null}
      />
    </div>
  )
}
