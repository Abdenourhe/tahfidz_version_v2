// src/app/admin/super/feedbacks/page.tsx

"use client"

import { useEffect, useState } from "react"
import { FeedbackTab } from "@/components/admin/superadmin/system-tabs"
import { FeedbackItem } from "@/components/admin/superadmin/types"

export default function SuperAdminFeedbacksPage() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetch("/api/feedback")
      .then(async (res) => {
        if (!res.ok) throw new Error("Erreur")
        return res.json()
      })
      .then((data) => setItems(data.feedbacks || []))
      .catch(() => setError("Impossible de charger les feedbacks"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return <FeedbackTab items={items} loading={loading} error={error} onReload={load} onSelect={() => {}} />
}
