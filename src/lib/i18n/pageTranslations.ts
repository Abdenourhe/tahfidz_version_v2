// src/lib/i18n/pageTranslations.ts
// Traductions page-par-page pour toutes les sections de l'app

export type L = "fr" | "en" | "ar"

export type T3 = { fr: string; en: string; ar: string }

export function pick(t: T3, locale: string): string {
  return t[locale as L] ?? t.fr
}

// ─── Statuts communs ──────────────────────────────────────────────────────────
export const STATUS = {
  active:    { fr: "Actif",         en: "Active",       ar: "نشط" },
  inactive:  { fr: "Inactif",       en: "Inactive",     ar: "غير نشط" },
  present:   { fr: "Présent",       en: "Present",      ar: "حاضر" },
  absent:    { fr: "Absent",        en: "Absent",       ar: "غائب" },
  late:      { fr: "En retard",     en: "Late",         ar: "متأخر" },
  excused:   { fr: "Excusé",        en: "Excused",      ar: "معذور" },
  memorized: { fr: "Mémorisé",      en: "Memorized",    ar: "محفوظ" },
  inProgress:{ fr: "En cours",      en: "In progress",  ar: "جارٍ" },
  pending:   { fr: "En attente",    en: "Pending",      ar: "في الانتظار" },
  revision:  { fr: "À réviser",     en: "Needs revision", ar: "يحتاج مراجعة" },
  ready:     { fr: "Prêt à réciter",en: "Ready to recite", ar: "جاهز للتسميع" },
}

// ─── Niveaux groupe ───────────────────────────────────────────────────────────
export const LEVELS = {
  beginner:     { label: { fr: "Débutant",       en: "Beginner",     ar: "مبتدئ" },     color: "bg-green-100 text-green-700" },
  intermediate: { label: { fr: "Intermédiaire",  en: "Intermediate", ar: "متوسط" },     color: "bg-yellow-100 text-yellow-700" },
  advanced:     { label: { fr: "Avancé",          en: "Advanced",     ar: "متقدم" },     color: "bg-red-100 text-red-700" },
}

// ─── Actions communes ─────────────────────────────────────────────────────────
export const ACTIONS = {
  add:         { fr: "Ajouter",       en: "Add",         ar: "إضافة" },
  edit:        { fr: "Modifier",      en: "Edit",        ar: "تعديل" },
  delete:      { fr: "Supprimer",     en: "Delete",      ar: "حذف" },
  save:        { fr: "Enregistrer",   en: "Save",        ar: "حفظ" },
  cancel:      { fr: "Annuler",       en: "Cancel",      ar: "إلغاء" },
  search:      { fr: "Rechercher…",   en: "Search…",     ar: "بحث…" },
  seeAll:      { fr: "Voir tout →",   en: "See all →",   ar: "← عرض الكل" },
  viewProfile: { fr: "Voir le profil →", en: "View profile →", ar: "← عرض الملف" },
  print:       { fr: "Imprimer",      en: "Print",       ar: "طباعة" },
  export:      { fr: "Exporter",      en: "Export",      ar: "تصدير" },
  validate:    { fr: "Valider",       en: "Validate",    ar: "تحقق" },
  evaluate:    { fr: "Évaluer",       en: "Evaluate",    ar: "تقييم" },
  send:        { fr: "Envoyer",       en: "Send",        ar: "إرسال" },
  prev:        { fr: "← Précédent",   en: "← Previous",  ar: "→ السابق" },
  next:        { fr: "Suivant →",     en: "Next →",      ar: "← التالي" },
  back:        { fr: "← Retour",      en: "← Back",      ar: "→ رجوع" },
  filter:      { fr: "Filtrer",       en: "Filter",      ar: "تصفية" },
  all:         { fr: "Tous",          en: "All",         ar: "الكل" },
  none:        { fr: "Aucun",         en: "None",        ar: "لا شيء" },
}

// ─── Pages Admin ─────────────────────────────────────────────────────────────
export const PAGES = {
  // Parents
  parents: {
    title:       { fr: "Parents",                    en: "Parents",                   ar: "أولياء الأمور" },
    add:         { fr: "Ajouter un parent",          en: "Add parent",                ar: "إضافة ولي أمر" },
    searchPH:    { fr: "Rechercher un parent…",      en: "Search a parent…",          ar: "بحث عن ولي أمر…" },
    none:        { fr: "Aucun parent trouvé",         en: "No parents found",          ar: "لا يوجد أولياء أمور" },
    children:    { fr: "Enfant(s)",                  en: "Child(ren)",                ar: "الأبناء" },
    linked:      { fr: "Lié(s)",                     en: "Linked",                    ar: "مرتبط" },
  },
  // Groups
  groups: {
    title:       { fr: "Groupes",                    en: "Groups",                    ar: "المجموعات" },
    create:      { fr: "Créer un groupe",             en: "Create group",              ar: "إنشاء مجموعة" },
    none:        { fr: "Aucun groupe",               en: "No groups",                 ar: "لا توجد مجموعات" },
    capacity:    { fr: "Capacité",                   en: "Capacity",                  ar: "الطاقة" },
    students:    { fr: "Élèves",                     en: "Students",                  ar: "الطلاب" },
    teacher:     { fr: "Enseignant",                 en: "Teacher",                   ar: "المعلم" },
    totalStars:  { fr: "Étoiles totales",            en: "Total stars",               ar: "مجموع النجوم" },
    noTeacher:   { fr: "Non assigné",                en: "Unassigned",                ar: "غير مُعيَّن" },
    seeGroup:    { fr: "Voir le groupe →",           en: "View group →",              ar: "← عرض المجموعة" },
  },
  // Evaluations
  evaluations: {
    title:       { fr: "Évaluations",               en: "Evaluations",               ar: "التقييمات" },
    none:        { fr: "Aucune évaluation",          en: "No evaluations",            ar: "لا توجد تقييمات" },
    score:       { fr: "Note",                       en: "Score",                     ar: "الدرجة" },
    teacher:     { fr: "Enseignant",                 en: "Teacher",                   ar: "المعلم" },
    student:     { fr: "Élève",                      en: "Student",                   ar: "الطالب" },
    surah:       { fr: "Sourate",                    en: "Surah",                     ar: "السورة" },
    date:        { fr: "Date",                       en: "Date",                      ar: "التاريخ" },
    quality:     { fr: "Qualité",                    en: "Quality",                   ar: "الجودة" },
    excellent:   { fr: "Excellent",                  en: "Excellent",                 ar: "ممتاز" },
    good:        { fr: "Bien",                       en: "Good",                      ar: "جيد" },
    average:     { fr: "Moyen",                      en: "Average",                   ar: "متوسط" },
    needsWork:   { fr: "À revoir",                   en: "Needs work",                ar: "يحتاج مراجعة" },
  },
  // Attendance
  attendance: {
    title:       { fr: "Présences",                  en: "Attendance",                ar: "الحضور" },
    group:       { fr: "Groupe",                     en: "Group",                     ar: "المجموعة" },
    period:      { fr: "Période",                    en: "Period",                    ar: "الفترة" },
    day:         { fr: "Aujourd'hui",                en: "Today",                     ar: "اليوم" },
    week:        { fr: "Cette semaine",              en: "This week",                 ar: "هذا الأسبوع" },
    month:       { fr: "Ce mois",                    en: "This month",                ar: "هذا الشهر" },
    custom:      { fr: "Personnalisé",               en: "Custom",                    ar: "مخصص" },
    exportOne:   { fr: "Exporter ce groupe",         en: "Export this group",         ar: "تصدير هذه المجموعة" },
    exportAll:   { fr: "Exporter tous",              en: "Export all",                ar: "تصدير الكل" },
    from:        { fr: "Du",                         en: "From",                      ar: "من" },
    to:          { fr: "Au",                         en: "To",                        ar: "إلى" },
  },
  // Announcements
  announcements: {
    title:       { fr: "Annonces",                  en: "Announcements",             ar: "الإعلانات" },
    add:         { fr: "Nouvelle annonce",           en: "New announcement",          ar: "إعلان جديد" },
    none:        { fr: "Aucune annonce",             en: "No announcements",          ar: "لا توجد إعلانات" },
    pinned:      { fr: "Épinglé",                    en: "Pinned",                    ar: "مثبَّت" },
    general:     { fr: "Général",                    en: "General",                   ar: "عام" },
    urgent:      { fr: "Urgent",                     en: "Urgent",                    ar: "عاجل" },
    event:       { fr: "Événement",                  en: "Event",                     ar: "حدث" },
    achievement: { fr: "Réussite",                   en: "Achievement",               ar: "إنجاز" },
  },
  // Progress
  progress: {
    title:        { fr: "Progression",               en: "Progress",                  ar: "التقدم" },
    none:         { fr: "Aucune progression",        en: "No progress recorded",      ar: "لا يوجد تقدم مسجَّل" },
    surah:        { fr: "Sourate",                   en: "Surah",                     ar: "السورة" },
    verses:       { fr: "Versets",                   en: "Verses",                    ar: "الآيات" },
    completion:   { fr: "Avancement",                en: "Completion",                ar: "الإتمام" },
    markReady:    { fr: "Marquer prêt",              en: "Mark ready",                ar: "تحديد جاهز" },
  },
  // Badges
  badges: {
    title:        { fr: "Mes badges",                en: "My badges",                 ar: "شاراتي" },
    none:         { fr: "Aucun badge pour le moment",en: "No badges yet",             ar: "لا توجد شارات بعد" },
    earned:       { fr: "Obtenu le",                 en: "Earned on",                 ar: "تم الحصول عليه في" },
  },
  // Notifications
  notifications: {
    title:        { fr: "Notifications",             en: "Notifications",             ar: "الإشعارات" },
    none:         { fr: "Aucune notification",       en: "No notifications",          ar: "لا توجد إشعارات" },
    markRead:     { fr: "Tout marquer comme lu",     en: "Mark all as read",          ar: "تحديد الكل كمقروء" },
    unread:       { fr: "Non lu",                    en: "Unread",                    ar: "غير مقروء" },
  },
  // Profile
  profile: {
    title:        { fr: "Mon profil",                en: "My profile",                ar: "ملفي الشخصي" },
    joinedOn:     { fr: "Membre depuis",             en: "Member since",              ar: "عضو منذ" },
    noGroup:      { fr: "Sans groupe",               en: "No group",                  ar: "بدون مجموعة" },
    noTeacher:    { fr: "Pas d'enseignant",          en: "No teacher",                ar: "بدون معلم" },
  },
}

// Helper: status de mémorisation
export function memStatusLabel(status: string, locale: string): { label: string; bg: string; color: string } {
  const L = locale as "fr" | "en" | "ar"
  const map: Record<string, { label: T3; bg: string; color: string }> = {
    IN_PROGRESS:              { label: { fr: "En cours",        en: "In progress",    ar: "جارٍ" },            bg: "bg-blue-100",   color: "text-blue-700" },
    READY_FOR_RECITATION:     { label: { fr: "Prêt à réciter",  en: "Ready to recite",ar: "جاهز للتسميع" },    bg: "bg-orange-100", color: "text-orange-700" },
    PENDING_TEACHER_APPROVAL: { label: { fr: "En attente",      en: "Pending",        ar: "في الانتظار" },     bg: "bg-yellow-100", color: "text-yellow-700" },
    UNDER_REVIEW:             { label: { fr: "En révision",     en: "Under review",   ar: "قيد المراجعة" },    bg: "bg-purple-100", color: "text-purple-700" },
    NEEDS_REVISION:           { label: { fr: "À réviser",       en: "Needs revision", ar: "يحتاج مراجعة" },   bg: "bg-red-100",    color: "text-red-700" },
    MEMORIZED:                { label: { fr: "Mémorisé",        en: "Memorized",      ar: "محفوظ" },           bg: "bg-green-100",  color: "text-green-700" },
  }
  const entry = map[status] ?? { label: { fr: status, en: status, ar: status }, bg: "bg-gray-100", color: "text-gray-600" }
  return { label: entry.label[L] ?? entry.label.fr, bg: entry.bg, color: entry.color }
}
