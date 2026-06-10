"use client"

import { useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import Image from "next/image"

interface Props {
  currentAvatar?: string | null
  name: string
  size?: number
  onUploaded?: (url: string) => void
  uploadUrl?: string
}

function resizeImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let w = img.width
        let h = img.height
        if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize } }
        else { if (h > maxSize) { w *= maxSize / h; h = maxSize } }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", 0.85))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AvatarUploader({ currentAvatar, name, size = 80, onUploaded, uploadUrl = "/api/profile/avatar" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return
    setUploading(true)
    try {
      const dataUrl = await resizeImage(file, 300)
      setPreview(dataUrl)
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: dataUrl }),
      })
      const data = await res.json()
      if (res.ok && data.avatar) {
        onUploaded?.(data.avatar)
      }
    } catch (e) {
      console.error("Upload error", e)
    } finally {
      setUploading(false)
    }
  }

  const src = preview || currentAvatar

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-2xl gradient-tahfidz flex items-center justify-center overflow-hidden shadow-lg cursor-pointer transition"
        onClick={() => inputRef.current?.click()}
      >
        {src ? (
          <Image src={src} alt={name} width={size} height={size} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-bold text-2xl">{name.charAt(0)}</span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          {uploading ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : (
            <Camera size={20} className="text-white" />
          )}
        </div>
      </div>

      {/* Edit badge */}
      <button
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
      >
        <Camera size={12} className="text-gray-600" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
