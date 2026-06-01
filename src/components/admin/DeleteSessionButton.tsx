"use client"

import { Trash2 } from "lucide-react"

interface DeleteSessionButtonProps {
  confirmMessage?: string
  title?: string
}

export function DeleteSessionButton({
  confirmMessage = "Supprimer cette séance ?",
  title = "Supprimer",
}: DeleteSessionButtonProps) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault()
      }}
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
      title={title}
    >
      <Trash2 size={15} />
    </button>
  )
}
