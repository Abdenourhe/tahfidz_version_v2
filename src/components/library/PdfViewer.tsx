"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Moon, Sun, Download, ZoomIn, ZoomOut } from "lucide-react"
import { motion } from "framer-motion"

interface Props {
  url: string
  contentId: string
  initialPage?: number
  totalPages?: number
  onProgressUpdate?: (page: number, totalPages: number) => void
}

export function PdfViewer({ url, contentId, initialPage = 1, totalPages = 1, onProgressUpdate }: Props) {
  const [page, setPage] = useState(initialPage)
  const [darkMode, setDarkMode] = useState(false)
  const [zoom, setZoom] = useState(100)

  const updateProgress = useCallback((newPage: number) => {
    setPage(newPage)
    onProgressUpdate?.(newPage, totalPages)
  }, [onProgressUpdate, totalPages])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, progress: Math.round((page / totalPages) * 100), lastPosition: page }),
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [page, contentId, totalPages])

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ZoomOut size={18} /></button>
          <span className="text-sm text-gray-600 dark:text-gray-300">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ZoomIn size={18} /></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
          <a href={url} download className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Download size={18} /></a>
        </div>
      </div>

      <div className={"bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden " + (darkMode ? "dark" : "")}>
        <div className="flex items-center justify-center p-8 min-h-[60vh]">
          <object data={url} type="application/pdf" className="w-full h-[60vh] rounded-lg">
            <p className="text-gray-500">Votre navigateur ne supporte pas l&apos;affichage PDF. <a href={url} className="text-tahfidz-green underline" target="_blank" rel="noreferrer">Ouvrir le PDF</a></p>
          </object>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => updateProgress(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"><ChevronLeft size={18} /></button>
        <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} / {totalPages}</span>
        <button onClick={() => updateProgress(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"><ChevronRight size={18} /></button>
      </div>
    </motion.div>
  )
}
