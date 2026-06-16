"use client"
// Page détail enfant côté parent : sur desktop on préfère le master-detail du dashboard

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ParentChildProfileClient } from "@/components/parent/child/ParentChildProfileClient"

export default function ParentChildPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.innerWidth >= 1280) {
      router.replace(`/parent/dashboard?childId=${id}`)
    }
  }, [id, router])

  return <ParentChildProfileClient studentId={id} />
}
