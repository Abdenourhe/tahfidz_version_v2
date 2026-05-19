"use client"
// src/components/admin/StudentActions.tsx

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Eye, UserCheck, UserX, Trash2, Loader2 } from "lucide-react"

interface StudentActionsProps {
  studentId: string
  isActive: boolean
  studentName: string
}

export function StudentActions({ studentId, isActive, studentName }: StudentActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const toggleActive = async () => {
    setLoading("toggle")
    setOpen(false)
    try {
      await fetch(`/api/students/${studentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const deleteStudent = async () => {
    setLoading("delete")
    setShowConfirmDelete(false)
    try {
      await fetch(`/api/students/${studentId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="relative inline-block" ref={menuRef}>
        {loading ? (
          <Loader2 size={16} className="animate-spin text-gray-400" />
        ) : (
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <MoreVertical size={16} />
          </button>
        )}

        {open && (
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            <div className="py-1">
              {/* Voir */}
              <button
                onClick={() => { setOpen(false); router.push(`/admin/students/${studentId}`) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <Eye size={15} className="text-gray-400" />
                Voir le profil
              </button>

              <div className="h-px bg-gray-100 my-1" />

              {/* Activer / Désactiver */}
              <button
                onClick={toggleActive}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${isActive ? "text-yellow-700 hover:bg-yellow-50" : "text-green-700 hover:bg-green-50"}`}
              >
                {isActive
                  ? <><UserX size={15} className="text-yellow-500" />Désactiver le compte</>
                  : <><UserCheck size={15} className="text-green-500" />Activer le compte</>
                }
              </button>

              <div className="h-px bg-gray-100 my-1" />

              {/* Supprimer */}
              <button
                onClick={() => { setOpen(false); setShowConfirmDelete(true) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={15} className="text-red-500" />
                Supprimer définitivement
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirmDelete(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Supprimer définitivement ?</h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              Vous êtes sur le point de supprimer
            </p>
            <p className="text-sm font-semibold text-gray-800 text-center mb-4">« {studentName} »</p>
            <p className="text-xs text-red-600 text-center bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">
              ⚠️ Cette action est irréversible. Toutes les données seront perdues.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={deleteStudent}
                disabled={loading === "delete"}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {loading === "delete" ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
