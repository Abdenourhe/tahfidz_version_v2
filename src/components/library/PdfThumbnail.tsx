"use client"

import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import { generatePdfThumbnail } from "@/lib/pdf-thumbnail-client"

interface Props {
  contentId: string
  pdfUrl?: string | null
  width?: number
}

function getCacheKey(contentId: string) {
  return `tahfidz-pdf-thumb-${contentId}`
}

export function PdfThumbnail({ contentId, pdfUrl, width = 256 }: Props) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const generate = async () => {
      try {
        const cacheKey = getCacheKey(contentId)
        const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null
        if (cached) {
          setThumbnail(cached)
          setLoading(false)
          return
        }

        const source = pdfUrl || `/api/library/contents/${contentId}/pdf`
        const dataUrl = await generatePdfThumbnail(source, { width })

        if (!cancelled) {
          setThumbnail(dataUrl)
          try {
            localStorage.setItem(cacheKey, dataUrl)
          } catch {
            // Ignorer les erreurs de quota localStorage.
          }
        }
      } catch (err) {
        console.error("[PDF THUMBNAIL]", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    generate()
    return () => { cancelled = true }
  }, [contentId, pdfUrl, width])

  if (thumbnail) {
    return <img src={thumbnail} alt="" className="w-full h-full object-cover" />
  }

  if (loading) {
    return <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700" />
  }

  return <FileText size={18} />
}
