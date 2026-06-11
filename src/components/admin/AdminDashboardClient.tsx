"use client"
// src/components/admin/AdminDashboardClient.tsx

import { useLanguage } from "@/contexts/LanguageContext"
import { Users, BookOpen, GraduationCap, TrendingUp, Star, Bug } from "lucide-react"
import { useState } from "react"
import { FeedbackModal } from "@/components/shared/FeedbackModal"

interface Evaluation {
  id: string
  finalScore: number
  evaluatedAt: Date
  student: { user: { fullName: string } }
  teacher: { user: { fullName: string } }
  progress: { surah: { nameFr: string; nameAr: string } }
}

interface Announcement {
  id: string
  title: string
  type: string
  isPinned: boolean
  createdAt: Date
  author: { fullName: string }
}

interface Props {
  userName: string
  userEmail: string
  totalStudents: number
  totalTeachers: number
  totalParents: number
  totalGroups: number
  activeProgress: number
  memorizedCount: number
  recentEvaluations: Evaluation[]
  recentAnnouncements: Announcement[]
  todayDate: string
}

export function AdminDashboardClient({
  userName, userEmail, totalStudents, totalTeachers, totalParents, totalGroups,
  activeProgress, memorizedCount, recentEvaluations, recentAnnouncements, todayDate,
}: Props) {
  const { locale, useT: tFn } = useLanguage()
  const tD  = (k: string) => tFn("dashboard", k)
  const _tC  = (k: string) => tFn("common", k)
  const _tS  = (k: string) => tFn("students", k)
  const tT  = (k: string) => tFn("teachers", k)
  const _tG  = (k: string) => tFn("groups", k)
  const _tM  = (k: string) => tFn("memorization", k)
  const _tEv = (k: string) => tFn("evaluations", k)
  const _tMs = (k: string) => tFn("messaging", k)

  const statCards = [
    { labelKey: "activeStudents",  value: totalStudents,  icon: GraduationCap, color: "text-tahfidz-green", bg: "bg-tahfidz-green-light",
      label: locale === "ar" ? "الطلاب النشطون" : locale === "en" ? "Active students" : "Élèves actifs" },
    { labelKey: "teachers",        value: totalTeachers,  icon: Users,          color: "text-blue-600",      bg: "bg-blue-50",
      label: tT("title").split(" ")[0] === "Teacher" ? "Teachers" : locale === "ar" ? "المعلمون" : locale === "en" ? "Teachers" : "Enseignants" },
    { labelKey: "parents",         value: totalParents,   icon: Users,          color: "text-orange-600",    bg: "bg-orange-50",
      label: locale === "ar" ? "أولياء الأمور" : locale === "en" ? "Parents" : "Parents" },
    { labelKey: "activeGroups",    value: totalGroups,    icon: BookOpen,       color: "text-purple-600",    bg: "bg-purple-50",
      label: locale === "ar" ? "المجموعات النشطة" : locale === "en" ? "Active groups" : "Groupes actifs" },
    { labelKey: "inProgress",      value: activeProgress, icon: TrendingUp,     color: "text-yellow-600",    bg: "bg-yellow-50",
      label: locale === "ar" ? "الحفظ الجاري" : locale === "en" ? "In progress" : "Mémorisations en cours" },
    { labelKey: "memorized",       value: memorizedCount, icon: Star,           color: "text-tahfidz-gold",  bg: "bg-tahfidz-gold-light",
      label: locale === "ar" ? "السور المحفوظة" : locale === "en" ? "Surahs memorized" : "Sourates mémorisées" },
  ]

  const annTypeLabel = (type: string) => {
    if (locale === "ar") {
      return type === "URGENT" ? "عاجل" : type === "EVENT" ? "حدث" : type === "ACHIEVEMENT" ? "إنجاز" : "عام"
    } else if (locale === "en") {
      return type === "URGENT" ? "Urgent" : type === "EVENT" ? "Event" : type === "ACHIEVEMENT" ? "Achievement" : "General"
    }
    return type === "GENERAL" ? "Général" : type === "EVENT" ? "Événement" : type === "ACHIEVEMENT" ? "Réussite" : "Urgent"
  }

  const [showFeedback, setShowFeedback] = useState(false)

  const quickActions = [
    { label: locale === "ar" ? "إضافة طالب" : locale === "en" ? "Add student" : "Ajouter un élève",      href: "/admin/students/new",  icon: "🎓" },
    { label: locale === "ar" ? "إضافة معلم" : locale === "en" ? "Add teacher" : "Ajouter un enseignant",  href: "/admin/teachers/new",  icon: "👩‍🏫" },
    { label: locale === "ar" ? "إنشاء مجموعة" : locale === "en" ? "Create group" : "Créer un groupe",    href: "/admin/groups/new",    icon: "👥" },
    { label: locale === "ar" ? "سجل الحضور" : locale === "en" ? "Attendance" : "Voir les présences",      href: "/admin/attendance",    icon: "📋" },
  ]

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tD("title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {locale === "ar" ? `مرحباً، ${userName}` : locale === "en" ? `Welcome, ${userName}` : `Bienvenue, ${userName}`}
            {" · "}{todayDate}
          </p>
        </div>
        <button
          onClick={() => setShowFeedback(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium hover:bg-red-100 transition"
          title={locale === "ar" ? "الإبلاغ عن مشكلة" : locale === "en" ? "Report issue" : "Signaler un problème"}
        >
          <Bug size={14} />
          <span className="hidden sm:inline">{locale === "ar" ? "إبلاغ" : locale === "en" ? "Report" : "Signaler"}</span>
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.labelKey} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
            <div className={`inline-flex p-2.5 rounded-lg ${card.bg} mb-3`}>
              <card.icon size={20} className={card.color} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évaluations récentes */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              {locale === "ar" ? "التقييمات الأخيرة" : locale === "en" ? "Recent evaluations" : "Évaluations récentes"}
            </h2>
            <a href="/admin/evaluations" className="text-xs text-tahfidz-green hover:underline">
              {locale === "ar" ? "عرض الكل ←" : locale === "en" ? "See all →" : "Voir tout →"}
            </a>
          </div>
          <div className="space-y-3">
            {recentEvaluations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {locale === "ar" ? "لا توجد تقييمات حديثة" : locale === "en" ? "No recent evaluations" : "Aucune évaluation récente"}
              </p>
            ) : (
              recentEvaluations.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ev.student.user.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {ev.progress.surah.nameFr}
                      <span className="arabic mx-1 text-tahfidz-green text-xs">{ev.progress.surah.nameAr}</span>
                      · {locale === "ar" ? "بواسطة" : locale === "en" ? "by" : "par"} {ev.teacher.user.fullName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${ev.finalScore >= 75 ? "text-green-600" : ev.finalScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                      {ev.finalScore}/100
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Annonces récentes */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              {locale === "ar" ? "الإعلانات الأخيرة" : locale === "en" ? "Recent announcements" : "Annonces récentes"}
            </h2>
            <a href="/admin/announcements" className="text-xs text-tahfidz-green hover:underline">
              {locale === "ar" ? "إدارة ←" : locale === "en" ? "Manage →" : "Gérer →"}
            </a>
          </div>
          <div className="space-y-3">
            {recentAnnouncements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {locale === "ar" ? "لا توجد إعلانات" : locale === "en" ? "No announcements" : "Aucune annonce"}
              </p>
            ) : (
              recentAnnouncements.map((ann) => (
                <div key={ann.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{ann.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{ann.author.fullName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      ann.type === "URGENT" ? "bg-red-100 text-red-700" :
                      ann.type === "EVENT"  ? "bg-blue-100 text-blue-700" :
                      ann.type === "ACHIEVEMENT" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {annTypeLabel(ann.type)}
                    </span>
                  </div>
                  {ann.isPinned && (
                    <p className="text-xs text-tahfidz-green mt-1">
                      📌 {locale === "ar" ? "مثبَّت" : locale === "en" ? "Pinned" : "Épinglé"}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
          <a href="/admin/announcements/new"
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-tahfidz-green text-tahfidz-green text-sm rounded-lg hover:bg-tahfidz-green-light transition">
            + {locale === "ar" ? "إعلان جديد" : locale === "en" ? "New announcement" : "Nouvelle annonce"}
          </a>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {locale === "ar" ? "إجراءات سريعة" : locale === "en" ? "Quick actions" : "Actions rapides"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <a key={action.href} href={action.href}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-tahfidz-green-light rounded-lg transition group">
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-tahfidz-green font-medium">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        userRole="ADMIN"
        userName={userName}
        userEmail={userEmail} 
        schoolName={undefined}
      />
    </div>
  )
}