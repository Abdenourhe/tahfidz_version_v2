"use client"
// src/components/admin/CertificateTemplateEditor.tsx

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, CheckCircle2, Loader2, RotateCcw } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

type Locale = "fr" | "en" | "ar"

export type CertTemplate = {
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
}

export type Templates = {
  beginner: CertTemplate
  intermediate: CertTemplate
  advanced: CertTemplate
}

const LEVEL_META = {
  beginner:     { label: { fr: "🌱 Débutant",     en: "🌱 Beginner",     ar: "🌱 مبتدئ" },     emoji: "🌱" },
  intermediate: { label: { fr: "⭐ Intermédiaire", en: "⭐ Intermediate", ar: "⭐ متوسط" },     emoji: "⭐" },
  advanced:     { label: { fr: "🏆 Avancé",       en: "🏆 Advanced",     ar: "🏆 متقدم" },     emoji: "🏆" },
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
  sectionColors:  { fr: "Couleurs",                 en: "Colors",              ar: "الألوان" },
  colorPrimary:   { fr: "Principale",               en: "Primary",             ar: "الرئيسية" },
  colorAccent:    { fr: "Accent",                   en: "Accent",              ar: "المميزة" },
  colorLight:     { fr: "Fond clair",               en: "Light background",    ar: "الخلفية الفاتحة" },
  colorText:      { fr: "Texte sombre",             en: "Dark text",           ar: "النص الداكن" },
  preview:        { fr: "Prévisualisation",          en: "Preview",             ar: "معاينة" },
  previewNote:    { fr: "Aperçu temps réel — le certificat final est plus grand",
                    en: "Live preview — the final certificate is larger",
                    ar: "معاينة فورية — الشهادة النهائية أكبر" },
  awardedTo:      { fr: "Décerné à",               en: "Awarded to",          ar: "ممنوح لـ" },
  studentName:    { fr: "Nom de l'élève",           en: "Student name",        ar: "اسم الطالب" },
  direction:      { fr: "Direction",                en: "Direction",           ar: "الإدارة" },
  teacher:        { fr: "Enseignant",               en: "Teacher",             ar: "المعلم" },
}

const DEFAULTS: Templates = {
  beginner: {
    title: "Certificat de Mémorisation", titleAr: "شَهَادَةُ الْحِفْظ",
    subtitle: "Niveau Débutant",
    bodyText: "Pour avoir accompli avec sérieux et persévérance son programme de mémorisation du Saint Coran.",
    arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    primaryColor: "#10b981", accentColor: "#059669", lightColor: "#d1fae5", textColor: "#065f46",
    badgeEmoji: "🌱",
  },
  intermediate: {
    title: "Certificat d'Excellence", titleAr: "شَهَادَةُ التَّفَوُّق",
    subtitle: "Niveau Intermédiaire",
    bodyText: "Pour avoir accompli avec brio son programme de mémorisation du Saint Coran.",
    arabicVerse: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
    primaryColor: "#d97706", accentColor: "#b45309", lightColor: "#fef3c7", textColor: "#78350f",
    badgeEmoji: "⭐",
  },
  advanced: {
    title: "Certificat d'Honneur", titleAr: "شَهَادَةُ الشَّرَف",
    subtitle: "Niveau Avancé",
    bodyText: "Pour avoir maîtrisé avec distinction son programme avancé de mémorisation du Saint Coran.",
    arabicVerse: "إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    primaryColor: "#7c3aed", accentColor: "#6d28d9", lightColor: "#ede9fe", textColor: "#4c1d95",
    badgeEmoji: "🏆",
  },
}

interface Props { initialTemplates: Partial<Templates>; locale?: Locale }

export function CertificateTemplateEditor({ initialTemplates, locale }: Props) {
  const { locale: ctxLocale } = useLanguage()
  const L: Locale = locale ?? (ctxLocale as Locale) ?? "fr"
  const u = (k: keyof typeof UI) => UI[k][L] ?? UI[k].fr
  const [templates, setTemplates] = useState<Templates>({
    beginner:     { ...DEFAULTS.beginner,     ...(initialTemplates.beginner     ?? {}) },
    intermediate: { ...DEFAULTS.intermediate, ...(initialTemplates.intermediate ?? {}) },
    advanced:     { ...DEFAULTS.advanced,     ...(initialTemplates.advanced     ?? {}) },
  })
  const [activeLevel, setActiveLevel] = useState<keyof Templates>("beginner")
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const t = templates[activeLevel]

  const update = (key: keyof CertTemplate, value: string) => {
    setTemplates(prev => ({ ...prev, [activeLevel]: { ...prev[activeLevel], [key]: value } }))
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header actions */}
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex gap-2 ml-auto">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600">
            <RotateCcw size={14} /> {u("resetBtn")}
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {u("saveBtn")}
          </button>
        </div>
      </div>

      {saved  && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm"><CheckCircle2 size={15}/>{u("savedMsg")}</div>}
      {error  && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      {/* Onglets niveau */}
      <div className="flex gap-2">
        {(Object.keys(LEVEL_META) as (keyof Templates)[]).map(lvl => (
          <button key={lvl} onClick={() => setActiveLevel(lvl)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${activeLevel === lvl ? "border-transparent text-white shadow-md" : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"}`}
            style={activeLevel === lvl ? { background: templates[lvl].primaryColor } : {}}>
            {LEVEL_META[lvl].label[L] ?? LEVEL_META[lvl].label.fr}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Formulaire édition ─── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">{u("sectionTitles")}</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("titleMain")}</label>
              <input value={t.title} onChange={e => update("title", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("titleAr")}</label>
              <input value={t.titleAr} onChange={e => update("titleAr", e.target.value)} dir="rtl"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm arabic focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("subtitle")}</label>
              <input value={t.subtitle} onChange={e => update("subtitle", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">{u("sectionText")}</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("bodyText")}</label>
              <textarea value={t.bodyText} onChange={e => update("bodyText", e.target.value)} rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("arabicVerse")}</label>
              <input value={t.arabicVerse} onChange={e => update("arabicVerse", e.target.value)} dir="rtl"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm arabic focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{u("badgeEmoji")}</label>
              <input value={t.badgeEmoji} onChange={e => update("badgeEmoji", e.target.value)} maxLength={4}
                className="w-24 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xl text-center focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">{u("sectionColors")}</h2>
            <div className="grid grid-cols-2 gap-4">
              {([
                { key: "primaryColor",  labelKey: "colorPrimary" },
                { key: "accentColor",   labelKey: "colorAccent" },
                { key: "lightColor",    labelKey: "colorLight" },
                { key: "textColor",     labelKey: "colorText" },
              ] as { key: keyof CertTemplate; labelKey: keyof typeof UI }[]).map(({ key, labelKey }) => (
                <div key={key} className="flex items-center gap-3">
                  <input type="color" value={t[key]} onChange={e => update(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{u(labelKey)}</p>
                    <p className="text-xs text-gray-400 font-mono">{t[key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Prévisualisation mini ─── */}
        <div className="sticky top-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{u("preview")}</p>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white text-[10px]">
            {/* Bandeau top */}
            <div className="h-2" style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.accentColor})` }} />
            <div className="p-5">
              {/* Verset arabe */}
              <p className="arabic text-center mb-3 font-bold" style={{ color: t.primaryColor, fontSize: "13px" }}>{t.arabicVerse}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{t.badgeEmoji}</span>
                <div>
                  <p className="font-bold" style={{ color: t.primaryColor }}>{t.title}</p>
                  <p className="text-gray-500">{t.subtitle}</p>
                </div>
              </div>
              <p className="text-center text-gray-600 my-3 leading-relaxed">{t.bodyText}</p>
              <div className="h-px my-3" style={{ background: t.primaryColor + "30" }} />
              <div className="flex justify-between text-gray-400">
                <span>Direction</span>
                <span>{new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "short" })}</span>
              </div>
            </div>
            <div className="h-2" style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.accentColor})` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
