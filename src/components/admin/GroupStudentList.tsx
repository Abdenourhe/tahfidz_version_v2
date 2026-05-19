"use client"
// src/components/admin/GroupStudentList.tsx

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"
import { statusLabel } from "@/lib/utils"
import { TransferStudentModal } from "./TransferStudentModal"

interface Student {
  id: string
  totalStars: number
  user: { fullName: string; fullNameAr?: string | null; isActive: boolean }
  group: { id: string; name: string } | null
  memorizationProgress: {
    status: string
    completionPercentage: number
    surah: { nameFr: string; nameAr: string }
  }[]
  _count: { memorizedSurahs: number }
}

interface Props {
  students: Student[]
  groupId: string
  groupName: string
}

export function GroupStudentList({ students, groupId, groupName }: Props) {
  const [transferStudent, setTransferStudent] = useState<Student | null>(null)

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Élèves ({students.length})</h3>
          <Link href="/admin/students/new" className="text-xs px-3 py-1.5 gradient-tahfidz text-white rounded-lg hover:opacity-90 transition font-medium">
            + Ajouter
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">Aucun élève dans ce groupe</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {students.map(student => (
              <div key={student.id} className={`px-5 py-4 hover:bg-gray-50 transition ${!student.user.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${student.user.isActive ? "gradient-tahfidz" : "bg-gray-300"}`}>
                    <span className="text-white font-bold text-sm">{student.user.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{student.user.fullName}</p>
                      {!student.user.isActive && <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Inactif</span>}
                    </div>
                    {student.user.fullNameAr && <p className="arabic text-xs text-gray-400">{student.user.fullNameAr}</p>}
                    {student.memorizationProgress[0] && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">En cours :</span>
                        <span className="text-xs font-medium text-gray-700">{student.memorizationProgress[0].surah.nameFr}</span>
                        <span className="arabic text-xs text-tahfidz-green">{student.memorizationProgress[0].surah.nameAr}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusLabel(student.memorizationProgress[0].status).bg} ${statusLabel(student.memorizationProgress[0].status).color}`}>
                          {statusLabel(student.memorizationProgress[0].status).label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-tahfidz-green">{student._count.memorizedSurahs}</p>
                      <p className="text-xs text-gray-400">sour.</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-tahfidz-gold">⭐{student.totalStars}</p>
                      <p className="text-xs text-gray-400">étoiles</p>
                    </div>
                    <button
                      onClick={() => setTransferStudent(student)}
                      title="Transférer vers un autre groupe"
                      className="p-1.5 text-gray-400 hover:text-tahfidz-green hover:bg-tahfidz-green-light rounded-lg transition"
                    >
                      <ArrowRight size={15} />
                    </button>
                    <Link href={`/admin/students/${student.id}`} className="text-xs text-tahfidz-green hover:underline font-medium">
                      Voir →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {transferStudent && (
        <TransferStudentModal
          student={transferStudent}
          currentGroupId={groupId}
          onClose={() => setTransferStudent(null)}
        />
      )}
    </>
  )
}
