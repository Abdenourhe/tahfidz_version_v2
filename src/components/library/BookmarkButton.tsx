"use client"

import { useState } from "react"
import { Bookmark } from "lucide-react"
import { motion } from "framer-motion"

interface Props {
  contentId: string
  initialBookmarked?: boolean
}

export function BookmarkButton({ contentId, initialBookmarked = false }: Props) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (isBookmarked) {
        await fetch(`/api/library/contents/${contentId}/bookmark`, { method: "DELETE" })
        setIsBookmarked(false)
      } else {
        await fetch(`/api/library/contents/${contentId}/bookmark`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
        setIsBookmarked(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      disabled={loading}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    >
      <Bookmark size={20} className={isBookmarked ? "fill-tahfidz-gold text-tahfidz-gold" : "text-gray-400"} />
    </motion.button>
  )
}
