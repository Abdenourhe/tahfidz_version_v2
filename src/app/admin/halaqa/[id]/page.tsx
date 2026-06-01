// src/app/admin/halaqa/[id]/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Video, ArrowLeft, Users, Calendar, Clock, User, BarChart3,
  FileText, ExternalLink, PlayCircle
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminHalaqaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.schoolId) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/login")

  const { id } = await params
  const schoolId = session.user.schoolId

  const halaqa = await prisma.halaqaSession.findFirst({
    where: { id, schoolId },
    include: {
      teacher: { select: { fullName: true, email: true } },
      group: { select: { name: true } },
      evaluations: {
        include: {
          student: { select: { fullName: true } },
        },
      },
    },
  })

  if (!halaqa) redirect("/admin/halaqa")

  const students = halaqa.studentIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: halaqa.studentIds }, schoolId },
        select: { id: true, fullName: true, email: true },
      })
    : []

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      LIVE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse",
      ENDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      CANCELLED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    }
    return map[status] || "bg-gray-100 text-gray-700"
  }

  const modeLabel = (mode: string) => {
    const map: Record<string, string> = {
      AUDIO_ONLY: "Audio uniquement",
      VIDEO: "Vidéo",
      SCREEN_SHARE: "Partage d'écran",
    }
    return map[mode] || mode
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Video size={28} className="text-tahfidz-green" />
              Détail de la séance
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{halaqa.meetingName}</p>
          </div>
          <Link
            href="/admin/halaqa"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
          >
            <ArrowLeft size={16} />
            Retour aux séances
          </Link>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enseignant</p>
                <p className="font-semibold text-gray-900 dark:text-white">{halaqa.teacher?.fullName || "—"}</p>
                <p className="text-xs text-gray-400">{halaqa.teacher?.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date planifiée</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatDate(halaqa.scheduledAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${statusBadge(halaqa.status)}`}>
                  {halaqa.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Session details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-gray-500">Type :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {halaqa.type === "INDIVIDUAL" ? "Individuel" : "Collectif"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Video size={16} className="text-gray-400" />
              <span className="text-gray-500">Mode :</span>
              <span className="font-medium text-gray-900 dark:text-white">{modeLabel(halaqa.mode)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <span className="text-gray-500">Participants :</span>
              <span className="font-medium text-gray-900 dark:text-white">{halaqa.studentIds.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-gray-500">Durée :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {halaqa.duration ? `${halaqa.duration} min` : "—"}
              </span>
            </div>
            {halaqa.group && (
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                <span className="text-gray-500">Groupe :</span>
                <span className="font-medium text-gray-900 dark:text-white">{halaqa.group.name}</span>
              </div>
            )}
            {halaqa.recordingUrl && (
              <div className="flex items-center gap-2">
                <ExternalLink size={16} className="text-gray-400" />
                <span className="text-gray-500">Enregistrement :</span>
                <a href={halaqa.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-tahfidz-green hover:underline">
                  Voir
                </a>
              </div>
            )}
          </div>

          {/* Join button for live sessions */}
          {halaqa.status === "LIVE" && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Link
                href={`/halaqa/room?meetingID=${halaqa.meetingID}&name=${encodeURIComponent(session.user.name || "Admin")}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
              >
                <PlayCircle size={16} />
                Rejoindre la séance en direct
              </Link>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={20} className="text-tahfidz-green" />
              Participants ({students.length})
            </h2>
          </div>
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Nom</th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Évaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {students.map((stu) => {
                    const eval_ = halaqa.evaluations.find((e) => e.studentId === stu.id)
                    return (
                      <tr key={stu.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{stu.fullName}</td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{stu.email || "—"}</td>
                        <td className="px-6 py-3">
                          {eval_ ? (
                            <span className="text-tahfidz-green font-medium">
                              {eval_.memorizationScore ?? "—"} / {eval_.tajweedScore ?? "—"} / {eval_.fluencyScore ?? "—"}
                            </span>
                          ) : (
                            <span className="text-gray-400">Non évalué</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Aucun participant</div>
          )}
        </div>

        {/* Evaluations */}
        {halaqa.evaluations.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-tahfidz-green" />
                Évaluations ({halaqa.evaluations.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Élève</th>
                    <th className="text-left px-6 py-3 font-medium">Mémorisation</th>
                    <th className="text-left px-6 py-3 font-medium">Tajweed</th>
                    <th className="text-left px-6 py-3 font-medium">Fluidité</th>
                    <th className="text-left px-6 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {halaqa.evaluations.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                        {ev.student?.fullName || "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{ev.memorizationScore ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{ev.tajweedScore ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{ev.fluencyScore ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{ev.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
