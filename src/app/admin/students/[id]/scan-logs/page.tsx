import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, Record<string, string>> = {
  fr: {
    SUCCESS: "Succès",
    INVALID_TOKEN: "Token invalide",
    INVALID_HMAC: "HMAC invalide",
    EXPIRED_HMAC: "QR expiré",
    ALREADY_PRESENT: "Déjà présent",
    UNAUTHORIZED_TEACHER: "Enseignant non autorisé",
    RATE_LIMITED: "Trop de requêtes",
    UNKNOWN_ERROR: "Erreur inconnue",
  },
  en: {
    SUCCESS: "Success",
    INVALID_TOKEN: "Invalid token",
    INVALID_HMAC: "Invalid HMAC",
    EXPIRED_HMAC: "Expired QR",
    ALREADY_PRESENT: "Already present",
    UNAUTHORIZED_TEACHER: "Unauthorized teacher",
    RATE_LIMITED: "Rate limited",
    UNKNOWN_ERROR: "Unknown error",
  },
  ar: {
    SUCCESS: "نجاح",
    INVALID_TOKEN: "رمز غير صالح",
    INVALID_HMAC: "HMAC غير صالح",
    EXPIRED_HMAC: "الرمز منتهي",
    ALREADY_PRESENT: "تم تسجيل الحضور مسبقاً",
    UNAUTHORIZED_TEACHER: "معلم غير مصرح",
    RATE_LIMITED: "عدد كبير من المحاولات",
    UNKNOWN_ERROR: "خطأ غير معروف",
  },
}

export default async function StudentScanLogsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) redirect("/login")

  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { schoolId: true, fullName: true } } },
  })

  if (!student) notFound()
  if (session.user.role === "ADMIN" && student.user.schoolId !== session.user.schoolId) {
    redirect("/login")
  }

  const logs = await prisma.qrScanLog.findMany({
    where: { studentId: id },
    orderBy: { scannedAt: "desc" },
    take: 100,
  })

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link
          href={`/admin/students/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-tahfidz-green transition"
        >
          <ArrowLeft size={16} />
          Retour à la fiche
        </Link>
        <h1 className="text-2xl font-bold mt-4">Historique des scans — {student.user.fullName}</h1>
        <p className="text-sm text-gray-500">{logs.length} scan(s) enregistré(s)</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-start">Date</th>
              <th className="px-4 py-3 text-start">Statut</th>
              <th className="px-4 py-3 text-start">IP</th>
              <th className="px-4 py-3 text-start">User-Agent</th>
              <th className="px-4 py-3 text-start">Motif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(log.scannedAt).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === "SUCCESS"
                        ? "bg-green-100 text-green-700"
                        : log.status === "ALREADY_PRESENT"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {STATUS_LABEL.fr[log.status] ?? log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ipAddress || "—"}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={log.userAgent ?? undefined}>
                  {log.userAgent || "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">{log.errorReason || "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Aucun scan enregistré pour cet élève.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
