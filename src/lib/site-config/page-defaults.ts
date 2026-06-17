// src/lib/site-config/page-defaults.ts
// Contenus par défaut des pages éditables via SiteConfig.

import type { SitePageConfig } from './page-types'

const PRIVACY_FR = {
  title: 'Politique de confidentialité',
  metaTitle: 'Politique de confidentialité | TAHFIDZ',
  metaDescription: 'Découvrez comment TAHFIDZ collecte, utilise et protège vos données personnelles.',
  lastUpdated: '17 juin 2026',
  sections: [
    {
      title: '1. Notre engagement',
      body: 'Chez TAHFIDZ, la protection de vos données et de celles de votre école est une priorité. Cette politique explique quelles informations nous collectons, comment nous les utilisons et quels sont vos droits.',
    },
    {
      title: '2. Données collectées',
      body: 'Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme :\n- Données de compte : nom, email, mot de passe hashé, rôle.\n- Données de l\'école : nom, adresse, logo, informations de contact.\n- Données des élèves : nom, progression de mémorisation, présences, évaluations.\n- Données des parents : nom, email, lien avec l\'enfant.\n- Données techniques : logs de connexion, préférences de notification.',
    },
    {
      title: '3. Utilisation des données',
      body: 'Vos données sont utilisées pour :\n- Fournir et améliorer les services de gestion de l\'école coranique.\n- Permettre le suivi pédagogique des élèves et la communication avec les parents.\n- Assurer la sécurité du compte et de la plateforme.\n- Envoyer des notifications importantes liées à l\'utilisation du service.',
    },
    {
      title: '4. Stockage et sécurité',
      body: 'Les données sont stockées dans une base de données PostgreSQL sécurisée, hébergée sur des infrastructures cloud fiables. Les mots de passe sont hashés et les communications sont chiffrées en transit via HTTPS.',
    },
    {
      title: '5. Vos droits',
      body: 'Conformément aux réglementations applicables, vous disposez d\'un droit d\'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous à l\'adresse ci-dessous.',
    },
    {
      title: '6. Cookies et tracking',
      body: 'TAHFIDZ utilise des cookies strictement nécessaires à l\'authentification et au fonctionnement de la plateforme. Nous n\'utilisons pas de cookies de tracking à des fins publicitaires.',
    },
    {
      title: '7. Contact',
      body: 'Pour toute question relative à la confidentialité, contactez notre responsable de la protection des données à privacy@tahfidz.com.',
    },
  ],
}

const PRIVACY_EN = {
  title: 'Privacy Policy',
  metaTitle: 'Privacy Policy | TAHFIDZ',
  metaDescription: 'Learn how TAHFIDZ collects, uses, and protects your personal data.',
  lastUpdated: 'June 17, 2026',
  sections: [
    {
      title: '1. Our commitment',
      body: 'At TAHFIDZ, protecting your data and that of your school is a priority. This policy explains what information we collect, how we use it, and what your rights are.',
    },
    {
      title: '2. Data we collect',
      body: 'We only collect data necessary for the platform to operate:\n- Account data: name, email, hashed password, role.\n- School data: name, address, logo, contact information.\n- Student data: name, memorization progress, attendance, evaluations.\n- Parent data: name, email, link to child.\n- Technical data: connection logs, notification preferences.',
    },
    {
      title: '3. How we use your data',
      body: 'Your data is used to:\n- Provide and improve Quran school management services.\n- Enable student progress tracking and communication with parents.\n- Ensure account and platform security.\n- Send important notifications related to the service.',
    },
    {
      title: '4. Storage and security',
      body: 'Data is stored in a secure PostgreSQL database hosted on reliable cloud infrastructure. Passwords are hashed and communications are encrypted in transit via HTTPS.',
    },
    {
      title: '5. Your rights',
      body: 'In accordance with applicable regulations, you have the right to access, rectify, delete, and port your data. To exercise these rights, please contact us at the address below.',
    },
    {
      title: '6. Cookies and tracking',
      body: 'TAHFIDZ uses cookies strictly necessary for authentication and platform operation. We do not use tracking cookies for advertising purposes.',
    },
    {
      title: '7. Contact',
      body: 'For any privacy-related questions, please contact our data protection officer at privacy@tahfidz.com.',
    },
  ],
}

const PRIVACY_AR = {
  title: 'سياسة الخصوصية',
  metaTitle: 'سياسة الخصوصية | TAHFIDZ',
  metaDescription: 'تعرّف على كيفية جمع TAHFIDZ واستخدام وحماية بياناتك الشخصية.',
  lastUpdated: '١٧ يونيو ٢٠٢٦',
  sections: [
    {
      title: '١. التزامنا',
      body: 'في TAHFIDZ، حماية بياناتك وبيانات مدرستك هي أولوية قصوى. توضح هذه السياسة المعلومات التي نجمعها وكيفية استخدامها وما هي حقوقك.',
    },
    {
      title: '٢. البيانات المجمّعة',
      body: 'نجمع فقط البيانات الضرورية لتشغيل المنصة:\n- بيانات الحساب: الاسم والبريد الإلكتروني وكلمة المرور المشفرة والدور.\n- بيانات المدرسة: الاسم والعنوان والشعار ومعلومات الاتصال.\n- بيانات الطلاب: الاسم وتقدم الحفظ والحضور والتقييمات.\n- بيانات أولياء الأمور: الاسم والبريد الإلكتروني والرابط بالطفل.\n- بيانات تقنية: سجلات الاتصال وتفضيلات الإشعارات.',
    },
    {
      title: '٣. استخدام البيانات',
      body: 'تُستخدم بياناتك من أجل:\n- تقديم وتحسين خدمات إدارة المدارس القرآنية.\n- تمكين متابعة التقدم التعليمي للطلاب والتواصل مع أولياء الأمور.\n- ضمان أمان الحساب والمنصة.\n- إرسال الإشعارات المهمة المرتبطة باستخدام الخدمة.',
    },
    {
      title: '٤. التخزين والأمان',
      body: 'تُخزّن البيانات في قاعدة بيانات PostgreSQL آمنة مستضافة على بنية تحتية سحابية موثوقة. كلمات المرور مُشفرة والاتصالات مُشفرة أثناء النقل عبر HTTPS.',
    },
    {
      title: '٥. حقوقك',
      body: 'وفقًا للأنظمة المعمول بها، لديك الحق في الوصول إلى بياناتك وتصحيحها وحذفها ونقلها. لممارسة هذه الحقوق، يرجى الاتصال بنا على العنوان أدناه.',
    },
    {
      title: '٦. ملفات تعريف الارتباط والتتبع',
      body: 'تستخدم TAHFIDZ ملفات تعريف ارتباط ضرورية فقط للمصادقة وتشغيل المنصة. لا نستخدم ملفات تعريف ارتباط للتتبع الإعلاني.',
    },
    {
      title: '٧. اتصل بنا',
      body: 'لأي سؤال يتعلق بالخصوصية، يرجى الاتصال بمسؤول حماية البيانات لدينا على privacy@tahfidz.com.',
    },
  ],
}

const TERMS_FR = {
  title: "Conditions d'utilisation",
  metaTitle: "Conditions d'utilisation | TAHFIDZ",
  metaDescription: "Les conditions générales d'utilisation de la plateforme TAHFIDZ.",
  lastUpdated: '17 juin 2026',
  sections: [
    {
      title: '1. Acceptation des conditions',
      body: "En accédant à la plateforme TAHFIDZ et en utilisant nos services, vous acceptez sans réserve les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.",
    },
    {
      title: '2. Description du service',
      body: 'TAHFIDZ est une plateforme SaaS de gestion et de suivi pédagogique destinée aux écoles de mémorisation du Coran. Elle permet la gestion des élèves, enseignants, parents, groupes, présences, évaluations et communications.',
    },
    {
      title: '3. Comptes et sécurité',
      body: 'Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité effectuée depuis votre compte est réputée effectuée par vous. Vous vous engagez à notifier rapidement TAHFIDZ en cas d\'utilisation non autorisée de votre compte.',
    },
    {
      title: '4. Contenu utilisateur',
      body: 'Les données saisies par les écoles (informations sur les élèves, enseignants, parents, etc.) restent leur propriété. TAHFIDZ agit uniquement en tant qu\'hébergeur et fournisseur d\'outils de gestion.',
    },
    {
      title: '5. Paiement et abonnements',
      body: 'TAHFIDZ propose différents plans d\'abonnement. Les tarifs et fonctionnalités associées sont présentés sur la page Tarifs. L\'école s\'engage à régler les sommes dues selon le plan choisi.',
    },
    {
      title: '6. Résiliation',
      body: 'Vous pouvez résilier votre compte à tout moment. TAHFIDZ se réserve le droit de suspendre ou de résilier un compte en cas de violation des présentes conditions ou d\'utilisation frauduleuse de la plateforme.',
    },
    {
      title: '7. Limitation de responsabilité',
      body: 'TAHFIDZ s\'efforce d\'assurer la disponibilité et la fiabilité du service, mais ne peut garantir un fonctionnement sans interruption. La responsabilité de TAHFIDZ est limitée au montant des frais payés par l\'école au cours des douze derniers mois.',
    },
    {
      title: '8. Loi applicable',
      body: 'Les présentes conditions sont régies par les lois en vigueur au Canada. Tout litige relatif à l\'interprétation ou à l\'exécution des présentes conditions sera soumis aux tribunaux compétents de cette juridiction.',
    },
    {
      title: '9. Contact',
      body: 'Pour toute question juridique, contactez-nous à legal@tahfidz.com.',
    },
  ],
}

const TERMS_EN = {
  title: 'Terms of Service',
  metaTitle: 'Terms of Service | TAHFIDZ',
  metaDescription: 'The general terms and conditions of use of the TAHFIDZ platform.',
  lastUpdated: 'June 17, 2026',
  sections: [
    {
      title: '1. Acceptance of terms',
      body: 'By accessing the TAHFIDZ platform and using our services, you unconditionally accept these terms of service. If you do not accept these terms, please do not use the service.',
    },
    {
      title: '2. Service description',
      body: 'TAHFIDZ is a SaaS platform for management and educational tracking designed for Quran memorization schools. It enables the management of students, teachers, parents, groups, attendance, evaluations, and communications.',
    },
    {
      title: '3. Accounts and security',
      body: 'You are responsible for keeping your login credentials confidential. Any activity performed from your account is deemed to have been performed by you. You agree to promptly notify TAHFIDZ of any unauthorized use of your account.',
    },
    {
      title: '4. User content',
      body: 'Data entered by schools (information about students, teachers, parents, etc.) remains their property. TAHFIDZ acts solely as a host and provider of management tools.',
    },
    {
      title: '5. Payment and subscriptions',
      body: 'TAHFIDZ offers several subscription plans. Pricing and associated features are presented on the Pricing page. The school agrees to pay the amounts due according to the chosen plan.',
    },
    {
      title: '6. Termination',
      body: 'You may terminate your account at any time. TAHFIDZ reserves the right to suspend or terminate an account in the event of a violation of these terms or fraudulent use of the platform.',
    },
    {
      title: '7. Limitation of liability',
      body: 'TAHFIDZ strives to ensure the availability and reliability of the service, but cannot guarantee uninterrupted operation. TAHFIDZ liability is limited to the amount of fees paid by the school during the twelve preceding months.',
    },
    {
      title: '8. Governing law',
      body: 'These terms are governed by the laws in force in Canada. Any dispute relating to the interpretation or execution of these terms will be submitted to the competent courts of that jurisdiction.',
    },
    {
      title: '9. Contact',
      body: 'For any legal questions, please contact us at legal@tahfidz.com.',
    },
  ],
}

const TERMS_AR = {
  title: 'شروط الاستخدام',
  metaTitle: 'شروط الاستخدام | TAHFIDZ',
  metaDescription: 'الشروط والأحكام العامة لاستخدام منصة TAHFIDZ.',
  lastUpdated: '١٧ يونيو ٢٠٢٦',
  sections: [
    {
      title: '١. قبول الشروط',
      body: 'بمجرد الوصول إلى منصة TAHFIDZ واستخدام خدماتنا، فإنك تقبل هذه الشروط دون تحفظ. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الخدمة.',
    },
    {
      title: '٢. وصف الخدمة',
      body: 'TAHFIDZ هي منصة SaaS لإدارة ومتابعة تعليمية مخصصة لمدارس تحفيظ القرآن. تتيح إدارة الطلاب والمعلمين وأولياء الأمور والمجموعات والحضور والتقييمات والاتصالات.',
    },
    {
      title: '٣. الحسابات والأمان',
      body: 'أنت مسؤول عن سرية بيانات تسجيل الدخول الخاصة بك. يعتبر أي نشاط يتم من حسابك قد تم بواسطتك. أنت توافق على إخطار TAHFIDZ فورًا في حالة الاستخدام غير المصرح به لحسابك.',
    },
    {
      title: '٤. محتوى المستخدم',
      body: 'البيانات التي تدخلها المدارس (معلومات الطلاب والمعلمين وأولياء الأمور وغيرها) تظل ملكًا لها. TAHFIDZ تعمل فقط كمضيف ومزود لأدوات الإدارة.',
    },
    {
      title: '٥. الدفع والاشتراكات',
      body: 'تقدم TAHFIDZ عدة خطط اشتراك. يتم عرض الأسعار والميزات المرتبطة في صفحة الأسعار. تلتزم المدرسة بدفع المبالغ المستحقة وفقًا للخطة المختارة.',
    },
    {
      title: '٦. الإنهاء',
      body: 'يمكنك إنهاء حسابك في أي وقت. تحتفظ TAHFIDZ بالحق في تعليق أو إنهاء حساب في حالة انتهاك هذه الشروط أو الاستخدام الاحتيالي للمنصة.',
    },
    {
      title: '٧. حدود المسؤولية',
      body: 'تسعى TAHFIDZ جاهدة لضمان توفر وموثوقية الخدمة، ولكنها لا تضمن تشغيلًا دون انقطاع. تقتصر مسؤولية TAHFIDZ على مبلغ الرسوم المدفوعة من قبل المدرسة خلال الاثني عشر شهرًا السابقة.',
    },
    {
      title: '٨. القانون الواجب التطبيق',
      body: 'تخضع هذه الشروط للقوانين السارية في كندا. يُحال أي نزاع يتعلق بتفسير أو تنفيذ هذه الشروط إلى المحاكم المختصة في تلك الولاية القضائية.',
    },
    {
      title: '٩. اتصل بنا',
      body: 'لأي استفسار قانوني، يرجى الاتصال بنا على legal@tahfidz.com.',
    },
  ],
}

const SECURITY_FR = {
  title: 'Sécurité et conformité',
  metaTitle: 'Sécurité | TAHFIDZ',
  metaDescription: 'Les mesures de sécurité mises en place pour protéger vos données sur TAHFIDZ.',
  lastUpdated: '17 juin 2026',
  sections: [
    {
      title: '1. Infrastructure sécurisée',
      body: 'TAHFIDZ est hébergé sur des infrastructures cloud fiables et bénéficie d\'une architecture moderne. Toutes les communications entre vos appareils et nos serveurs sont chiffrées via HTTPS/TLS.',
    },
    {
      title: '2. Chiffrement des données',
      body: 'Les données sont chiffrées en transit et bénéficient de mécanismes de protection au repos. Les mots de passe ne sont jamais stockés en clair : ils sont hashés avec des algorithmes robustes (bcrypt).',
    },
    {
      title: '3. Authentification et sessions',
      body: 'L\'authentification repose sur des sessions sécurisées avec tokens JWT à durée limitée. Les mots de passe doivent respecter une politique de complexité minimale. La double vérification du rôle est assurée côté serveur pour chaque action sensible.',
    },
    {
      title: '4. Isolation multi-tenant',
      body: 'Chaque école dispose d\'un environnement logiquement isolé grâce à l\'injection automatique du schoolId sur chaque requête base de données. Cela garantit qu\'une école ne peut pas accéder aux données d\'une autre école.',
    },
    {
      title: '5. Sauvegardes et récupération',
      body: 'Nous mettons en place des sauvegardes régulières de la base de données afin de permettre la récupération des données en cas d\'incident. La politique de rétention et les procédures de restauration sont testées périodiquement.',
    },
    {
      title: '6. Signalement de vulnérabilités',
      body: 'Si vous découvrez une faille de sécurité, nous vous encourageons à nous la signaler de manière responsable. Nous traitons les rapports avec la plus grande sérieuxité.',
    },
    {
      title: '7. Contact sécurité',
      body: 'Pour toute question de sécurité, écrivez-nous à security@tahfidz.com.',
    },
  ],
}

const SECURITY_EN = {
  title: 'Security and compliance',
  metaTitle: 'Security | TAHFIDZ',
  metaDescription: 'The security measures in place to protect your data on TAHFIDZ.',
  lastUpdated: 'June 17, 2026',
  sections: [
    {
      title: '1. Secure infrastructure',
      body: 'TAHFIDZ is hosted on reliable cloud infrastructures and benefits from a modern architecture. All communications between your devices and our servers are encrypted via HTTPS/TLS.',
    },
    {
      title: '2. Data encryption',
      body: 'Data is encrypted in transit and benefits from protection mechanisms at rest. Passwords are never stored in plain text: they are hashed with robust algorithms (bcrypt).',
    },
    {
      title: '3. Authentication and sessions',
      body: 'Authentication relies on secure sessions with time-limited JWT tokens. Passwords must comply with a minimum complexity policy. Role verification is performed server-side for every sensitive action.',
    },
    {
      title: '4. Multi-tenant isolation',
      body: 'Each school has a logically isolated environment thanks to the automatic injection of the schoolId on every database query. This guarantees that one school cannot access another school\'s data.',
    },
    {
      title: '5. Backups and recovery',
      body: 'We perform regular database backups to enable data recovery in the event of an incident. Retention policies and restoration procedures are tested periodically.',
    },
    {
      title: '6. Vulnerability reporting',
      body: 'If you discover a security vulnerability, we encourage you to report it to us responsibly. We treat reports with the utmost seriousness.',
    },
    {
      title: '7. Security contact',
      body: 'For any security questions, please write to us at security@tahfidz.com.',
    },
  ],
}

const SECURITY_AR = {
  title: 'الأمان والامتثال',
  metaTitle: 'الأمان | TAHFIDZ',
  metaDescription: 'إجراءات الأمان الموضوعة لحماية بياناتك على منصة TAHFIDZ.',
  lastUpdated: '١٧ يونيو ٢٠٢٦',
  sections: [
    {
      title: '١. بنية تحتية آمنة',
      body: 'تستضيف TAHFIDZ على بنية تحتية سحابية موثوقة وتستفيد من هندسة معمارية حديثة. جميع الاتصالات بين أجهزتك وخوادمنا مشفرة عبر HTTPS/TLS.',
    },
    {
      title: '٢. تشفير البيانات',
      body: 'تُشفّر البيانات أثناء النقل وتستفيد من آليات الحماية أثناء التخزين. لا تُخزّن كلمات المرور أبدًا بنص واضح: يتم تجزئتها باستخدام خوارزميات قوية (bcrypt).',
    },
    {
      title: '٣. المصادقة والجلسات',
      body: 'تعتمد المصادقة على جلسات آمنة برموز JWT محدودة المدة. يجب أن تتوافق كلمات المرور مع سياسة تعقيد دنيا. يتم التحقق من الدور من جانب الخادم لكل إجراء حساس.',
    },
    {
      title: '٤. العزل متعدد المستأجرين',
      body: 'تمتلك كل مدرسة بيئة معزولة منطقيًا بفضل حقن schoolId تلقائيًا على كل استعلام قاعدة بيانات. وهذا يضمن عدم قدرة مدرسة واحدة على الوصول إلى بيانات مدرسة أخرى.',
    },
    {
      title: '٥. النسخ الاحتياطي والاسترداد',
      body: 'نقوم بإجراء نسخ احتياطي منتظم لقاعدة البيانات لتمكين استرداد البيانات في حالة وقوع حادث. يتم اختبار سياسات الاحتفاظ وإجراءات الاستعادة بشكل دوري.',
    },
    {
      title: '٦. الإبلاغ عن الثغرات',
      body: 'إذا اكتشفت ثغرة أمنية، نشجعك على الإبلاغ عنها لنا بمسؤولية. نتعامل مع التقارير بجدية بالغة.',
    },
    {
      title: '٧. التواصل مع الأمان',
      body: 'لأي سؤال يتعلق بالأمان، يرجى الكتابة إلينا على security@tahfidz.com.',
    },
  ],
}

const CONTACT_FR = {
  title: 'Contactez-nous',
  metaTitle: 'Contact | TAHFIDZ',
  metaDescription: "Contactez l'équipe TAHFIDZ pour une question, un support ou une demande de démo.",
  intro: "Une question ? Besoin d'assistance ou d'une démonstration ? Notre équipe vous répond.",
  contactCards: [
    { icon: 'Mail', title: 'Email', value: 'contact@tahfidz.com', href: 'mailto:contact@tahfidz.com' },
    { icon: 'Clock', title: 'Disponibilité', value: 'Lun - Ven, 9h - 18h' },
    { icon: 'MapPin', title: 'Siège social', value: 'Canada' },
  ],
  sections: [
    {
      title: 'Support prioritaire',
      body: 'Les écoles sous abonnement Pro bénéficient d\'un support prioritaire avec un temps de réponse garanti sous 24 heures ouvrées.',
    },
    {
      title: 'Démonstration personnalisée',
      body: 'Vous souhaitez découvrir TAHFIDZ en action ? Planifiez une démonstration personnalisée avec l\'un de nos conseillers pédagogiques.',
    },
  ],
}

const CONTACT_EN = {
  title: 'Contact us',
  metaTitle: 'Contact | TAHFIDZ',
  metaDescription: 'Contact the TAHFIDZ team for a question, support, or a demo request.',
  intro: 'Have a question? Need assistance or a demo? Our team is here to help.',
  contactCards: [
    { icon: 'Mail', title: 'Email', value: 'contact@tahfidz.com', href: 'mailto:contact@tahfidz.com' },
    { icon: 'Clock', title: 'Availability', value: 'Mon - Fri, 9am - 6pm' },
    { icon: 'MapPin', title: 'Headquarters', value: 'Canada' },
  ],
  sections: [
    {
      title: 'Priority support',
      body: 'Schools on the Pro subscription benefit from priority support with a guaranteed response time within 24 business hours.',
    },
    {
      title: 'Personalized demo',
      body: 'Would you like to see TAHFIDZ in action? Schedule a personalized demo with one of our educational advisors.',
    },
  ],
}

const CONTACT_AR = {
  title: 'تواصل معنا',
  metaTitle: 'تواصل | TAHFIDZ',
  metaDescription: 'تواصل مع فريق TAHFIDZ للاستفسار أو الدعم أو طلب عرض توضيحي.',
  intro: 'هل لديك سؤال؟ تحتاج إلى مساعدة أو عرض توضيحي؟ فريقنا جاهز لمساعدتك.',
  contactCards: [
    { icon: 'Mail', title: 'البريد الإلكتروني', value: 'contact@tahfidz.com', href: 'mailto:contact@tahfidz.com' },
    { icon: 'Clock', title: 'التواجد', value: 'الإثنين - الجمعة، ٩ ص - ٦ م' },
    { icon: 'MapPin', title: 'المقر الرئيسي', value: 'كندا' },
  ],
  sections: [
    {
      title: 'دعم ذو أولوية',
      body: 'المدارس المشتركة في خطة Pro تستفيد من دعم ذي أولوية مع ضمان الرد خلال ٢٤ ساعة عمل.',
    },
    {
      title: 'عرض توضيحي مخصص',
      body: 'هل ترغب في رؤية TAHFIDZ على أرض الواقع؟ حدد موعدًا لعرض توضيحي مخصص مع أحد مستشارينا التعليميين.',
    },
  ],
}

const UPDATES_FR = {
  title: 'Mises à jour',
  metaTitle: 'Mises à jour | TAHFIDZ',
  metaDescription: 'Les dernières nouveautés et améliorations de TAHFIDZ.',
  intro: 'Cette section sera bientôt disponible. Vous y retrouverez l\'historique des nouvelles fonctionnalités, améliorations et corrections de la plateforme TAHFIDZ.',
  sections: [
    {
      title: 'Restez informé',
      body: 'Pour être informé en temps réel des prochaines évolutions, suivez-nous sur nos réseaux ou contactez notre équipe.',
    },
  ],
}

const UPDATES_EN = {
  title: 'Updates',
  metaTitle: 'Updates | TAHFIDZ',
  metaDescription: 'The latest news and improvements from TAHFIDZ.',
  intro: 'This section will be available soon. You will find the history of new features, improvements, and fixes for the TAHFIDZ platform.',
  sections: [
    {
      title: 'Stay informed',
      body: 'To stay informed about upcoming developments in real time, follow us on social media or contact our team.',
    },
  ],
}

const UPDATES_AR = {
  title: 'التحديثات',
  metaTitle: 'التحديثات | TAHFIDZ',
  metaDescription: 'آخر المستجدات والتحسينات في TAHFIDZ.',
  intro: 'سيتوفر هذا القسم قريبًا. ستجد فيه تاريخ الميزات الجديدة والتحسينات والإصلاحات لمنصة TAHFIDZ.',
  sections: [
    {
      title: 'ابقَ على اطلاع',
      body: 'للبقاء على اطلاع دائم بالتطورات القادمة، تابعنا على وسائل التواصل الاجتماعي أو تواصل مع فريقنا.',
    },
  ],
}

const HELP_FR = {
  title: "Centre d'aide",
  metaTitle: "Centre d'aide | TAHFIDZ",
  metaDescription: "Trouvez des réponses à vos questions sur l'utilisation de TAHFIDZ.",
  intro: "Le centre d'aide est en cours de construction. Il contiendra prochainement des guides, tutoriels et une foire aux questions pour vous accompagner dans l'utilisation de TAHFIDZ.",
  sections: [
    {
      title: 'Besoin d\'aide immédiate ?',
      body: 'En attendant, n\'hésitez pas à nous contacter directement via la page de contact pour obtenir de l\'assistance.',
    },
  ],
}

const HELP_EN = {
  title: 'Help Center',
  metaTitle: 'Help Center | TAHFIDZ',
  metaDescription: 'Find answers to your questions about using TAHFIDZ.',
  intro: 'The help center is under construction. It will soon contain guides, tutorials, and a FAQ to help you use TAHFIDZ.',
  sections: [
    {
      title: 'Need immediate help?',
      body: 'In the meantime, please contact us directly through the contact page for assistance.',
    },
  ],
}

const HELP_AR = {
  title: 'مركز المساعدة',
  metaTitle: 'مركز المساعدة | TAHFIDZ',
  metaDescription: 'جد إجابات لأسئلتك حول استخدام TAHFIDZ.',
  intro: 'مركز المساعدة قيد الإنشاء. سيتضمن قريبًا أدلة ودروسًا تعليمية وأسئلة شائعة لمساعدتك في استخدام TAHFIDZ.',
  sections: [
    {
      title: 'هل تحتاج إلى مساعدة فورية؟',
      body: 'في غضون ذلك، يرجى التواصل معنا مباشرة عبر صفحة التواصل للحصول على المساعدة.',
    },
  ],
}

const DOCS_FR = {
  title: 'Documentation',
  metaTitle: 'Documentation | TAHFIDZ',
  metaDescription: 'Documentation complète de la plateforme TAHFIDZ.',
  intro: 'La documentation complète de TAHFIDZ sera disponible prochainement. Elle couvrira la prise en main, la gestion des écoles, des élèves, des enseignants et des parents.',
  sections: [
    {
      title: 'Questions urgentes',
      body: 'Pour toute question urgente, contactez notre équipe via la page de contact.',
    },
  ],
}

const DOCS_EN = {
  title: 'Documentation',
  metaTitle: 'Documentation | TAHFIDZ',
  metaDescription: 'Complete documentation of the TAHFIDZ platform.',
  intro: 'The complete TAHFIDZ documentation will be available soon. It will cover onboarding, school management, students, teachers, and parents.',
  sections: [
    {
      title: 'Urgent questions',
      body: 'For any urgent questions, please contact our team through the contact page.',
    },
  ],
}

const DOCS_AR = {
  title: 'التوثيق',
  metaTitle: 'التوثيق | TAHFIDZ',
  metaDescription: 'التوثيق الكامل لمنصة TAHFIDZ.',
  intro: 'سيتوفر التوثيق الكامل لـ TAHFIDZ قريبًا. وسيغطي البدء وإدارة المدرسة والطلاب والمعلمين وأولياء الأمور.',
  sections: [
    {
      title: 'أسئلة عاجلة',
      body: 'لأي سؤال عاجل، يرجى التواصل مع فريقنا عبر صفحة التواصل.',
    },
  ],
}

const API_DOCS_FR = {
  title: 'Documentation API',
  metaTitle: 'Documentation API | TAHFIDZ',
  metaDescription: "Documentation technique de l'API TAHFIDZ.",
  intro: "La documentation technique de l'API TAHFIDZ est en cours de rédaction. Elle permettra aux développeurs d'intégrer la plateforme à leurs propres outils.",
  sections: [
    {
      title: 'Être averti',
      body: 'Pour être averti de la disponibilité de l\'API, contactez-nous via la page de contact.',
    },
  ],
}

const API_DOCS_EN = {
  title: 'API Documentation',
  metaTitle: 'API Documentation | TAHFIDZ',
  metaDescription: 'Technical documentation of the TAHFIDZ API.',
  intro: 'The technical documentation of the TAHFIDZ API is being written. It will allow developers to integrate the platform with their own tools.',
  sections: [
    {
      title: 'Get notified',
      body: 'To be notified when the API is available, please contact us through the contact page.',
    },
  ],
}

const API_DOCS_AR = {
  title: 'توثيق واجهة برمجة التطبيقات',
  metaTitle: 'توثيق API | TAHFIDZ',
  metaDescription: 'التوثيق التقني لواجهة برمجة تطبيقات TAHFIDZ.',
  intro: 'التوثيق التقني لواجهة برمجة تطبيقات TAHFIDZ قيد الإعداد. وسيسمح للمطورين بدمج المنصة مع أدواتهم الخاصة.',
  sections: [
    {
      title: 'أبلغني عند التوفر',
      body: 'للتبليغ عند توفر واجهة برمجة التطبيقات، يرجى التواصل معنا عبر صفحة التواصل.',
    },
  ],
}

export const defaultPageContents: Record<string, SitePageConfig> = {
  privacy: { fr: PRIVACY_FR, en: PRIVACY_EN, ar: PRIVACY_AR },
  terms: { fr: TERMS_FR, en: TERMS_EN, ar: TERMS_AR },
  security: { fr: SECURITY_FR, en: SECURITY_EN, ar: SECURITY_AR },
  contact: { fr: CONTACT_FR, en: CONTACT_EN, ar: CONTACT_AR },
  updates: { fr: UPDATES_FR, en: UPDATES_EN, ar: UPDATES_AR },
  help: { fr: HELP_FR, en: HELP_EN, ar: HELP_AR },
  docs: { fr: DOCS_FR, en: DOCS_EN, ar: DOCS_AR },
  'api-docs': { fr: API_DOCS_FR, en: API_DOCS_EN, ar: API_DOCS_AR },
}
