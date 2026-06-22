// src/app/admin/halaqa/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Video, Calendar, Users, Play, FileVideo, BarChart3, ArrowLeft, Eye, XCircle } from "lucide-react"
import { DeleteSessionButton } from "@/components/admin/DeleteSessionButton"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function deleteSession(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user?.schoolId) return
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") return

  const id = formData.get("id") as string
  if (!id) return

  await prisma.halaqaSession.delete({
    where: { id, schoolId: session.user.schoolId },
  })
  revalidatePath("/admin/halaqa")
}

async function cancelSession(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user?.schoolId) return
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") return

  const id = formData.get("id") as string
  if (!id) return

  const halaqa = await prisma.halaqaSession.findFirst({
    where: { id, schoolId: session.user.schoolId },
  })
  if (!halaqa || halaqa.status === "ENDED" || halaqa.status === "CANCELLED") return

  await prisma.halaqaSession.update({
    where: { id },
    data: { status: "CANCELLED", endedAt: new Date() },
  })
  revalidatePath("/admin/halaqa")
}

export default async function AdminHalaqaPage() {
  const session = await auth()
  if (!session?.user?.schoolId) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/login")

  const schoolId = session.user.schoolId

  const sessions = await prisma.halaqaSession.findMany({
    where: { schoolId },
    include: {
      teacher: { select: { fullName: true } },
      group: { select: { name: true } },
      evaluations: { select: { id: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 200,
  })

  const now = new Date()
  const upcoming = sessions.filter((s) => new Date(s.scheduledAt) > now && s.status === "SCHEDULED")
  const live = sessions.filter((s) => s.status === "LIVE")
  const past = sessions.filter((s) => s.status === "ENDED")

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      LIVE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse",
      ENDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      CANCELLED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    }
    return map[status] || "bg-gray-100 text-gray-700"
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Video size={28} className="text-tahfidz-green" />
              Halaqa Online
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Toutes les séances de récitation en ligne de l&apos;école
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Séances planifiées", value: upcoming.length, icon: Calendar, color: "text-blue-600" },
            { label: "En direct", value: live.length, icon: Play, color: "text-red-600" },
            { label: "Terminées", value: past.length, icon: FileVideo, color: "text-gray-600" },
            { label: "Total", value: sessions.length, icon: BarChart3, color: "text-tahfidz-green" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Liste */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium">Enseignant</th>
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Participants</th>
                  <th className="text-left px-4 py-3 font-medium">Évaluations</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.meetingName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {s.teacher?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {s.type === "INDIVIDUAL" ? "Individuel" : "Collectif"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatDate(s.scheduledAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {s.studentIds.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {s.evaluations.length > 0 ? (
                        <span className="text-tahfidz-green font-medium">{s.evaluations.length} éval.</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/halaqa/${s.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-tahfidz-green/10 transition"
                          title="Voir"
                        >
                          <Eye size={15} />
                        </Link>
                        {(s.status === "SCHEDULED" || s.status === "LIVE") && (
                          <form action={cancelSession} className="inline">
                            <input type="hidden" name="id" value={s.id} />
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                              title="Annuler"
                            >
                              <XCircle size={15} />
                            </button>
                          </form>
                        )}
                        <form action={deleteSession} className="inline">
                          <input type="hidden" name="id" value={s.id} />
                          <DeleteSessionButton />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <Video size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucune séance Halaqa Online</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
