// src/lib/landing/default-content.ts
// Contenu par défaut de la landing page TAHFIDZ (éditable depuis le superadmin)

import { SUPPORTED_CURRENCIES } from './currencies'

export type FooterLink = {
  label: string
  href: string
  external?: boolean
}

export interface LandingContent {
  dir: "ltr" | "rtl"
  nav: {
    home: string
    features: string
    pricing: string
    how: string
    login: string
    register: string
  }
  hero: {
    badge: string
    title: string
    titleHighlight: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    stat1: string
    stat2: string
    stat3: string
  }
  features: {
    title: string
    subtitle: string
    items: Array<{ icon: string; title: string; desc: string }>
  }
  how: {
    title: string
    subtitle: string
    steps: Array<{ num: string; title: string; desc: string }>
  }
  users: {
    title: string
    subtitle: string
    items: Array<{ icon: string; role: string; desc: string }>
  }
  stats: {
    title: string
    items: Array<{ value: number; label: string; suffix: string }>
  }
  testimonials: {
    title: string
    items: Array<{ name: string; role: string; text: string }>
  }
  pricing: {
    title: string
    subtitle: string
    period: 'month' | 'year'
    request: string
    popular: string
    currency: string
    plans: Array<{ name: string; students: string; monthlyPrice: string; yearlyPrice: string; monthlyFeatures: string[]; yearlyFeatures: string[]; features?: string[] }>
  }
  cta: {
    title: string
    subtitle: string
    button: string
    sub: string
  }
  footer: {
    desc: string
    product: string
    linksProduct: FooterLink[]
    support: string
    linksSupport: FooterLink[]
    legal: string
    linksLegal: FooterLink[]
    copyright: string
  }
}

export function normalizeCurrencyCode(value: unknown): string {
  const str = String(value ?? '').trim()
  if (SUPPORTED_CURRENCIES.some((c) => c.code === str)) return str

  const cleanup = str.replace(/\$/g, '').replace(/£/g, '').replace(/€/g, '').trim()
  if (SUPPORTED_CURRENCIES.some((c) => c.code === cleanup)) return cleanup

  const map: Record<string, string> = {
    '$ CAD': 'CAD',
    'CAD': 'CAD',
    '$ USD': 'USD',
    'USD': 'USD',
    '€': 'EUR',
    'EUR': 'EUR',
    '£ GBP': 'GBP',
    'GBP': 'GBP',
    'MAD': 'MAD',
    'DZD': 'DZD',
    'DA': 'DZD',
    'TND': 'TND',
    'DT': 'TND',
    'دولار كندي': 'CAD',
    'دولار أمريكي': 'USD',
    'يورو': 'EUR',
    'جنيه إسترليني': 'GBP',
    'درهم': 'MAD',
    'دينار': 'DZD',
    'دينار تونسي': 'TND',
  }
  return map[str] ?? 'CAD'
}

export function normalizeFooterLink(link: unknown, defaultLinks: FooterLink[] = []): FooterLink {
  if (typeof link === 'string') {
    const match = defaultLinks.find((d) => d.label.toLowerCase() === link.toLowerCase())
    if (match) return { ...match }
    return { label: link, href: '/', external: false }
  }
  if (link && typeof link === 'object') {
    const l = link as Record<string, unknown>
    let href = typeof l.href === 'string' ? l.href : '/'
    const external = typeof l.external === 'boolean' ? l.external : false
    if (!external && !href.startsWith('/') && !href.startsWith('mailto:') && !href.startsWith('#') && !href.startsWith('http')) {
      href = '/' + href
    }
    return {
      label: typeof l.label === 'string' ? l.label : '',
      href,
      external,
    }
  }
  return { label: '', href: '/', external: false }
}

export function normalizeLandingContent(
  content: unknown,
  lang: "fr" | "en" | "ar" = "fr"
): LandingContent {
  const c = content as Partial<LandingContent>
  const defaultLang = defaultLandingContent[lang]

  return {
    dir: c.dir ?? defaultLang.dir,
    nav: { ...defaultLang.nav, ...c.nav },
    hero: { ...defaultLang.hero, ...c.hero },
    features: {
      ...defaultLang.features,
      ...c.features,
      items: (c.features?.items ?? defaultLang.features.items).map((item) => ({
        icon: item.icon,
        title: item.title,
        desc: item.desc,
      })),
    },
    how: {
      ...defaultLang.how,
      ...c.how,
      steps: (c.how?.steps ?? defaultLang.how.steps).map((step) => ({
        num: step.num,
        title: step.title,
        desc: step.desc,
      })),
    },
    users: {
      ...defaultLang.users,
      ...c.users,
      items: (c.users?.items ?? defaultLang.users.items).map((item) => ({
        icon: item.icon,
        role: item.role,
        desc: item.desc,
      })),
    },
    stats: {
      ...defaultLang.stats,
      ...c.stats,
      items: (c.stats?.items ?? defaultLang.stats.items).map((item) => ({
        value: item.value,
        label: item.label,
        suffix: item.suffix,
      })),
    },
    testimonials: {
      ...defaultLang.testimonials,
      ...c.testimonials,
      items: (c.testimonials?.items ?? defaultLang.testimonials.items).map((item) => ({
        name: item.name,
        role: item.role,
        text: item.text,
      })),
    },
    pricing: {
      ...defaultLang.pricing,
      ...c.pricing,
      period: c.pricing?.period ?? defaultLang.pricing.period,
      currency: normalizeCurrencyCode(c.pricing?.currency ?? defaultLang.pricing.currency),
      plans: (c.pricing?.plans ?? defaultLang.pricing.plans).map((plan) => ({
        name: plan.name,
        students: plan.students,
        monthlyPrice: plan.monthlyPrice ?? (plan as any).price ?? defaultLang.pricing.plans[0].monthlyPrice,
        yearlyPrice: plan.yearlyPrice ?? (plan as any).price ?? defaultLang.pricing.plans[0].yearlyPrice,
        monthlyFeatures: plan.monthlyFeatures ?? plan.features ?? defaultLang.pricing.plans[0].monthlyFeatures,
        yearlyFeatures: plan.yearlyFeatures ?? plan.features ?? defaultLang.pricing.plans[0].yearlyFeatures,
      })),
    },
    cta: { ...defaultLang.cta, ...c.cta },
    footer: {
      ...defaultLang.footer,
      ...c.footer,
      linksProduct: (c.footer?.linksProduct ?? defaultLang.footer.linksProduct).map((link) =>
        normalizeFooterLink(link, defaultLang.footer.linksProduct)
      ),
      linksSupport: (c.footer?.linksSupport ?? defaultLang.footer.linksSupport).map((link) =>
        normalizeFooterLink(link, defaultLang.footer.linksSupport)
      ),
      linksLegal: (c.footer?.linksLegal ?? defaultLang.footer.linksLegal).map((link) =>
        normalizeFooterLink(link, defaultLang.footer.linksLegal)
      ),
    },
  }
}

export const defaultLandingContent: Record<"fr" | "en" | "ar", LandingContent> = {
  fr: {
    dir: "ltr",
    nav: {
      home: "Accueil", features: "Fonctionnalites", pricing: "Tarifs",
      how: "Comment ca marche", login: "Connexion", register: "Inscrire mon ecole",
    },
    hero: {
      badge: "🎉 Nouveau · Halaqa Online electronique disponible",
      title: "La plateforme intelligente pour",
      titleHighlight: "les ecoles coraniques",
      subtitle: "Gerez votre ecole de memorisation du Coran avec excellence. Eleves, enseignants, groupes, suivis, evaluations — tout en un seul endroit.",
      ctaPrimary: "Inscrire mon ecole",
      ctaSecondary: "Voir la demonstration",
      stat1: "Ecoles", stat2: "Eleves", stat3: "Enseignants",
    },
    features: {
      title: "Tout ce dont votre ecole a besoin",
      subtitle: "Des outils modernes et intuitifs pour chaque aspect de votre ecole coranique",
      items: [
        { icon: "GraduationCap", title: "Gestion des eleves", desc: "Inscriptions, profils complets, statuts, historique — tout centralise." },
        { icon: "BookOpen", title: "Groupes & Halaqas", desc: "Creez et gerez vos groupes, affectez eleves et enseignants en quelques clics." },
        { icon: "BookMarked", title: "Suivi memorisation", desc: "Suivez l'avancement sourate par sourate avec notation detaillee des erreurs." },
        { icon: "BarChart2", title: "Rapports & statistiques", desc: "Tableaux de bord et rapports ecrits sur les halaqas, memorisation et presences." },
        { icon: "Megaphone", title: "Annonces & actualites", desc: "Communiquez en temps reel avec eleves, parents et enseignants." },
        { icon: "Wifi", title: "Halaqa Online electronique", desc: "Seances virtuelles de recitation en direct — salles individuelles et collectives." },
      ],
    },
    how: {
      title: "Comment ca marche",
      subtitle: "Trois etapes simples pour transformer la gestion de votre ecole",
      steps: [
        { num: "01", title: "Inscrivez votre ecole", desc: "Creez votre compte en quelques minutes avec les informations de votre ecole coranique." },
        { num: "02", title: "Ajoutez vos membres", desc: "Importez ou ajoutez vos eleves, enseignants et parents dans la plateforme." },
        { num: "03", title: "Commencez a suivre", desc: "Lancez les halaqas, enregistrez les presences et suivez la memorisation." },
      ],
    },
    users: {
      title: "Une plateforme pour chaque role",
      subtitle: "Des espaces dedies et adaptes a chaque utilisateur",
      items: [
        { icon: "Shield", role: "Administrateur", desc: "Vue complete sur l'ecole, gestion des utilisateurs, rapports et parametres." },
        { icon: "Users", role: "Enseignant", desc: "Gestion de ses groupes, presences, evaluations et suivi des recitations." },
        { icon: "GraduationCap", role: "Eleve", desc: "Suivi de sa progression, planning, resultats et objectifs personnels." },
        { icon: "UserCheck", role: "Parent", desc: "Suivi en temps reel de l'avancement de son enfant et notifications." },
      ],
    },
    stats: {
      title: "TAHFIDZ en chiffres",
      items: [
        { value: 200, label: "Ecoles actives", suffix: "+" },
        { value: 20000, label: "Eleves", suffix: "+" },
        { value: 1000, label: "Enseignants", suffix: "+" },
        { value: 99, label: "Satisfaction", suffix: "%" },
      ],
    },
    testimonials: {
      title: "Ce que disent nos utilisateurs",
      items: [
        { name: "Cheikh Mohammed B.", role: "Directeur, Medersa Al-Nour", text: "TAHFIDZ a revolutionne la gestion de notre ecole. Le suivi sourate par sourate est une fonctionnalite exceptionnelle." },
        { name: "Imam Karim T.", role: "Enseignant, Ecole Ibn Taymiya", text: "Je peux enfin consacrer plus de temps a l'enseignement et moins au papier. L'interface est intuitive et belle." },
        { name: "Fatima Z.", role: "Parent d'eleve", text: "Je suis l'evolution de mon fils en temps reel. Les notifications me tiennent informee de ses progres." },
      ],
    },
    pricing: {
      title: "Des tarifs adaptes a chaque ecole",
      subtitle: "Choisissez le plan qui correspond a la taille de votre etablissement",
      period: "year",
      request: "Demander",
      popular: "Populaire",
      currency: "CAD",
      plans: [
        { name: "Gratuit", students: "Jusqu'a 50 eleves", monthlyPrice: "0", yearlyPrice: "0", monthlyFeatures: ["Gestion des eleves", "2 enseignants", "1 halaqa", "Rapports basiques", "Support email"], yearlyFeatures: ["Gestion des eleves", "2 enseignants", "1 halaqa", "Rapports basiques", "Support email"] },
        { name: "Starter", students: "51 - 200 eleves", monthlyPrice: "49", yearlyPrice: "490", monthlyFeatures: ["Tout du plan Gratuit", "10 enseignants", "Halaqas illimitees", "Notifications push", "Exports PDF"], yearlyFeatures: ["Tout du plan Gratuit", "10 enseignants", "Halaqas illimitees", "Notifications push", "Exports PDF"] },
        { name: "Pro", students: "201 - 500 eleves", monthlyPrice: "99", yearlyPrice: "990", monthlyFeatures: ["Tout du plan Starter", "Enseignants illimites", "Halaqa Online electronique", "Tableau de bord avance", "Support prioritaire"], yearlyFeatures: ["Tout du plan Starter", "Enseignants illimites", "Halaqa Online electronique", "Tableau de bord avance", "Support prioritaire"] },
      ],
    },
    cta: {
      title: "Pret a moderniser votre ecole coranique ?",
      subtitle: "Rejoignez des centaines d'ecoles qui font confiance a TAHFIDZ pour leur gestion quotidienne.",
      button: "Inscrire mon ecole gratuitement",
      sub: "Pas de carte bancaire requise · Essai gratuit",
    },
    footer: {
      desc: "La plateforme cloud complete pour la gestion des ecoles de memorisation du Coran.",
      product: "Produit",
      linksProduct: [
        { label: "Fonctionnalites", href: "/#features" },
        { label: "Tarifs", href: "/#pricing" },
        { label: "Demo", href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", external: true },
        { label: "Mises a jour", href: "/updates" },
      ],
      support: "Support",
      linksSupport: [
        { label: "Centre d'aide", href: "/help" },
        { label: "Contact", href: "/contact" },
        { label: "Documentation", href: "/docs" },
        { label: "API", href: "/api-docs" },
      ],
      legal: "Légal",
      linksLegal: [
        { label: "Confidentialité", href: "/privacy" },
        { label: "Conditions", href: "/terms" },
        { label: "Sécurité", href: "/security" },
      ],
      copyright: " TAHFIDZ. Tous droits reserves.",
    },
  },
  en: {
    dir: "ltr",
    nav: {
      home: "Home", features: "Features", pricing: "Pricing",
      how: "How it works", login: "Login", register: "Register my school",
    },
    hero: {
      badge: "🎉 New · Electronic Halaqa Online available",
      title: "The intelligent platform for",
      titleHighlight: "Quran schools",
      subtitle: "Manage your Quran memorization school with excellence. Students, teachers, groups, follow-up, evaluations — all in one place.",
      ctaPrimary: "Register my school",
      ctaSecondary: "Watch demo",
      stat1: "Schools", stat2: "Students", stat3: "Teachers",
    },
    features: {
      title: "Everything your school needs",
      subtitle: "Modern and intuitive tools for every aspect of your Quran school",
      items: [
        { icon: "GraduationCap", title: "Student management", desc: "Enrollment, complete profiles, status, history — all centralized." },
        { icon: "BookOpen", title: "Groups & Halaqas", desc: "Create and manage your groups, assign students and teachers in a few clicks." },
        { icon: "BookMarked", title: "Memorization follow-up", desc: "Track progress surah by surah with detailed error notation." },
        { icon: "BarChart2", title: "Reports & statistics", desc: "Dashboards and written reports on halaqas, memorization and attendance." },
        { icon: "Megaphone", title: "Announcements", desc: "Communicate in real-time with students, parents and teachers." },
        { icon: "Wifi", title: "Electronic Halaqa Online", desc: "Virtual recitation sessions live — individual and collective rooms." },
      ],
    },
    how: {
      title: "How it works",
      subtitle: "Three simple steps to transform your school management",
      steps: [
        { num: "01", title: "Register your school", desc: "Create your account in minutes with your Quran school information." },
        { num: "02", title: "Add your members", desc: "Import or add your students, teachers and parents to the platform." },
        { num: "03", title: "Start supervising", desc: "Launch halaqas, record attendance and track memorization." },
      ],
    },
    users: {
      title: "A platform for every role",
      subtitle: "Dedicated spaces adapted to each user",
      items: [
        { icon: "Shield", role: "Administrator", desc: "Complete school view, user management, reports and settings." },
        { icon: "Users", role: "Teacher", desc: "Group management, attendance, evaluations and recitation follow-up." },
        { icon: "GraduationCap", role: "Student", desc: "Progress monitoring, schedule, results and personal goals." },
        { icon: "UserCheck", role: "Parent", desc: "Real-time monitoring of child's progress and notifications." },
      ],
    },
    stats: {
      title: "TAHFIDZ in numbers",
      items: [
        { value: 200, label: "Active schools", suffix: "+" },
        { value: 20000, label: "Students", suffix: "+" },
        { value: 1000, label: "Teachers", suffix: "+" },
        { value: 99, label: "Satisfaction", suffix: "%" },
      ],
    },
    testimonials: {
      title: "What our users say",
      items: [
        { name: "Sheikh Mohammed B.", role: "Director, Medersa Al-Nour", text: "TAHFIDZ has revolutionized our school management. The surah-by-surah follow-up is an exceptional feature." },
        { name: "Imam Karim T.", role: "Teacher, Ibn Taymiya School", text: "I can finally dedicate more time to teaching and less to paperwork. The interface is intuitive and beautiful." },
        { name: "Fatima Z.", role: "Parent", text: "I follow my son's progress in real-time. The notifications keep me informed of his achievements." },
      ],
    },
    pricing: {
      title: "Pricing for every school",
      subtitle: "Choose the plan that fits your institution size",
      period: "year",
      request: "Request",
      popular: "Popular",
      currency: "CAD",
      plans: [
        { name: "Free", students: "Up to 50 students", monthlyPrice: "0", yearlyPrice: "0", monthlyFeatures: ["Student management", "2 teachers", "1 halaqa", "Basic reports", "Email support"], yearlyFeatures: ["Student management", "2 teachers", "1 halaqa", "Basic reports", "Email support"] },
        { name: "Starter", students: "51 - 200 students", monthlyPrice: "49", yearlyPrice: "490", monthlyFeatures: ["Everything in Free", "10 teachers", "Unlimited halaqas", "Push notifications", "PDF exports"], yearlyFeatures: ["Everything in Free", "10 teachers", "Unlimited halaqas", "Push notifications", "PDF exports"] },
        { name: "Pro", students: "201 - 500 students", monthlyPrice: "99", yearlyPrice: "990", monthlyFeatures: ["Everything in Starter", "Unlimited teachers", "Electronic Halaqa Online", "Advanced dashboard", "Priority support"], yearlyFeatures: ["Everything in Starter", "Unlimited teachers", "Electronic Halaqa Online", "Advanced dashboard", "Priority support"] },
      ],
    },
    cta: {
      title: "Ready to modernize your Quran school?",
      subtitle: "Join hundreds of schools that trust TAHFIDZ for their daily management.",
      button: "Register my school for free",
      sub: "No credit card required · Free trial",
    },
    footer: {
      desc: "The complete cloud platform for managing Quran memorization schools.",
      product: "Product",
      linksProduct: [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
        { label: "Demo", href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", external: true },
        { label: "Updates", href: "/updates" },
      ],
      support: "Support",
      linksSupport: [
        { label: "Help center", href: "/help" },
        { label: "Contact", href: "/contact" },
        { label: "Documentation", href: "/docs" },
        { label: "API", href: "/api-docs" },
      ],
      legal: "Legal",
      linksLegal: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Security", href: "/security" },
      ],
      copyright: " TAHFIDZ. All rights reserved.",
    },
  },
  ar: {
    dir: "rtl",
    nav: {
      home: "الرئيسية", features: "المميزات", pricing: "الأسعار",
      how: "كيف يعمل", login: "تسجيل الدخول", register: "تسجيل مدرستي",
    },
    hero: {
      badge: "🎉 جديد · المقرأة الإلكترونية متوفرة",
      title: "المنصة الذكية ل",
      titleHighlight: "مدارس تحفيظ القرآن",
      subtitle: "أدِر مدرسة تحفيظ القرآن بتفوق. الطلاب، المعلمون، المجموعات، المتابعة، التقييمات — كل شيء في مكان واحد.",
      ctaPrimary: "تسجيل مدرستي",
      ctaSecondary: "مشاهدة العرض التوضيحي",
      stat1: "مدارس", stat2: "طلاب", stat3: "معلمون",
    },
    features: {
      title: "كل ما تحتاجه مدرستك",
      subtitle: "أدوات حديثة وبديهية لكل جانب من جوانب مدرسة القرآن الخاصة بك",
      items: [
        { icon: "GraduationCap", title: "إدارة الطلاب", desc: "التسجيلات، الملفات الشخصية، الحالات، التاريخ — كل شيء مركزي." },
        { icon: "BookOpen", title: "المجموعات والحلقات", desc: "أنشئ وأدر مجموعاتك، وخصص الطلاب والمعلمين ببضع نقرات." },
        { icon: "BookMarked", title: "متابعة الحفظ", desc: "تتبع التقدم سورة بسورة مع تدوين مفصل للأخطاء." },
        { icon: "BarChart2", title: "التقارير والإحصائيات", desc: "لوحات المعلومات والتقارير المكتوبة عن الحلقات والحفظ والحضور." },
        { icon: "Megaphone", title: "الإعلانات والأخبار", desc: "تواصل في الوقت الفعلي مع الطلاب وأولياء الأمور والمعلمين." },
        { icon: "Wifi", title: "المقرأة الإلكترونية", desc: "جلسات تلاوة افتراضية مباشرة — غرف فردية وجماعية." },
      ],
    },
    how: {
      title: "كيف يعمل",
      subtitle: "ثلاث خطوات بسيطة لتحويل إدارة مدرستك",
      steps: [
        { num: "٠١", title: "سجل مدرستك", desc: "أنشئ حسابك في دقائق مع معلومات مدرسة تحفيظ القرآن الخاصة بك." },
        { num: "٠٢", title: "أضف أعضاءك", desc: "استورد أو أضف طلابك ومعلميك وأولياء الأمور إلى المنصة." },
        { num: "٠٣", title: "ابدأ المتابعة", desc: "شغل الحلقات، وسجل الحضور، وتابع الحفظ." },
      ],
    },
    users: {
      title: "منصة لكل دور",
      subtitle: "مساحات مخصصة ومُكيَّفة لكل مستخدم",
      items: [
        { icon: "Shield", role: "مدير", desc: "نظرة شاملة على المدرسة، إدارة المستخدمين، التقارير والإعدادات." },
        { icon: "Users", role: "معلم", desc: "إدارة مجموعاته، الحضور، التقييمات ومتابعة التلاوات." },
        { icon: "GraduationCap", role: "طالب", desc: "متابعة تقدمه، الجدول، النتائج والأهداف الشخصية." },
        { icon: "UserCheck", role: "ولي أمر", desc: "متابعة تقدم ابنه في الوقت الفعلي والإشعارات." },
      ],
    },
    stats: {
      title: "تحفيظ بالأرقام",
      items: [
        { value: 200, label: "مدرسة نشطة", suffix: "+" },
        { value: 20000, label: "طالب", suffix: "+" },
        { value: 1000, label: "معلم", suffix: "+" },
        { value: 99, label: "رضا", suffix: "%" },
      ],
    },
    testimonials: {
      title: "ماذا يقول مستخدمونا",
      items: [
        { name: "الشيخ محمد ب.", role: "مدير، مدرسة النور", text: "غيَّر تحفيظ إدارة مدرستنا بشكل جذري. متابعة الحفظ سورة بسورة ميزة استثنائية." },
        { name: "الإمام كريم ت.", role: "معلم، مدرسة ابن تيمية", text: "أخيراً يمكنني تخصيص المزيد من الوقت للتدريس وأقل للأوراق. الواجهة بديهية وجميلة." },
        { name: "فاطمة ز.", role: "ولية أمر", text: "أتابع تقدم ابني في الوقت الفعلي. الإشعارات تبقيني على اطلاع بإنجازاته." },
      ],
    },
    pricing: {
      title: "أسعار مناسبة لكل مدرسة",
      subtitle: "اختر الخطة التي تناسب حجم مؤسستك",
      period: "year",
      request: "اطلب",
      popular: "الأكثر شيوعاً",
      currency: "CAD",
      plans: [
        { name: "مجاني", students: "حتى 50 طالب", monthlyPrice: "0", yearlyPrice: "0", monthlyFeatures: ["إدارة الطلاب", "2 معلم", "1 حلقة", "تقارير أساسية", "دعم بالبريد"], yearlyFeatures: ["إدارة الطلاب", "2 معلم", "1 حلقة", "تقارير أساسية", "دعم بالبريد"] },
        { name: "Starter", students: "51 - 200 طالب", monthlyPrice: "49", yearlyPrice: "490", monthlyFeatures: ["كل شيء في المجاني", "10 معلمين", "حلقات غير محدودة", "إشعارات فورية", "تصدير PDF"], yearlyFeatures: ["كل شيء في المجاني", "10 معلمين", "حلقات غير محدودة", "إشعارات فورية", "تصدير PDF"] },
        { name: "احترافي", students: "201 - 500 طالب", monthlyPrice: "99", yearlyPrice: "990", monthlyFeatures: ["كل شيء في Starter", "معلمين غير محدودين", "المقرأة الإلكترونية", "لوحة معلومات متقدمة", "دعم أولوي"], yearlyFeatures: ["كل شيء في Starter", "معلمين غير محدودين", "المقرأة الإلكترونية", "لوحة معلومات متقدمة", "دعم أولوي"] },
      ],
    },
    cta: {
      title: "مستعد لتحديث مدرسة تحفيظ القرآن الخاصة بك؟",
      subtitle: "انضم لمئات المدارس التي تثق بتحفيظ لإدارتها اليومية.",
      button: "سجل مدرستك مجاناً",
      sub: "لا يحتاج بطاقة بنكية · تجربة مجانية",
    },
    footer: {
      desc: "المنصة السحابية الشاملة لإدارة مدارس تحفيظ القرآن.",
      product: "المنتج",
      linksProduct: [
        { label: "المميزات", href: "/#features" },
        { label: "الأسعار", href: "/#pricing" },
        { label: "العرض", href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", external: true },
        { label: "التحديثات", href: "/updates" },
      ],
      support: "الدعم",
      linksSupport: [
        { label: "مركز المساعدة", href: "/help" },
        { label: "اتصل بنا", href: "/contact" },
        { label: "التوثيق", href: "/docs" },
        { label: "API", href: "/api-docs" },
      ],
      legal: "قانوني",
      linksLegal: [
        { label: "الخصوصية", href: "/privacy" },
        { label: "الشروط", href: "/terms" },
        { label: "الأمان", href: "/security" },
      ],
      copyright: " تحفيظ. جميع الحقوق محفوظة.",
    },
  },
}

