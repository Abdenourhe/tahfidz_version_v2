"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface Props {
  src?: string | null
  alt: string
  fallback?: React.ReactNode
  className?: string
  imgClassName?: string
}

export function AvatarLightbox({ src, alt, fallback, className = "", imgClassName = "" }: Props) {
  const [open, setOpen] = useState(false)

  if (!src) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {fallback ?? (
          <span className="font-bold text-gray-500">{alt.charAt(0).toUpperCase()}</span>
        )}
      </div>
    )
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`object-cover cursor-zoom-in ${imgClassName}`}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setOpen(true)
        }}
      />
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white transition"
            onClick={() => setOpen(false)}
          >
            <X size={28} />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border-4 border-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
