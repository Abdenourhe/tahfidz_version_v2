// src/lib/i18n/translations.ts
// Dictionnaire de traductions FR / EN / AR pour toute l'application TAHFIDZ

export type Locale = "fr" | "en" | "ar"

export const translations = {
  // ─── Navigation Sidebar ───────────────────────────────────────────
  nav: {
    dashboard:      { fr: "Tableau de bord",  en: "Dashboard",        ar: "لوحة التحكم" },
    teachers:       { fr: "Enseignants",       en: "Teachers",         ar: "المعلمون" },
    students:       { fr: "Élèves",            en: "Students",         ar: "الطلاب" },
    parents:        { fr: "Parents",           en: "Parents",          ar: "أولياء الأمور" },
    groups:         { fr: "Groupes",           en: "Groups",           ar: "المجموعات" },
    memorization:   { fr: "Mémorisation",      en: "Memorization",     ar: "الحفظ" },
    attendance:     { fr: "Présences",         en: "Attendance",       ar: "الحضور" },
    evaluations:    { fr: "Évaluations",       en: "Evaluations",      ar: "التقييمات" },
    messaging:      { fr: "Messagerie",        en: "Messaging",        ar: "المراسلة" },
    settings:       { fr: "Paramètres",        en: "Settings",         ar: "الإعدادات" },
    certificates:   { fr: "Certificats",       en: "Certificates",     ar: "الشهادات" },
    reports:        { fr: "Rapports",          en: "Reports",          ar: "التقارير" },
    // Sections
    management:     { fr: "Gestion",           en: "Management",       ar: "الإدارة" },
    academic:       { fr: "Pédagogie",         en: "Academic",         ar: "الأكاديمية" },
    system:         { fr: "Système",           en: "System",           ar: "النظام" },
  },

  // ─── Actions communes ─────────────────────────────────────────────
  common: {
    save:           { fr: "Enregistrer",       en: "Save",             ar: "حفظ" },
    cancel:         { fr: "Annuler",           en: "Cancel",           ar: "إلغاء" },
    delete:         { fr: "Supprimer",         en: "Delete",           ar: "حذف" },
    edit:           { fr: "Modifier",          en: "Edit",             ar: "تعديل" },
    add:            { fr: "Ajouter",           en: "Add",              ar: "إضافة" },
    search:         { fr: "Rechercher",        en: "Search",           ar: "بحث" },
    filter:         { fr: "Filtrer",           en: "Filter",           ar: "تصفية" },
    export:         { fr: "Exporter",          en: "Export",           ar: "تصدير" },
    print:          { fr: "Imprimer",          en: "Print",            ar: "طباعة" },
    close:          { fr: "Fermer",            en: "Close",            ar: "إغلاق" },
    confirm:        { fr: "Confirmer",         en: "Confirm",          ar: "تأكيد" },
    yes:            { fr: "Oui",               en: "Yes",              ar: "نعم" },
    no:             { fr: "Non",               en: "No",               ar: "لا" },
    loading:        { fr: "Chargement…",       en: "Loading…",         ar: "جارٍ التحميل…" },
    saved:          { fr: "Sauvegardé !",      en: "Saved!",           ar: "تم الحفظ!" },
    error:          { fr: "Erreur",            en: "Error",            ar: "خطأ" },
    success:        { fr: "Succès",            en: "Success",          ar: "نجاح" },
    noData:         { fr: "Aucune donnée",     en: "No data",          ar: "لا توجد بيانات" },
    required:       { fr: "Obligatoire",       en: "Required",         ar: "مطلوب" },
    total:          { fr: "Total",             en: "Total",            ar: "المجموع" },
    actions:        { fr: "Actions",           en: "Actions",          ar: "الإجراءات" },
    details:        { fr: "Détails",           en: "Details",          ar: "التفاصيل" },
    back:           { fr: "Retour",            en: "Back",             ar: "رجوع" },
    view:           { fr: "Voir",              en: "View",             ar: "عرض" },
    name:           { fr: "Nom",               en: "Name",             ar: "الاسم" },
    email:          { fr: "Email",             en: "Email",            ar: "البريد الإلكتروني" },
    phone:          { fr: "Téléphone",         en: "Phone",            ar: "الهاتف" },
    date:           { fr: "Date",              en: "Date",             ar: "التاريخ" },
    status:         { fr: "Statut",            en: "Status",           ar: "الحالة" },
    active:         { fr: "Actif",             en: "Active",           ar: "نشط" },
    inactive:       { fr: "Inactif",           en: "Inactive",         ar: "غير نشط" },
  },

  // ─── Paramètres / Settings ────────────────────────────────────────
  settings: {
    title:          { fr: "Paramètres",                 en: "Settings",                    ar: "الإعدادات" },
    subtitle:       { fr: "Gérez votre compte et les préférences", en: "Manage your account and preferences", ar: "إدارة حسابك وتفضيلاتك" },
    // Tabs
    profile:        { fr: "Profil",                     en: "Profile",                     ar: "الملف الشخصي" },
    security:       { fr: "Sécurité",                   en: "Security",                    ar: "الأمان" },
    school:         { fr: "École",                      en: "School",                      ar: "المدرسة" },
    appearance:     { fr: "Apparence",                  en: "Appearance",                  ar: "المظهر" },
    notifications:  { fr: "Notifications",              en: "Notifications",               ar: "الإشعارات" },
    system:         { fr: "Système",                    en: "System",                      ar: "النظام" },
    // Profile
    personalInfo:   { fr: "Informations personnelles",  en: "Personal Information",        ar: "المعلومات الشخصية" },
    fullName:       { fr: "Nom complet",                en: "Full name",                   ar: "الاسم الكامل" },
    fullNameAr:     { fr: "Nom (arabe)",                en: "Name (Arabic)",               ar: "الاسم بالعربية" },
    administrator:  { fr: "Administrateur",             en: "Administrator",               ar: "مدير" },
    teacher:        { fr: "Enseignant",                 en: "Teacher",                     ar: "معلم" },
    parent:         { fr: "Parent",                     en: "Parent",                      ar: "ولي الأمر" },
    student:        { fr: "Élève",                      en: "Student",                     ar: "طالب" },
    // Security
    changePassword: { fr: "Changer le mot de passe",   en: "Change password",             ar: "تغيير كلمة المرور" },
    currentPwd:     { fr: "Mot de passe actuel",        en: "Current password",            ar: "كلمة المرور الحالية" },
    newPwd:         { fr: "Nouveau mot de passe",       en: "New password",                ar: "كلمة المرور الجديدة" },
    confirmPwd:     { fr: "Confirmer",                  en: "Confirm",                     ar: "تأكيد" },
    pwdMismatch:    { fr: "Les mots de passe ne correspondent pas", en: "Passwords do not match", ar: "كلمتا المرور غير متطابقتين" },
    pwdMinLength:   { fr: "Minimum 8 caractères",       en: "Minimum 8 characters",        ar: "8 أحرف على الأقل" },
    pwdUpdated:     { fr: "Mis à jour !",               en: "Updated!",                    ar: "تم التحديث!" },
    change:         { fr: "Changer",                    en: "Change",                      ar: "تغيير" },
    // Appearance
    appearanceTitle: { fr: "Apparence",                 en: "Appearance",                  ar: "المظهر" },
    language:       { fr: "Langue / Language / اللغة",  en: "Language / Langue / اللغة",   ar: "اللغة / Language / Langue" },
    langArabicNote: { fr: "L'arabe active automatiquement le mode RTL", en: "Arabic automatically enables RTL mode", ar: "العربية تفعّل وضع RTL تلقائياً" },
    theme:          { fr: "Thème",                      en: "Theme",                       ar: "السمة" },
    lightMode:      { fr: "Mode clair",                 en: "Light mode",                  ar: "الوضع الفاتح" },
    lightModeDesc:  { fr: "Interface blanche et claire",en: "Clean white interface",       ar: "واجهة بيضاء نظيفة" },
    darkMode:       { fr: "Mode sombre",                en: "Dark mode",                   ar: "الوضع الداكن" },
    darkModeDesc:   { fr: "Interface sombre pour les yeux", en: "Easy on the eyes",        ar: "مريح للعيون" },
    tvMode:         { fr: "Mode affichage TV / Projecteur", en: "TV / Projector display",  ar: "عرض التلفاز / البروجيكتور" },
    tvModeDesc:     { fr: "Affichez le classement pour motiver les élèves.", en: "Display the leaderboard to motivate students.", ar: "عرض الترتيب لتحفيز الطلاب." },
    openTv:         { fr: "Ouvrir le classement TV",    en: "Open TV leaderboard",         ar: "فتح شاشة الترتيب" },
    themeApplied:   { fr: "Thème",                      en: "Theme",                       ar: "السمة" },
    themeLight:     { fr: "clair appliqué !",           en: "light applied!",              ar: "الفاتح مُفعّل!" },
    themeDark:      { fr: "sombre appliqué !",          en: "dark applied!",               ar: "الداكن مُفعّل!" },
    // School / Logo
    schoolLogo:     { fr: "Logo de l'école",            en: "School logo",                 ar: "شعار المدرسة" },
    schoolLogoDesc: { fr: "Ce logo apparaîtra sur les certificats imprimés.", en: "This logo will appear on printed certificates.", ar: "سيظهر هذا الشعار على الشهادات المطبوعة." },
    noLogo:         { fr: "Aucun logo",                 en: "No logo",                     ar: "لا يوجد شعار" },
    chooseLogo:     { fr: "Choisir un logo",            en: "Choose a logo",               ar: "اختر شعاراً" },
    changeLogo:     { fr: "Changer le logo",            en: "Change logo",                 ar: "تغيير الشعار" },
    deleteLogo:     { fr: "Supprimer",                  en: "Delete",                      ar: "حذف" },
    logoUpdated:    { fr: "Logo mis à jour avec succès !", en: "Logo updated successfully!", ar: "تم تحديث الشعار بنجاح!" },
    logoDeleted:    { fr: "Logo supprimé.",             en: "Logo deleted.",               ar: "تم حذف الشعار." },
    fileSelected:   { fr: "Fichier sélectionné :",      en: "File selected:",              ar: "الملف المحدد:" },
    formats:        { fr: "Formats acceptés : PNG, JPG, WEBP, SVG", en: "Accepted formats: PNG, JPG, WEBP, SVG", ar: "الصيغ المقبولة: PNG, JPG, WEBP, SVG" },
    // Notifications
    notifTitle:     { fr: "Préférences de notifications", en: "Notification preferences",  ar: "تفضيلات الإشعارات" },
    notifSubtitle:  { fr: "Choisissez les événements à notifier", en: "Choose which events to be notified about", ar: "اختر الأحداث التي تريد الإشعار بها" },
    savePrefs:      { fr: "Enregistrer les préférences", en: "Save preferences",           ar: "حفظ التفضيلات" },
  },

  // ─── Dashboard ────────────────────────────────────────────────────
  dashboard: {
    title:          { fr: "Tableau de bord",            en: "Dashboard",                   ar: "لوحة التحكم" },
    welcome:        { fr: "Bienvenue",                  en: "Welcome",                     ar: "مرحباً" },
    totalStudents:  { fr: "Total élèves",               en: "Total students",              ar: "إجمالي الطلاب" },
    totalTeachers:  { fr: "Total enseignants",          en: "Total teachers",              ar: "إجمالي المعلمين" },
    totalGroups:    { fr: "Total groupes",              en: "Total groups",                ar: "إجمالي المجموعات" },
    todayAttendance:{ fr: "Présences aujourd'hui",      en: "Today's attendance",          ar: "الحضور اليوم" },
    recentActivity: { fr: "Activité récente",           en: "Recent activity",             ar: "النشاط الأخير" },
  },

  // ─── Élèves / Students ────────────────────────────────────────────
  students: {
    title:          { fr: "Gestion des élèves",         en: "Student management",          ar: "إدارة الطلاب" },
    add:            { fr: "Ajouter un élève",           en: "Add student",                 ar: "إضافة طالب" },
    firstName:      { fr: "Prénom",                     en: "First name",                  ar: "الاسم الأول" },
    lastName:       { fr: "Nom",                        en: "Last name",                   ar: "الاسم الأخير" },
    dateOfBirth:    { fr: "Date de naissance",          en: "Date of birth",               ar: "تاريخ الميلاد" },
    group:          { fr: "Groupe",                     en: "Group",                       ar: "المجموعة" },
    level:          { fr: "Niveau",                     en: "Level",                       ar: "المستوى" },
    certificate:    { fr: "Certificat",                 en: "Certificate",                 ar: "الشهادة" },
    printCert:      { fr: "Imprimer le certificat",     en: "Print certificate",           ar: "طباعة الشهادة" },
    memorizedVerses:{ fr: "Versets mémorisés",          en: "Memorized verses",            ar: "الآيات المحفوظة" },
    attendance:     { fr: "Présences",                  en: "Attendance",                  ar: "الحضور" },
    progress:       { fr: "Progression",                en: "Progress",                    ar: "التقدم" },
  },

  // ─── Enseignants / Teachers ───────────────────────────────────────
  teachers: {
    title:          { fr: "Gestion des enseignants",    en: "Teacher management",          ar: "إدارة المعلمين" },
    add:            { fr: "Ajouter un enseignant",      en: "Add teacher",                 ar: "إضافة معلم" },
    specialization: { fr: "Spécialisation",             en: "Specialization",              ar: "التخصص" },
    assignedGroups: { fr: "Groupes assignés",           en: "Assigned groups",             ar: "المجموعات المخصصة" },
    profile:        { fr: "Profil enseignant",          en: "Teacher profile",             ar: "ملف المعلم" },
  },

  // ─── Parents ──────────────────────────────────────────────────────
  parents: {
    title:          { fr: "Gestion des parents",        en: "Parent management",           ar: "إدارة أولياء الأمور" },
    add:            { fr: "Ajouter un parent",          en: "Add parent",                  ar: "إضافة ولي أمر" },
    linkedStudents: { fr: "Élèves liés",                en: "Linked students",             ar: "الطلاب المرتبطون" },
    profile:        { fr: "Profil parent",              en: "Parent profile",              ar: "ملف ولي الأمر" },
  },

  // ─── Mémorisation / Memorization ─────────────────────────────────
  memorization: {
    title:          { fr: "Mémorisation",               en: "Memorization",                ar: "الحفظ" },
    surah:          { fr: "Sourate",                    en: "Surah",                       ar: "السورة" },
    verses:         { fr: "Versets",                    en: "Verses",                      ar: "الآيات" },
    quality:        { fr: "Qualité",                    en: "Quality",                     ar: "الجودة" },
    excellent:      { fr: "Excellent",                  en: "Excellent",                   ar: "ممتاز" },
    good:           { fr: "Bien",                       en: "Good",                        ar: "جيد" },
    average:        { fr: "Moyen",                      en: "Average",                     ar: "متوسط" },
    needsWork:      { fr: "À revoir",                   en: "Needs work",                  ar: "يحتاج مراجعة" },
    validate:       { fr: "Valider",                    en: "Validate",                    ar: "تحقق" },
    validated:      { fr: "Validé",                     en: "Validated",                   ar: "مُحقَّق" },
    pending:        { fr: "En attente",                 en: "Pending",                     ar: "في الانتظار" },
    addRecord:      { fr: "Ajouter une entrée",         en: "Add record",                  ar: "إضافة سجل" },
  },

  // ─── Présences / Attendance ───────────────────────────────────────
  attendance: {
    title:          { fr: "Gestion des présences",      en: "Attendance management",       ar: "إدارة الحضور" },
    present:        { fr: "Présent",                    en: "Present",                     ar: "حاضر" },
    absent:         { fr: "Absent",                     en: "Absent",                      ar: "غائب" },
    late:           { fr: "Retard",                     en: "Late",                        ar: "متأخر" },
    excused:        { fr: "Excusé",                     en: "Excused",                     ar: "معذور" },
    markAttendance: { fr: "Marquer la présence",        en: "Mark attendance",             ar: "تسجيل الحضور" },
    rate:           { fr: "Taux de présence",           en: "Attendance rate",             ar: "معدل الحضور" },
  },

  // ─── Groupes / Groups ─────────────────────────────────────────────
  groups: {
    title:          { fr: "Gestion des groupes",        en: "Group management",            ar: "إدارة المجموعات" },
    add:            { fr: "Ajouter un groupe",          en: "Add group",                   ar: "إضافة مجموعة" },
    capacity:       { fr: "Capacité",                   en: "Capacity",                    ar: "الطاقة الاستيعابية" },
    schedule:       { fr: "Horaire",                    en: "Schedule",                    ar: "الجدول الزمني" },
    beginner:       { fr: "Débutant",                   en: "Beginner",                    ar: "مبتدئ" },
    intermediate:   { fr: "Intermédiaire",              en: "Intermediate",                ar: "متوسط" },
    advanced:       { fr: "Avancé",                     en: "Advanced",                    ar: "متقدم" },
  },

  // ─── Évaluations ─────────────────────────────────────────────────
  evaluations: {
    title:          { fr: "Évaluations",                en: "Evaluations",                 ar: "التقييمات" },
    add:            { fr: "Nouvelle évaluation",        en: "New evaluation",              ar: "تقييم جديد" },
    score:          { fr: "Note",                       en: "Score",                       ar: "الدرجة" },
    outOf:          { fr: "sur",                        en: "out of",                      ar: "من" },
    comment:        { fr: "Commentaire",                en: "Comment",                     ar: "تعليق" },
  },

  // ─── Messagerie / Messaging ───────────────────────────────────────
  messaging: {
    title:          { fr: "Messagerie",                 en: "Messaging",                   ar: "المراسلة" },
    newMessage:     { fr: "Nouveau message",            en: "New message",                 ar: "رسالة جديدة" },
    send:           { fr: "Envoyer",                    en: "Send",                        ar: "إرسال" },
    recipient:      { fr: "Destinataire",               en: "Recipient",                   ar: "المستلم" },
    subject:        { fr: "Objet",                      en: "Subject",                     ar: "الموضوع" },
    message:        { fr: "Message",                    en: "Message",                     ar: "الرسالة" },
    inbox:          { fr: "Boîte de réception",         en: "Inbox",                       ar: "صندوق الوارد" },
    sent:           { fr: "Envoyés",                    en: "Sent",                        ar: "المرسلة" },
  },

  // ─── Logout / Auth ────────────────────────────────────────────────
  auth: {
    logout:         { fr: "Déconnexion",                en: "Logout",                      ar: "تسجيل الخروج" },
    login:          { fr: "Connexion",                  en: "Login",                       ar: "تسجيل الدخول" },
    welcome:        { fr: "Bienvenue sur TAHFIDZ",      en: "Welcome to TAHFIDZ",          ar: "مرحباً بك في تحفيظ" },
  },

  // ─── École ────────────────────────────────────────────────────────
  school: {
    title:          { fr: "École",                      en: "School",                      ar: "المدرسة" },
    name:           { fr: "Nom de l'école",             en: "School name",                 ar: "اسم المدرسة" },
    noSchool:       { fr: "École non définie",          en: "School not defined",          ar: "المدرسة غير محددة" },
  },
} as const

// Type helpers
export type TranslationKey = typeof translations
export type SectionKey = keyof TranslationKey

/** Retourne la traduction pour une clé donnée dans la locale active */
export function t(
  section: SectionKey,
  key: keyof TranslationKey[SectionKey],
  locale: Locale = "fr"
): string {
  const entry = translations[section][key as keyof (typeof translations)[typeof section]]
  if (!entry) return String(key)
  return (entry as Record<Locale, string>)[locale] ?? (entry as Record<Locale, string>).fr ?? String(key)
}
