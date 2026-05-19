"use client"
// src/components/admin/StatsCharts.tsx

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { useLanguage } from "@/contexts/LanguageContext"

type Locale = "fr" | "en" | "ar"

interface StatsChartsProps {
  locale?: Locale
  data: {
    progressByMonth: { status: string; _count: { id: number } }[]
    topSurahsWithNames: { surahId: number; _count: { id: number }; surah?: { nameFr: string; nameAr: string } | null }[]
    evalTrend: { monthFr: string; monthEn: string; monthAr: string; avg: number; count: number; approvalRate: number }[]
    attendanceStats: { status: string; _count: { id: number } }[]
    topStudents: { id: string; totalStars: number; user: { fullName: string }; _count: { memorizedSurahs: number } }[]
    groupStats: { id: string; name: string; _count: { students: number }; teacher: { user: { fullName: string } } }[]
  }
}

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "#E5E7EB",
  IN_PROGRESS: "#3B82F6",
  UNDER_REVIEW: "#F59E0B",
  READY_FOR_RECITATION: "#8B5CF6",
  PENDING_TEACHER_APPROVAL: "#F97316",
  MEMORIZED: "#1D9E75",
  NEEDS_REVISION: "#EF4444",
}

const STATUS_LABELS: Record<string, { fr: string; en: string; ar: string }> = {
  NOT_STARTED:              { fr: "Non commencé",      en: "Not started",    ar: "لم يبدأ" },
  IN_PROGRESS:              { fr: "En cours",          en: "In progress",    ar: "جارٍ" },
  UNDER_REVIEW:             { fr: "En révision",       en: "Under review",   ar: "قيد المراجعة" },
  READY_FOR_RECITATION:     { fr: "Prêt à réciter",    en: "Ready to recite",ar: "جاهز للتسميع" },
  PENDING_TEACHER_APPROVAL: { fr: "En attente",        en: "Pending",        ar: "في الانتظار" },
  MEMORIZED:                { fr: "Mémorisé",          en: "Memorized",      ar: "محفوظ" },
  NEEDS_REVISION:           { fr: "À réviser",         en: "Needs revision", ar: "يحتاج مراجعة" },
}

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: "#1D9E75",
  ABSENT: "#EF4444",
  LATE: "#F59E0B",
  EXCUSED: "#3B82F6",
}

const ATTENDANCE_LABELS: Record<string, { fr: string; en: string; ar: string }> = {
  PRESENT: { fr: "Présent",    en: "Present", ar: "حاضر" },
  ABSENT:  { fr: "Absent",     en: "Absent",  ar: "غائب" },
  LATE:    { fr: "En retard",  en: "Late",    ar: "متأخر" },
  EXCUSED: { fr: "Excusé",     en: "Excused", ar: "معذور" },
}

const UI: Record<string, { fr: string; en: string; ar: string }> = {
  evalTitle:      { fr: "Scores d'évaluation — 6 derniers mois", en: "Evaluation scores — last 6 months", ar: "درجات التقييم — آخر 6 أشهر" },
  evalSub:        { fr: "Score moyen et taux d'approbation par mois", en: "Average score and approval rate by month", ar: "متوسط الدرجة ونسبة القبول شهرياً" },
  evalEmpty:      { fr: "Aucune évaluation sur cette période", en: "No evaluations in this period", ar: "لا توجد تقييمات في هذه الفترة" },
  evalAvg:        { fr: "Score moyen",         en: "Avg score",        ar: "متوسط الدرجة" },
  evalApproval:   { fr: "Taux approbation (%)",en: "Approval rate (%)", ar: "نسبة القبول (%)" },
  avgTooltip:     { fr: "Score moyen",         en: "Avg score",        ar: "متوسط الدرجة" },
  approvalTooltip:{ fr: "Taux approbation",    en: "Approval rate",    ar: "نسبة القبول" },
  memTitle:       { fr: "Répartition mémorisation",     en: "Memorization breakdown",      ar: "توزيع التحفيظ" },
  memSub:         { fr: "Par statut de progression",    en: "By progress status",           ar: "حسب حالة التقدم" },
  noData:         { fr: "Aucune donnée",                en: "No data",                      ar: "لا توجد بيانات" },
  attTitle:       { fr: "Présences globales",            en: "Overall attendance",           ar: "الحضور الإجمالي" },
  attRate:        { fr: "Taux global :",                 en: "Overall rate:",                ar: "النسبة الإجمالية:" },
  topSurahTitle:  { fr: "Top 10 sourates mémorisées",   en: "Top 10 memorized surahs",      ar: "أكثر 10 سور حفظاً" },
  noMemori:       { fr: "Aucune mémorisation",           en: "No memorizations",             ar: "لا يوجد تحفيظ" },
  topStudTitle:   { fr: "Top 5 élèves",                  en: "Top 5 students",               ar: "أفضل 5 طلاب" },
  surahsMem:      { fr: "sourates mémorisées",           en: "surahs memorized",             ar: "سورة محفوظة" },
  groupTitle:     { fr: "Occupation des groupes",        en: "Group occupancy",              ar: "إشغال المجموعات" },
  students:       { fr: "Élèves",                        en: "Students",                     ar: "الطلاب" },
}

export function StatsCharts({ data, locale }: StatsChartsProps) {
  const { locale: ctxLocale } = useLanguage()
  const L: Locale = locale ?? (ctxLocale as Locale) ?? "fr"
  const u = (k: keyof typeof UI) => UI[k][L] ?? UI[k].fr
  const statusLabel = (s: string) => (STATUS_LABELS[s]?.[L] ?? STATUS_LABELS[s]?.fr ?? s)
  const attendanceLabel = (s: string) => (ATTENDANCE_LABELS[s]?.[L] ?? ATTENDANCE_LABELS[s]?.fr ?? s)

  const progressPieData = data.progressByMonth.map(p => ({
    name: statusLabel(p.status),
    value: p._count.id,
    color: STATUS_COLORS[p.status] ?? "#9CA3AF",
  }))

  const topSurahsData = data.topSurahsWithNames.map(s => ({
    name: L === "ar" ? (s.surah?.nameAr ?? `${s.surahId}`) : (s.surah?.nameFr ?? `Sourate ${s.surahId}`),
    count: s._count.id,
  }))

  const attendancePieData = data.attendanceStats.map(a => ({
    name: attendanceLabel(a.status),
    value: a._count.id,
    color: ATTENDANCE_COLORS[a.status] ?? "#9CA3AF",
  }))

  // month name by locale
  const evalTrendLocalized = data.evalTrend.map(e => ({
    ...e,
    month: L === "ar" ? e.monthAr : L === "en" ? e.monthEn : e.monthFr,
  }))

  const totalAttendance = attendancePieData.reduce((acc, d) => acc + d.value, 0)
  const presentCount = data.attendanceStats.find(a => a.status === "PRESENT")?._count.id ?? 0
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Tendance évaluations */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{u("evalTitle")}</h2>
        <p className="text-xs text-gray-400 mb-5">{u("evalSub")}</p>
        {evalTrendLocalized.every(e => e.count === 0) ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            {u("evalEmpty")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evalTrendLocalized} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                formatter={((value: number, name: string) => [
                  name === "avg" ? `${value}/100` : `${value}%`,
                  name === "avg" ? u("avgTooltip") : u("approvalTooltip"),
                ]) as any}
              />
              <Legend formatter={(val: string) => val === "avg" ? u("evalAvg") : u("evalApproval")} />
              <Line type="monotone" dataKey="avg" stroke="#1D9E75" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="approvalRate" stroke="#534AB7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie progression + Pie présences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{u("memTitle")}</h2>
          <p className="text-xs text-gray-400 mb-5">{u("memSub")}</p>
          {progressPieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">{u("noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={progressPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {progressPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {progressPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{d.name}: <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{u("attTitle")}</h2>
          <p className="text-xs text-gray-400 mb-1">{u("attRate")} <strong className="text-tahfidz-green">{attendanceRate}%</strong></p>
          {attendancePieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">{u("noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {attendancePieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {attendancePieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
    
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
