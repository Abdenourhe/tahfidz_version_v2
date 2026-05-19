"use client"
// src/components/admin/CertificateTemplateEditor.tsx
// Éditeur avec Directeur + Enseignant

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, CheckCircle2, Loader2, RotateCcw, Eye, Palette, Type, Sparkles, BookOpen, LayoutTemplate, User, UserCheck } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export type CertTemplate = {
  id: string
  title: string
  titleAr: string
  subtitle: string
  bodyText: string
  arabicVerse: string
  primaryColor: string
  accentColor: string
  lightColor: string
  textColor: string
  badgeEmoji: string
  borderStyle: string
  fontFamily: string
  fontFamilyAr: string
  decorativePattern: string
  signatureStyle: string
  paperTexture: string
  orientation: "portrait" | "landscape"
  directorName: string
  directorNameAr: string
  showTeacher: boolean
  teacherName: string
  teacherNameAr: string
}

export type Templates = {
  beginner: CertTemplate
  intermediate: CertTemplate
  advanced: CertTemplate
  expert: CertTemplate
}

const LEVEL_META = {
  beginner:     { label: { fr: "🌱 Débutant",     en: "🌱 Beginner",     ar: "🌱 مبتدئ" },     emoji: "🌱", style: "islamic" },
  intermediate: { label: { fr: "⭐ Intermédiaire", en: "⭐ Intermediate", ar: "⭐ متوسط" },     emoji: "⭐", style: "andalous" },
  advanced:     { label: { fr: "🏆 Avancé",       en: "🏆 Advanced",     ar: "🏆 متقدم" },     emoji: "🏆", style: "ottoman" },
  expert:       { label: { fr: "👑 Expert",        en: "👑 Expert",        ar: "👑 خبير" },       emoji: "👑", style: "mamlouk" },
}

const STYLE_PRESETS: Record<string, { name: string; colors: string[]; pattern: string; font: string; fontAr: string }> = {
  islamic:   { name: "Islamique Géométrique", colors: ["#1a5f4a", "#c9a227", "#f0f7f4", "#0d3326"], pattern: "geometric", font: "Amiri", fontAr: "Scheherazade New" },
  andalous:  { name: "Andalou Floral",        colors: ["#2d5a3d", "#d4a843", "#f5f0e6", "#1a3d2e"], pattern: "floral",    font: "Georgia", fontAr: "Amiri" },
  ottoman:   { name: "Ottoman Royal",         colors: ["#8b4513", "#daa520", "#faf5ef", "#3d2314"], pattern: "ornate",    font: "Georgia", fontAr: "Scheherazade New" },
  mamlouk:   { name: "Mamlouk Architectural", colors: ["#1e3a5f", "#4a90a4", "#eef4f8", "#0f1f33"], pattern: "architectural", font: "Georgia", fontAr: "Reem Kufi" },
}

const UI: Record<string, { fr: string; en: string; ar: string }> = {
  resetBtn:       { fr: "Réinitialiser",            en: "Reset",               ar: "إعادة تعيين" },
  saveBtn:        { fr: "Enregistrer",              en: "Save",                ar: "حفظ" },
  savedMsg:       { fr: "Templates sauvegardés !",  en: "Templates saved!",    ar: "تم حفظ القوالب!" },
  sectionTitles:  { fr: "Titres",                   en: "Titles",              ar: "العناوين" },
  titleMain:      { fr: "Titre principal (français)",en: "Main title (French)", ar: "العنوان الرئيسي (فرنسي)" },
  titleAr:        { fr: "Titre en arabe",           en: "Arabic title",        ar: "العنوان بالعربية" },
  subtitle:       { fr: "Sous-titre",               en: "Subtitle",            ar: "العنوان الفرعي" },
  sectionText:    { fr: "Texte & Calligraphie",     en: "Text & Calligraphy",  ar: "النص والخط" },
  bodyText:       { fr: "Texte du corps",           en: "Body text",           ar: "نص الجسم" },
  arabicVerse:    { fr: "Verset / texte arabe",     en: "Verse / Arabic text", ar: "الآية / النص العربي" },
  badgeEmoji:     { fr: "Emoji badge",              en: "Badge emoji",         ar: "رمز الشارة" },
  sectionColors:  { fr: "Couleurs & Style",         en: "Colors & Style",      ar: "الألوان والنمط" },
  colorPrimary:   { fr: "Principale",               en: "Primary",             ar: "الرئيسية" },
  colorAccent:    { fr: "Dorée / Accent",           en: "Gold / Accent",       ar: "الذهبية / المميزة" },
  colorLight:     { fr: "Fond clair",               en: "Light background",    ar: "الخلفية الفاتحة" },
  colorText:      { fr: "Texte sombre",             en: "Dark text",           ar: "النص الداكن" },
  stylePreset:    { fr: "Style prédéfini",          en: "Preset style",        ar: "النمط الجاهز" },
  preview:        { fr: "Prévisualisation",          en: "Preview",             ar: "معاينة" },
  previewNote:    { fr: "Aperçu temps réel — le certificat final est plus grand",
                    en: "Live preview — the final certificate is larger",
                    ar: "معاينة فورية — الشهادة النهائية أكبر" },
  awardedTo:      { fr: "Décerné à",               en: "Awarded to",          ar: "ممنوح لـ" },
  studentName:    { fr: "Nom de l'élève",           en: "Student name",        ar: "اسم الطالب" },
  direction:      { fr: "Direction",                en: "Direction",           ar: "الإدارة" },
  teacher:        { fr: "Enseignant",               en: "Teacher",             ar: "المعلم" },
  pattern:        { fr: "Motif décoratif",          en: "Decorative pattern",  ar: "النمط الزخرفي" },
  fontFamily:     { fr: "Police française",         en: "French font",         ar: "خط فرنسي" },
  fontFamilyAr:   { fr: "Police arabe",             en: "Arabic font",         ar: "خط عربي" },
  orientation:    { fr: "Orientation",              en: "Orientation",         ar: "الاتجاه" },
  portrait:       { fr: "Portrait (A4 vertical)",   en: "Portrait (A4 vertical)", ar: "عمودي (A4)" },
  landscape:    { fr: "Paysage (A4 horizontal)",  en: "Landscape (A4 horizontal)", ar: "أفقي (A4)" },
  directorSection: { fr: "Signatures",              en: "Signatures",          ar: "التوقيعات" },
  directorName:   { fr: "Nom du directeur",        en: "Director name",       ar: "اسم المدير" },
  directorNameAr: { fr: "Nom du directeur (arabe)", en: "Director name (Arabic)", ar: "اسم المدير (عربي)" },
  showTeacher:    { fr: "Afficher l'enseignant",     en: "Show teacher",        ar: "إظهار المعلم" },
  teacherName:    { fr: "Nom de l'enseignant",      en: "Teacher name",        ar: "اسم المعلم" },
  teacherNameAr:  { fr: "Nom de l'enseignant (arabe)", en: "Teacher name (Arabic)", ar: "اسم المعلم (عربي)" },
}

const DEFAULTS: Templates = {
  beginner: {
    id: "islamic", title: "Certificat de Mémorisation", titleAr: "شَهَادَةُ الْحِفْظ",
    subtitle: "Niveau Débutant",
    bodyText: "Pour avoir accompli avec sérieux et persévérance son programme de mémorisation du Saint Coran, et avoir démontré de belles qualités d'apprentissage.",
    arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    primaryColor: "#1a5f4a", accentColor: "#c9a227", lightColor: "#f0f7f4", textColor: "#0d3326",
    badgeEmoji: "🌱", borderStyle: "islamic", fontFamily: "Amiri", fontFamilyAr: "Scheherazade New",
    decorativePattern: "geometric", signatureStyle: "elegant", paperTexture: "parchment",
    orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  intermediate: {
    id: "andalous", title: "Certificat d'Excellence", titleAr: "شَهَادَةُ التَّفَوُّق",
    subtitle: "Niveau Intermédiaire",
    bodyText: "Pour avoir accompli avec brio et dévouement son programme de mémorisation du Saint Coran, et avoir atteint un niveau remarquable de récitation.",
    arabicVerse: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
    primaryColor: "#2d5a3d", accentColor: "#d4a843", lightColor: "#f5f0e6", textColor: "#1a3d2e",
    badgeEmoji: "⭐", borderStyle: "andalous", fontFamily: "Georgia", fontFamilyAr: "Amiri",
    decorativePattern: "floral", signatureStyle: "calligraphic", paperTexture: "cream",
    orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  advanced: {
    id: "ottoman", title: "Certificat d'Honneur", titleAr: "شَهَادَةُ الشَّرَف",
    subtitle: "Niveau Avancé",
    bodyText: "Pour avoir maîtrisé avec distinction et excellence son programme avancé de mémorisation du Saint Coran, et avoir fait preuve d'une dévotion exemplaire.",
    arabicVerse: "إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    primaryColor: "#8b4513", accentColor: "#daa520", lightColor: "#faf5ef", textColor: "#3d2314",
    badgeEmoji: "🏆", borderStyle: "ottoman", fontFamily: "Georgia", fontFamilyAr: "Scheherazade New",
    decorativePattern: "ornate", signatureStyle: "royal", paperTexture: "vintage",
    orientation: "portrait",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: true, teacherName: "", teacherNameAr: "",
  },
  expert: {
    id: "mamlouk", title: "Certificat de Maîtrise", titleAr: "شَهَادَةُ الْإِتْقَان",
    subtitle: "Niveau Expert",
    bodyText: "Pour avoir atteint la maîtrise complète de la mémorisation du Saint Coran avec ijtihad et perfection, et être devenu un modèle d'excellence spirituelle.",
    arabicVerse: "نَحْنُ نَقُصُّ عَلَيْكَ أَحْسَنَ الْقَصَصِ",
    primaryColor: "#1e3a5f", accentColor: "#4a90a4", lightColor: "#eef4f8", textColor: "#0f1f33",
    badgeEmoji: "👑", borderStyle: "mamlouk", fontFamily: "Georgia", fontFamilyAr: "Reem Kufi",
    decorativePattern: "architectural", signatureStyle: "imperial", paperTexture: "linen",
    orientation: "landscape",
    directorName: "Directeur", directorNameAr: "المدير",
    showTeacher: true, teacherName: "", teacherNameAr: "",
  },
}

interface Props { initialTemplates: Partial<Templates>; locale?: Locale }
type Locale = "fr" | "en" | "ar"

export function CertificateTemplateEditor({ initialTemplates, locale }: Props) {
  const { locale: ctxLocale } = useLanguage()
  const L: Locale = locale ?? (ctxLocale as Locale) ?? "fr"
  const u = (k: keyof typeof UI) => UI[k][L] ?? UI[k].fr
  const [templates, setTemplates] = useState<Templates>({
    beginner:     { ...DEFAULTS.beginner,     ...(initialTemplates.beginner     ?? {}) },
    intermediate: { ...DEFAULTS.intermediate, ...(initialTemplates.intermediate ?? {}) },
    advanced:     { ...DEFAULTS.advanced,     ...(initialTemplates.advanced     ?? {}) },
    expert:       { ...DEFAULTS.expert,       ...(initialTemplates.expert       ?? {}) },
  })
  const [activeLevel, setActiveLevel] = useState<keyof Templates>("beginner")
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const t = templates[activeLevel]

  const update = (key: keyof CertTemplate, value: any) => {
    setTemplates(prev => ({ ...prev, [activeLevel]: { ...prev[activeLevel], [key]: value } }))
    setSaved(false)
  }

  const applyPreset = (styleKey: string) => {
    const preset = STYLE_PRESETS[styleKey]
    if (!preset) return
    setTemplates(prev => ({
      ...prev,
      [activeLevel]: {
        ...prev[activeLevel],
        primaryColor: preset.colors[0],
        accentColor: preset.colors[1],
        lightColor: preset.colors[2],
        textColor: preset.colors[3],
        decorativePattern: preset.pattern,
        fontFamily: preset.font,
        fontFamilyAr: preset.fontAr,
        borderStyle: styleKey,
      }
    }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true); setError(null)
    try {
      const r = await fetch("/api/admin/certificate-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templates),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  const reset = () => {
    setTemplates(prev => ({ ...prev, [activeLevel]: { ...DEFAULTS[activeLevel] } }))
    setSaved(false)
  }

  const renderPattern = () => {
    const patterns: Record<string, JSX.Element> = {
      geometric: (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <defs><pattern id="geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon points="20,0 40,20 20,40 0,20" fill="none" stroke={t.accentColor} strokeWidth="0.5" opacity="0.3"/>
            <circle cx="20" cy="20" r="5" fill={t.accentColor} opacity="0.2"/>
          </pattern></defs>
          <rect width="100%" height="60" fill="url(#geo)"/>
        </svg>
      ),
      floral: (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <defs><pattern id="floral" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 15 Q40 5 50 15 Q40 25 30 15 M30 15 Q20 5 10 15 Q20 25 30 15" fill="none" stroke={t.accentColor} strokeWidth="0.8" opacity="0.25"/>
            <circle cx="30" cy="30" r="3" fill={t.primaryColor} opacity="0.15"/>
          </pattern></defs>
          <rect width="100%" height="60" fill="url(#floral)"/>
        </svg>
      ),
      ornate: (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <path d="M0 30 Q50 10 100 30 T200 30 T300 30 T400 30" fill="none" stroke={t.accentColor} strokeWidth="1.5" opacity="0.4"/>
          <path d="M0 30 Q50 50 100 30 T200 30 T300 30 T400 30" fill="none" stroke={t.primaryColor} strokeWidth="1" opacity="0.3"/>
        </svg>
      ),
      architectural: (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <defs><pattern id="arch" x="0" y="0" width="80" height="60" patternUnits="userSpaceOnUse">
            <path d="M10 60 L10 30 Q25 10 40 30 Q55 10 70 30 L70 60" fill="none" stroke={t.accentColor} strokeWidth="1" opacity="0.3"/>
            <rect x="35" y="20" width="10" height="15" fill={t.primaryColor} opacity="0.15"/>
          </pattern></defs>
          <rect width="100%" height="60" fill="url(#arch)"/>
        </svg>
      ),
    }
    return patterns[t.decorativePattern] || patterns.geometric
  }

  const isLandscape = t.orientation === "landscape"
  const previewMaxW = isLandscape ? "600px" : "400px"

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header actions */}
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex gap-2 ml-auto">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
            <RotateCcw size={14} /> {u("resetBtn")}
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition shadow-md">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {u("saveBtn")}
          </button>
        </div>
      </div>

      {saved  && <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm"><CheckCircle2 size={15}/>{u("savedMsg")}</div>}
      {error  && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {/* Onglets niveau */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(LEVEL_META) as (keyof Templates)[]).map(lvl => (
          <button key={lvl} onClick={() => setActiveLevel(lvl)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${activeLevel === lvl ? "border-transparent text-white shadow-md" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"}`}
            style={activeLevel === lvl ? { background: templates[lvl].primaryColor } : {}}>
            {LEVEL_META[lvl].label[L] ?? LEVEL_META[lvl].label.fr}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── Formulaire édition ─── */}
        <div className="space-y-4">
          {/* Préréglages de style */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500"/> {u("stylePreset")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => applyPreset(key)}
                  className={`p-3 rounded-lg border-2 transition text-left ${t.borderStyle === key ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: preset.colors[0] }}/>
                    <div className="w-4 h-4 rounded-full" style={{ background: preset.colors[1] }}/>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{preset.name}</p>
                  <p className="text-xs text-gray-400">{preset.font} + {preset.fontAr}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
              <LayoutTemplate size={16}/> {u("orientation")}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => update("orientation", "portrait")}
                className={`flex-1 p-4 rounded-xl border-2 transition text-center ${t.orientation === "portrait" ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                <div className="w-8 h-12 border-2 border-current rounded mx-auto mb-2" style={{ color: t.primaryColor }}/>
                <p className="text-sm font-medium">{u("portrait")}</p>
              </button>
              <button
                onClick={() => update("orientation", "landscape")}
                className={`flex-1 p-4 rounded-xl border-2 transition text-center ${t.orientation === "landscape" ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                <div className="w-12 h-8 border-2 border-current rounded mx-auto mb-2" style={{ color: t.primaryColor }}/>
                <p className="text-sm font-medium">{u("landscape")}</p>
              </button>
            </div>
          </div>

          {/* Signatures — Directeur + Enseignant */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
              <UserCheck size={16}/> {u("directorSection")}
            </h2>

            {/* Directeur */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("directorName")}</label>
                <input value={t.directorName} onChange={e => update("directorName", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("directorNameAr")}</label>
                <input value={t.directorNameAr} onChange={e => update("directorNameAr", e.target.value)} dir="rtl"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              {/* Toggle enseignant */}
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input 
                  type="checkbox" 
                  checked={t.showTeacher} 
                  onChange={e => update("showTeacher", e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{u("showTeacher")}</span>
              </label>

              {/* Enseignant (si activé) */}
              {t.showTeacher && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("teacherName")}</label>
                    <input value={t.teacherName} onChange={e => update("teacherName", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("teacherNameAr")}</label>
                    <input value={t.teacherNameAr} onChange={e => update("teacherNameAr", e.target.value)} dir="rtl"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
              <Type size={16}/> {u("sectionTitles")}
            </h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("titleMain")}</label>
              <input value={t.title} onChange={e => update("title", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("titleAr")}</label>
              <input value={t.titleAr} onChange={e => update("titleAr", e.target.value)} dir="rtl"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" style={{ fontFamily: t.fontFamilyAr + ', serif' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("subtitle")}</label>
              <input value={t.subtitle} onChange={e => update("subtitle", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
              <BookOpen size={16}/> {u("sectionText")}
            </h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("bodyText")}</label>
              <textarea value={t.bodyText} onChange={e => update("bodyText", e.target.value)} rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("arabicVerse")}</label>
              <input value={t.arabicVerse} onChange={e => update("arabicVerse", e.target.value)} dir="rtl"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" style={{ fontFamily: t.fontFamilyAr + ', serif' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("badgeEmoji")}</label>
              <input value={t.badgeEmoji} onChange={e => update("badgeEmoji", e.target.value)} maxLength={4}
                className="w-24 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xl text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
              <Palette size={16}/> {u("sectionColors")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {([
                { key: "primaryColor",  labelKey: "colorPrimary" },
                { key: "accentColor",   labelKey: "colorAccent" },
                { key: "lightColor",    labelKey: "colorLight" },
                { key: "textColor",     labelKey: "colorText" },
              ] as { key: keyof CertTemplate; labelKey: keyof typeof UI }[]).map(({ key, labelKey }) => (
                <div key={key} className="flex items-center gap-3">
                  <input type="color" value={t[key] as string} onChange={e => update(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0.5 shadow-sm" />
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{u(labelKey)}</p>
                    <p className="text-xs text-gray-400 font-mono">{t[key] as string}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("fontFamily")}</label>
              <select value={t.fontFamily} onChange={e => update("fontFamily", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm mb-2">
                <option value="Georgia">Georgia (Classique)</option>
                <option value="Amiri">Amiri (Islamique)</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="serif">Serif (Générique)</option>
              </select>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("fontFamilyAr")}</label>
              <select value={t.fontFamilyAr} onChange={e => update("fontFamilyAr", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm">
                <option value="Scheherazade New">Scheherazade New (Coranique)</option>
                <option value="Amiri">Amiri (Classique)</option>
                <option value="Reem Kufi">Reem Kufi (Kufi Moderne)</option>
                <option value="Noto Naskh Arabic">Noto Naskh (Lisible)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Prévisualisation ─── */}
        <div className="sticky top-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye size={14}/> {u("preview")}
          </p>
          <p className="text-xs text-gray-400 mb-3">{u("previewNote")}</p>

          <div className="rounded-2xl overflow-hidden shadow-2xl border-2"
            style={{ 
              borderColor: t.accentColor + "60", 
              background: t.lightColor,
              maxWidth: previewMaxW,
              margin: "0 auto"
            }}>

            <div className="relative">
              {renderPattern()}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80"/>
            </div>

            <div className="p-6" style={{ fontFamily: t.fontFamily + ', serif' }}>
              <p className="text-center mb-2 text-sm" dir="rtl"
                style={{ color: t.primaryColor, fontFamily: t.fontFamilyAr + ', serif' }}>
                {t.arabicVerse}
              </p>

              <div className="text-center mb-3">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5" style={{ color: t.accentColor }}>
                  {t.subtitle}
                </p>
                <h2 className="text-lg font-bold" style={{ color: t.textColor }}>{t.title}</h2>
                <p className="text-base mt-0.5" dir="rtl" style={{ color: t.primaryColor, fontFamily: t.fontFamilyAr + ', serif' }}>
                  {t.titleAr}
                </p>
              </div>

              <div className="bg-white/60 rounded-lg p-2 mb-3 border"
                style={{ borderColor: t.accentColor + "30" }}>
                <p className="text-xs text-center" style={{ color: t.textColor + "cc" }}>
                  {t.bodyText}
                </p>
              </div>

              <div className="flex items-center gap-3 mb-3 p-2 bg-white/80 rounded-lg border"
                style={{ borderColor: t.primaryColor + "20" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }}>
                  A
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">{u("awardedTo")}</p>
                  <p className="text-sm font-bold" style={{ color: t.textColor }}>Ahmed Benali</p>
                </div>
              </div>

              {/* Signatures preview */}
              <div className="flex justify-between items-end pt-2 border-t" style={{ borderColor: t.accentColor + "30" }}>
                <div className="text-center">
                  <div className="w-16 h-px mx-auto mb-1" style={{ background: t.primaryColor + "50" }}/>
                  <p className="text-[10px] text-gray-400">{u("direction")}</p>
                  <p className="text-[10px] font-medium" style={{ color: t.textColor }}>{t.directorName}</p>
                  {t.showTeacher && (
                    <>
                      <p className="text-[10px] text-gray-400 mt-1">{u("teacher")}</p>
                      <p className="text-[10px] font-medium" style={{ color: t.textColor }}>{t.teacherName || "Enseignant"}</p>
                    </>
                  )}
                </div>
                <div className="text-center">
                  <div className="w-16 h-px mx-auto mb-1" style={{ background: t.primaryColor + "50"}}/>
                  <p className="text-[10px] text-gray-400">Date</p>
                  <p className="text-[10px] font-medium" style={{ color: t.textColor }}>19/05/2026</p>
                </div>
              </div>
            </div>

            <div className="relative rotate-180">
              {renderPattern()}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}