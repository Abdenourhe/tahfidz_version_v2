"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  BookOpen, Users, GraduationCap, BarChart2, Bell, Megaphone,
  Shield, Smartphone, RefreshCw, Database, Menu, X, Star,
  ChevronRight, Play, Check, Globe, ArrowRight, Monitor,
  UserCheck, BookMarked, FileText, Wifi, Award
} from "lucide-react"

// ─── Traductions ────────────────────────────────────────────────────────────
const t = {
  fr: {
    dir: "ltr",
    nav: {
      home: "Accueil", features: "Fonctionnalités", pricing: "Tarifs",
      demo: "Démo", support: "Support", login: "Connexion", request: "Demander une démo",
    },
    hero: {
      badge: "🎉 Nouveau · Maqra' électronique disponible",
      title: "Gérez votre école coranique",
      titleHighlight: "avec excellence",
      subtitle: "TAHFIDZ est la plateforme cloud complète pour gérer les écoles de mémorisation du Coran — élèves, enseignants, groupes, présences, évaluations et bien plus.",
      cta: "Demander une démo gratuite",
      video: "Voir la démonstration",
      stat1: "Écoles", stat2: "Élèves", stat3: "Enseignants", stat4: "Groupes",
    },
    features: {
      title: "Tout ce dont vous avez besoin",
      subtitle: "Une plateforme complète pensée pour les écoles coraniques modernes",
      items: [
        { icon: GraduationCap, title: "Gestion des élèves & enseignants", desc: "Inscriptions, profils complets, statuts, historique — tout dans un seul endroit." },
        { icon: BookOpen, title: "Gestion des groupes (halaqas)", desc: "Créez et gérez vos halaqas, affectez élèves et enseignants facilement." },
        { icon: Wifi, title: "Maqra' électronique", desc: "Séances virtuelles de récitation en direct — halaqas en ligne, salles individuelles et collectives." },
        { icon: BookMarked, title: "Suivi de la mémorisation", desc: "Suivez l'avancement de chaque élève sourate par sourate, avec notation des erreurs sur le Coran." },
        { icon: BarChart2, title: "Rapports & statistiques", desc: "Rapports écrits et graphiques sur les halaqas, la mémorisation, les présences et les absences." },
        { icon: Megaphone, title: "Annonces & actualités", desc: "Gérez les annonces de l'école et tenez tout le monde informé en temps réel." },
      ],
    },
    users: {
      title: "Une plateforme pour tous",
      subtitle: "Des outils adaptés à chaque rôle",
      items: [
        { icon: Shield, role: "Administrateur", desc: "Vue complète sur l'école, gestion de tous les utilisateurs, rapports et paramètres." },
        { icon: Users, role: "Enseignant", desc: "Gestion de ses groupes, enregistrement des présences, évaluation des récitations." },
        { icon: GraduationCap, role: "Élève", desc: "Suivi de sa progression, consultation de son planning et de ses résultats." },
        { icon: UserCheck, role: "Parent", desc: "Suivi en temps réel de l'avancement de son enfant et réception des notifications." },
      ],
    },
    characteristics: {
      title: "Caractéristiques du système",
      items: [
        { icon: Shield, title: "Sécurité & protection", desc: "Développé selon les meilleures pratiques de sécurité pour protéger les données de vos utilisateurs." },
        { icon: Monitor, title: "Facilité d'utilisation", desc: "Aucune compétence technique requise — une interface claire et intuitive pour tous." },
        { icon: Smartphone, title: "Multi-appareils", desc: "Fonctionne sur tous les systèmes, navigateurs et écrans tactiles, avec une application mobile dédiée." },
        { icon: Bell, title: "Système de notifications", desc: "Alertes et notifications automatiques en temps réel sur les téléphones." },
        { icon: Database, title: "Sauvegarde automatique", desc: "Sauvegarde quotidienne automatique de toutes les données saisies." },
        { icon: RefreshCw, title: "Mises à jour continues", desc: "Améliorations et nouvelles fonctionnalités déployées régulièrement." },
      ],
    },
    pricing: {
      title: "Nos offres",
      subtitle: "Choisissez le plan adapté à la taille de votre école",
      perYear: "/ an",
      perStudent: "/ élève / à vie",
      request: "Demander maintenant",
      plans: [
        {
          name: "Petite école", students: "Moins de 500 élèves",
          schoolPrice: "299", studentPrice: "3", popular: false,
          features: ["Gestion complète des élèves", "Gestion des enseignants", "Halaqas illimitées", "Rapports & statistiques", "Notifications push", "Support technique"],
        },
        {
          name: "École moyenne", students: "500 à 1 000 élèves",
          schoolPrice: "599", studentPrice: "2", popular: true,
          features: ["Tout du plan Petite école", "Priorité support", "Exports PDF avancés", "Tableau de bord enrichi", "Gestion des parents", "API d'intégration"],
        },
        {
          name: "Grande école", students: "Plus de 1 000 élèves",
          schoolPrice: "999", studentPrice: "1", popular: false,
          features: ["Tout du plan Moyen", "Gestionnaire dédié", "Formations personnalisées", "Statistiques avancées", "Multi-campus", "SLA garanti"],
        },
      ],
    },
    stats: {
      title: "TAHFIDZ en chiffres",
      items: [
        { value: 200, label: "Écoles actives", suffix: "+" },
        { value: 20000, label: "Élèves", suffix: "+" },
        { value: 1000, label: "Enseignants", suffix: "+" },
        { value: 1200, label: "Halaqas", suffix: "+" },
      ],
    },
    cta: {
      title: "Vous avez une école coranique ?",
      subtitle: "Rejoignez des centaines d'écoles qui font confiance à TAHFIDZ.",
      button: "Démarrer maintenant — c'est gratuit",
    },
    footer: {
      desc: "TAHFIDZ est la plateforme cloud complète pour gérer les écoles coraniques et les associations de mémorisation du Saint Coran.",
      links: "Liens rapides",
      internal: "Liens internes",
      support: "Support",
      linkItems: ["Accueil", "Tarifs", "Blog", "Demander une démo"],
      internalItems: ["Captures du système", "Captures de l'appli", "Fonctionnalités", "Nos clients"],
      supportItems: ["Documentation", "FAQ", "Contact"],
      copyright: "Tous droits réservés © TAHFIDZ",
      privacy: "Politique de confidentialité",
      terms: "Conditions générales",
    },
  },
  ar: {
    dir: "rtl",
    nav: {
      home: "الرئيسية", features: "المزايا", pricing: "الأسعار",
      demo: "التجربة", support: "الدعم", login: "تسجيل الدخول", request: "طلب نسخة",
    },
    hero: {
      badge: "🎉 جديد · المقرأة الإلكترونية متاحة الآن",
      title: "سيّر مدرستك القرآنية",
      titleHighlight: "باحترافية تامة",
      subtitle: "TAHFIDZ نظام سحابي متكامل لإدارة مدارس تحفيظ القرآن الكريم — الطلاب، المعلمون، الحلقات، الحضور، التقييمات وأكثر.",
      cta: "طلب نسخة تجريبية مجانية",
      video: "شاهد المقطع التعريفي",
      stat1: "مدرسة", stat2: "طالب", stat3: "معلم", stat4: "حلقة",
    },
    features: {
      title: "كل ما تحتاجه في مكان واحد",
      subtitle: "منصة متكاملة مصمّمة للمدارس القرآنية الحديثة",
      items: [
        { icon: GraduationCap, title: "إدارة الطلاب والمعلمين", desc: "التسجيل، الملفات الكاملة، الحالات، السجل التاريخي — كل شيء في مكان واحد." },
        { icon: BookOpen, title: "إدارة الحلقات", desc: "أنشئ حلقاتك وادارها، وأسند الطلاب والمعلمين بكل سهولة." },
        { icon: Wifi, title: "المقرأة الإلكترونية", desc: "جلسات تلاوة مباشرة افتراضية — حلقات عبر الإنترنت، غرف فردية وجماعية." },
        { icon: BookMarked, title: "متابعة الحفظ والمراجعة", desc: "تابع تقدم كل طالب سورة بسورة مع تسجيل الأخطاء على المصحف." },
        { icon: BarChart2, title: "التقارير والإحصاءات", desc: "تقارير شاملة حول الحلقات والحفظ والحضور والغياب." },
        { icon: Megaphone, title: "الإعلانات والأخبار", desc: "أدر إعلانات المدرسة وأبقِ الجميع على اطلاع دائم." },
      ],
    },
    users: {
      title: "منصة للجميع",
      subtitle: "أدوات مخصصة لكل دور",
      items: [
        { icon: Shield, role: "المشرف", desc: "رؤية شاملة للمدرسة وإدارة جميع المستخدمين والتقارير والإعدادات." },
        { icon: Users, role: "المعلم", desc: "إدارة حلقاته وتسجيل الحضور وتقييم التلاوات." },
        { icon: GraduationCap, role: "الطالب", desc: "متابعة تقدمه والاطلاع على جدوله ونتائجه." },
        { icon: UserCheck, role: "ولي الأمر", desc: "متابعة تقدم ابنه في الوقت الفعلي وتلقي الإشعارات." },
      ],
    },
    characteristics: {
      title: "خصائص النظام",
      items: [
        { icon: Shield, title: "الأمن والحماية", desc: "تطوير وفق أفضل الممارسات التقنية لحماية بيانات مستخدميك." },
        { icon: Monitor, title: "سهولة الاستخدام", desc: "لا تتطلب أي مهارات تقنية — واجهة واضحة وبديهية للجميع." },
        { icon: Smartphone, title: "توافق مع الأجهزة", desc: "يعمل على جميع الأنظمة والمتصفحات وشاشات اللمس مع تطبيق خاص." },
        { icon: Bell, title: "نظام التنبيهات", desc: "تنبيهات وإشعارات آنية تلقائية على الهواتف." },
        { icon: Database, title: "نسخ احتياطي", desc: "نسخ احتياطي يومي تلقائي لجميع البيانات المدخلة." },
        { icon: RefreshCw, title: "تحديث مستمر", desc: "تحديثات وتطويرات مستمرة يستفيد منها المستخدمون دورياً." },
      ],
    },
    pricing: {
      title: "عروضنا الأساسية",
      subtitle: "اختر الخطة المناسبة لحجم مدرستك",
      perYear: "/ سنوياً",
      perStudent: "/ طالب / مدى الحياة",
      request: "طلب نسخة",
      plans: [
        {
          name: "المدرسة الصغيرة", students: "أقل من 500 طالب",
          schoolPrice: "299", studentPrice: "3", popular: false,
          features: ["إدارة كاملة للطلاب", "إدارة المعلمين", "حلقات غير محدودة", "تقارير وإحصاءات", "إشعارات فورية", "دعم فني"],
        },
        {
          name: "المدرسة المتوسطة", students: "500 إلى 1000 طالب",
          schoolPrice: "599", studentPrice: "2", popular: true,
          features: ["كل مزايا الخطة الصغيرة", "أولوية في الدعم", "تصدير PDF متقدم", "لوحة تحكم محسّنة", "إدارة أولياء الأمور", "واجهة API"],
        },
        {
          name: "المدرسة الكبيرة", students: "أكثر من 1000 طالب",
          schoolPrice: "999", studentPrice: "1", popular: false,
          features: ["كل مزايا الخطة المتوسطة", "مدير مخصص", "تدريب شخصي", "إحصاءات متقدمة", "متعدد الفروع", "ضمان الخدمة"],
        },
      ],
    },
    stats: {
      title: "TAHFIDZ بالأرقام",
      items: [
        { value: 200, label: "مدرسة", suffix: "+" },
        { value: 20000, label: "طالب", suffix: "+" },
        { value: 1000, label: "معلم", suffix: "+" },
        { value: 1200, label: "حلقة", suffix: "+" },
      ],
    },
    cta: {
      title: "لديكم مدرسة قرآنية؟",
      subtitle: "انضموا إلى مئات المدارس التي تثق في TAHFIDZ.",
      button: "ابدأ الآن — مجاناً",
    },
    footer: {
      desc: "TAHFIDZ نظام سحابي متكامل لإدارة المدارس القرآنية وجمعيات تحفيظ القرآن الكريم.",
      links: "روابط سريعة",
      internal: "روابط داخلية",
      support: "الدعم الفني",
      linkItems: ["الرئيسية", "الأسعار", "المدونة", "طلب نسخة"],
      internalItems: ["صور من النظام", "صور من التطبيق", "المزايا", "عملاؤنا"],
      supportItems: ["الشروحات", "الأسئلة الشائعة", "التواصل"],
      copyright: "جميع الحقوق محفوظة © TAHFIDZ",
      privacy: "سياسة الخصوصية",
      terms: "الأحكام والشروط",
    },
  },
  en: {
    dir: "ltr",
    nav: {
      home: "Home", features: "Features", pricing: "Pricing",
      demo: "Demo", support: "Support", login: "Sign In", request: "Request Demo",
    },
    hero: {
      badge: "🎉 New · Electronic Maqra' is now live",
      title: "Manage your Quran school",
      titleHighlight: "with excellence",
      subtitle: "TAHFIDZ is the complete cloud platform for managing Quran memorization schools — students, teachers, groups, attendance, evaluations and more.",
      cta: "Request a free demo",
      video: "Watch the demo",
      stat1: "Schools", stat2: "Students", stat3: "Teachers", stat4: "Groups",
    },
    features: {
      title: "Everything you need",
      subtitle: "A complete platform designed for modern Quran schools",
      items: [
        { icon: GraduationCap, title: "Student & Teacher Management", desc: "Registrations, full profiles, statuses, history — all in one place." },
        { icon: BookOpen, title: "Group (Halaqa) Management", desc: "Create and manage your halaqas, assign students and teachers easily." },
        { icon: Wifi, title: "Electronic Maqra'", desc: "Live virtual recitation sessions — online halaqas, individual and group rooms." },
        { icon: BookMarked, title: "Memorization Tracking", desc: "Track each student's progress surah by surah with error marking on the Quran." },
        { icon: BarChart2, title: "Reports & Statistics", desc: "Comprehensive reports on halaqas, memorization, attendance and absences." },
        { icon: Megaphone, title: "Announcements & News", desc: "Manage school announcements and keep everyone informed in real time." },
      ],
    },
    users: {
      title: "A platform for everyone",
      subtitle: "Tools tailored to each role",
      items: [
        { icon: Shield, role: "Administrator", desc: "Full school overview, manage all users, reports and settings." },
        { icon: Users, role: "Teacher", desc: "Manage groups, record attendance, evaluate recitations." },
        { icon: GraduationCap, role: "Student", desc: "Track progress, view schedule and results." },
        { icon: UserCheck, role: "Parent", desc: "Real-time tracking of child's progress and receive notifications." },
      ],
    },
    characteristics: {
      title: "System characteristics",
      items: [
        { icon: Shield, title: "Security & protection", desc: "Developed using best practices to provide the best data protection." },
        { icon: Monitor, title: "Ease of use", desc: "No technical skills required — a clear and intuitive interface for all." },
        { icon: Smartphone, title: "Multi-device", desc: "Works on all systems, browsers and touchscreens with a dedicated mobile app." },
        { icon: Bell, title: "Notification system", desc: "Automatic real-time alerts and notifications on phones." },
        { icon: Database, title: "Auto backup", desc: "Daily automatic backup of all entered data." },
        { icon: RefreshCw, title: "Continuous updates", desc: "Improvements and new features deployed regularly." },
      ],
    },
    pricing: {
      title: "Our plans",
      subtitle: "Choose the plan that fits your school size",
      perYear: "/ year",
      perStudent: "/ student / lifetime",
      request: "Request now",
      plans: [
        {
          name: "Small school", students: "Less than 500 students",
          schoolPrice: "299", studentPrice: "3", popular: false,
          features: ["Full student management", "Teacher management", "Unlimited halaqas", "Reports & statistics", "Push notifications", "Technical support"],
        },
        {
          name: "Medium school", students: "500 to 1,000 students",
          schoolPrice: "599", studentPrice: "2", popular: true,
          features: ["Everything in Small", "Priority support", "Advanced PDF exports", "Enhanced dashboard", "Parent management", "Integration API"],
        },
        {
          name: "Large school", students: "More than 1,000 students",
          schoolPrice: "999", studentPrice: "1", popular: false,
          features: ["Everything in Medium", "Dedicated manager", "Personalized training", "Advanced analytics", "Multi-campus", "SLA guarantee"],
        },
      ],
    },
    stats: {
      title: "TAHFIDZ in numbers",
      items: [
        { value: 200, label: "Active schools", suffix: "+" },
        { value: 20000, label: "Students", suffix: "+" },
        { value: 1000, label: "Teachers", suffix: "+" },
        { value: 1200, label: "Halaqas", suffix: "+" },
      ],
    },
    cta: {
      title: "Do you have a Quran school?",
      subtitle: "Join hundreds of schools that trust TAHFIDZ.",
      button: "Start now — it's free",
    },
    footer: {
      desc: "TAHFIDZ is the complete cloud platform for managing Quran schools and memorization associations.",
      links: "Quick links",
      internal: "Internal links",
      support: "Support",
      linkItems: ["Home", "Pricing", "Blog", "Request Demo"],
      internalItems: ["System Screenshots", "App Screenshots", "Features", "Our Clients"],
      supportItems: ["Documentation", "FAQ", "Contact"],
      copyright: "All rights reserved © TAHFIDZ",
      privacy: "Privacy policy",
      terms: "Terms of service",
    },
  },
}

type Lang = "fr" | "ar" | "en"

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 2000
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) { setCount(target); clearInterval(timer) }
            else setCount(Math.floor(current))
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold text-white">
      {count.toLocaleString()}{suffix}
    </div>
  )
}

// ─── Main Landing Page Component ─────────────────────────────────────────────
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("fr")
  const [menuOpen, setMenuOpen] = useState(false)
  const tr = t[lang]

  return (
    <div dir={tr.dir} className={`min-h-screen bg-white text-gray-900 ${lang === "ar" ? "font-arabic" : "font-sans"}`}>

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">ط</span>
              </div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">TAHFIDZ</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-emerald-600 transition">{tr.nav.features}</a>
              <a href="#pricing" className="hover:text-emerald-600 transition">{tr.nav.pricing}</a>
              <a href="#stats" className="hover:text-emerald-600 transition">{lang === "fr" ? "Chiffres" : lang === "ar" ? "الأرقام" : "Numbers"}</a>
              <a href="#contact" className="hover:text-emerald-600 transition">{tr.nav.support}</a>
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Language switcher */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {(["fr", "ar", "en"] as Lang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${lang === l ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    {l === "fr" ? "FR" : l === "ar" ? "ع" : "EN"}
                  </button>
                ))}
              </div>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition px-3 py-1.5">
                {tr.nav.login}
              </Link>
              <Link href="/login" className="text-sm font-medium bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm">
                {tr.nav.request}
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>{tr.nav.features}</a>
            <a href="#pricing" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>{tr.nav.pricing}</a>
            <a href="#stats" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>{lang === "fr" ? "Chiffres clés" : lang === "ar" ? "الأرقام" : "Key numbers"}</a>
            <div className="flex items-center gap-2 pt-2">
              {(["fr", "ar", "en"] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${lang === l ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-600"}`}>
                  {l === "fr" ? "FR" : l === "ar" ? "ع" : "EN"}
                </button>
              ))}
            </div>
            <Link href="/login" className="block w-full text-center bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium" onClick={() => setMenuOpen(false)}>
              {tr.nav.login}
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-emerald-50 via-white to-white relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              {tr.hero.badge}
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
              {tr.hero.title}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
                {tr.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
              {tr.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 py-3.5 rounded-xl transition shadow-lg shadow-emerald-200"
              >
                {tr.hero.cta}
                <ArrowRight size={16} />
              </Link>
              <a
                href="https://www.youtube.com/watch?v=68t7K68sglg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-emerald-300 text-gray-700 font-semibold px-7 py-3.5 rounded-xl transition"
              >
                <Play size={16} className="text-emerald-600" />
                {tr.hero.video}
              </a>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-3xl mx-auto">
              {[
                { val: "200+", label: tr.hero.stat1 },
                { val: "20K+", label: tr.hero.stat2 },
                { val: "1K+", label: tr.hero.stat3 },
                { val: "1.2K+", label: tr.hero.stat4 },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="text-2xl font-bold text-emerald-700">{s.val}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview placeholder */}
          <div className="mt-14 mx-auto max-w-5xl">
            <div className="rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-white">
              <div className="bg-gray-100 border-b border-gray-200 flex items-center gap-2 px-4 py-3">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="flex-1 mx-4 bg-white rounded border border-gray-200 text-xs text-gray-400 px-3 py-1">tahfidz.app/admin/dashboard</span>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white p-8 min-h-[320px] flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                  {[
                    { label: lang === "fr" ? "Élèves actifs" : lang === "ar" ? "الطلاب النشطون" : "Active Students", val: "342", color: "emerald", icon: "🎓" },
                    { label: lang === "fr" ? "Enseignants" : lang === "ar" ? "المعلمون" : "Teachers", val: "28", color: "blue", icon: "👩‍🏫" },
                    { label: lang === "fr" ? "Halaqas" : lang === "ar" ? "الحلقات" : "Halaqas", val: "14", color: "amber", icon: "📖" },
                    { label: lang === "fr" ? "Présents aujourd'hui" : lang === "ar" ? "حاضرون اليوم" : "Present today", val: "289", color: "purple", icon: "✅" },
                    { label: lang === "fr" ? "Évaluations" : lang === "ar" ? "التقييمات" : "Evaluations", val: "1.2K", color: "rose", icon: "⭐" },
                    { label: lang === "fr" ? "Sourates mémorisées" : lang === "ar" ? "سور محفوظة" : "Memorized Surahs", val: "4.8K", color: "teal", icon: "📜" },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <div className="text-2xl mb-1">{card.icon}</div>
                      <div className="text-xl font-bold text-gray-800">{card.val}</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-tight">{card.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">{lang === "fr" ? "Fonctionnalités" : lang === "ar" ? "المزايا" : "Features"}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">{tr.features.title}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">{tr.features.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tr.features.items.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-4 transition-colors">
                  <f.icon size={22} className="text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USER TYPES ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{tr.users.title}</h2>
            <p className="text-gray-500 mt-3">{tr.users.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {tr.users.items.map((u, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mx-auto mb-4 flex items-center justify-center shadow-md shadow-emerald-200">
                  <u.icon size={26} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{u.role}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHARACTERISTICS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{tr.characteristics.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tr.characteristics.items.map((c, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <c.icon size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{tr.pricing.title}</h2>
            <p className="text-gray-500 mt-3">{tr.pricing.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tr.pricing.plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-7 border-2 transition-all ${plan.popular
                  ? "border-emerald-500 bg-white shadow-xl shadow-emerald-100 scale-105"
                  : "border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
                      {lang === "fr" ? "⭐ Populaire" : lang === "ar" ? "⭐ الأكثر شعبية" : "⭐ Popular"}
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{plan.students}</p>
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-extrabold text-gray-900">${plan.schoolPrice}</span>
                  <span className="text-sm text-gray-400 ml-1">{tr.pricing.perYear}</span>
                </div>
                <div className="text-sm text-gray-500 mb-6">
                  + ${plan.studentPrice} <span className="text-xs">{tr.pricing.perStudent}</span>
                </div>
                <ul className="space-y-2 mb-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block text-center font-semibold py-3 rounded-xl transition ${plan.popular
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                    : "bg-gray-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
                >
                  {tr.pricing.request}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="py-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-14">{tr.stats.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {tr.stats.items.map((s, i) => (
              <div key={i}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
                <div className="text-emerald-200 mt-2 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-100 rounded-3xl p-10 md:p-14">
            <div className="text-5xl mb-4">🕌</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{tr.cta.title}</h2>
            <p className="text-gray-500 mb-8 text-lg">{tr.cta.subtitle}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl transition shadow-xl shadow-emerald-200 text-lg"
            >
              {tr.cta.button}
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-300 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ط</span>
                </div>
                <span className="font-bold text-white text-lg">TAHFIDZ</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{tr.footer.desc}</p>
              <div className="flex items-center gap-3 mt-4">
                {["facebook", "twitter", "youtube", "whatsapp"].map(s => (
                  <a key={s} href="#" className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-emerald-700 flex items-center justify-center transition text-xs font-bold text-gray-400 hover:text-white">
                    {s[0].toUpperCase()}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">{tr.footer.links}</h4>
              <ul className="space-y-2">
                {tr.footer.linkItems.map((l, i) => (
                  <li key={i}><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{tr.footer.internal}</h4>
              <ul className="space-y-2">
                {tr.footer.internalItems.map((l, i) => (
                  <li key={i}><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{tr.footer.support}</h4>
              <ul className="space-y-2">
                {tr.footer.supportItems.map((l, i) => (
                  <li key={i}><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition">{l}</a></li>
                ))}
              </ul>

              {/* Newsletter */}
              <div className="mt-6">
                <p className="text-xs text-gray-400 mb-2">
                  {lang === "fr" ? "Restez informé" : lang === "ar" ? "ابقَ على اطلاع" : "Stay informed"}
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder={lang === "fr" ? "Votre email" : lang === "ar" ? "بريدك الإلكتروني" : "Your email"}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm transition">
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">{tr.footer.copyright}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <a href="#" className="hover:text-emerald-400 transition">{tr.footer.terms}</a>
              <a href="#" className="hover:text-emerald-400 transition">{tr.footer.privacy}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
