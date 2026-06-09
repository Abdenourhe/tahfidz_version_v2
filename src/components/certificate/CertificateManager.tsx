"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { ArrowLeft, Plus, Save, Trash2, Loader2, CheckCircle2, Palette, Type, LayoutTemplate, Award } from "lucide-react"
import type { CertificateTemplate, CertConfig } from "./types"
import { DEFAULT_CERT_CONFIG } from "./types"

export function CertificateManager() {
  const { locale, useT } = useLanguage()
  const L = (locale as "fr" | "en" | "ar") ?? "fr"
  // Inline labels used directly below

  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formNameAr, setFormNameAr] = useState("")
  const [formConfig, setFormConfig] = useState<CertConfig>(DEFAULT_CERT_CONFIG)

  const fetchTemplates = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/certificate-templates")
      if (!r.ok) throw new Error("Erreur de chargement")
      const data = await r.json()
      setTemplates(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const resetForm = useCallback(() => {
    setEditingId(null)
    setFormName("")
    setFormNameAr("")
    setFormConfig(DEFAULT_CERT_CONFIG)
  }, [])

  const startEdit = useCallback((tpl: CertificateTemplate) => {
    setEditingId(tpl.id)
    setFormName(tpl.name)
    setFormNameAr(tpl.nameAr ?? "")
    setFormConfig(tpl.config as CertConfig)
  }, [])

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        id: editingId ?? undefined,
        name: formName.trim(),
        nameAr: formNameAr.trim() || null,
        config: formConfig,
        isDefault: templates.length === 0,
        sortOrder: editingId ? undefined : templates.length,
      }
      const r = await fetch("/api/admin/certificate-templates", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error || "Erreur")
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      resetForm()
      fetchTemplates()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(L === "ar" ? "هل أنت متأكد؟" : L === "en" ? "Are you sure?" : "Confirmer la suppression ?")) return
    setError(null)
    try {
      const r = await fetch(`/api/admin/certificate-templates?id=${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Erreur de suppression")
      fetchTemplates()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    }
  }

  const updateConfig = (key: keyof CertConfig, value: any) => {
    setFormConfig((prev) => ({ ...prev, [key]: value }))
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L === "ar" ? "الشهادات" : L === "en" ? "Certificates" : "Certificats"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {L === "ar" ? "إدارة قوالب الشهادات" : L === "en" ? "Manage certificate templates" : "Gérer les modèles de certificats"}
          </p>
        </div>
        <button
          onClick={() => resetForm()}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
        >
          <Plus size={14} /> {L === "ar" ? "جديد" : L === "en" ? "New" : "Nouveau"}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm">
          <CheckCircle2 size={15} /> {L === "ar" ? "تم الحفظ!" : L === "en" ? "Saved!" : "Sauvegardé !"}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Liste des templates */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">
            {L === "ar" ? "القوالب" : L === "en" ? "Templates" : "Modèles"}
          </h2>
          {templates.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              {L === "ar" ? "لا يوجد قوالب" : L === "en" ? "No templates yet" : "Aucun modèle"}
            </p>
          )}
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                editingId === tpl.id
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-900"
              }`}
              onClick={() => startEdit(tpl)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: (tpl.config as any).primaryColor }} />
                  <div>
                    <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{tpl.name}</p>
                    {tpl.nameAr && <p className="text-xs text-gray-400" dir="rtl">{tpl.nameAr}</p>}
                  </div>
                  {tpl.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                      {L === "ar" ? "افتراضي" : L === "en" ? "Default" : "Défaut"}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(tpl.id)
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulaire d'édition */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
            <Award size={16} className="text-amber-500" />
            {editingId
              ? L === "ar" ? "تعديل" : L === "en" ? "Edit" : "Modifier"
              : L === "ar" ? "قالب جديد" : L === "en" ? "New template" : "Nouveau modèle"}
          </h2>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            {/* Nom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {L === "ar" ? "الاسم" : L === "en" ? "Name" : "Nom"}
                </label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {L === "ar" ? "الاسم (عربي)" : L === "en" ? "Name (Arabic)" : "Nom (arabe)"}
                </label>
                <input value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} dir="rtl" className={inputCls} />
              </div>
            </div>

            {/* Titres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {L === "ar" ? "العنوان" : L === "en" ? "Title" : "Titre"}
                </label>
                <input value={formConfig.title} onChange={(e) => updateConfig("title", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {L === "ar" ? "العنوان بالعربية" : L === "en" ? "Title (Arabic)" : "Titre (arabe)"}
                </label>
                <input value={formConfig.titleAr ?? ""} onChange={(e) => updateConfig("titleAr", e.target.value)} dir="rtl" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {L === "ar" ? "العنوان الفرعي" : L === "en" ? "Subtitle" : "Sous-titre"}
              </label>
              <input value={formConfig.subtitle ?? ""} onChange={(e) => updateConfig("subtitle", e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {L === "ar" ? "نص الجسم" : L === "en" ? "Body text" : "Texte du corps"}
              </label>
              <textarea
                value={formConfig.bodyText ?? ""}
                onChange={(e) => updateConfig("bodyText", e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {L === "ar" ? "الآية / النص العربي" : L === "en" ? "Verse / Arabic text" : "Verset / Texte arabe"}
              </label>
              <input
                value={formConfig.arabicVerse ?? ""}
                onChange={(e) => updateConfig("arabicVerse", e.target.value)}
                dir="rtl"
                className={inputCls}
              />
            </div>

            {/* Couleurs */}
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {L === "ar" ? "الألوان" : L === "en" ? "Colors" : "Couleurs"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: "primaryColor" as const, label: L === "ar" ? "رئيسي" : L === "en" ? "Primary" : "Principale" },
                { key: "accentColor" as const, label: L === "ar" ? "مميز" : L === "en" ? "Accent" : "Accent" },
                { key: "lightColor" as const, label: L === "ar" ? "فاتح" : L === "en" ? "Light" : "Clair" },
                { key: "textColor" as const, label: L === "ar" ? "نص" : L === "en" ? "Text" : "Texte" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formConfig[key]}
                    onChange={(e) => updateConfig(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0.5 shadow-sm"
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{formConfig[key]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Polices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {L === "ar" ? "الخط" : L === "en" ? "Font" : "Police"}
                </label>
                <select
                  value={formConfig.fontFamily ?? "Georgia"}
                  onChange={(e) => updateConfig("fontFamily", e.target.value)}
                  className={inputCls}
                >
                  <option value="Georgia">Georgia</option>
                  <option value="Amiri">Amiri</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="serif">Serif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {L === "ar" ? "الخط العربي" : L === "en" ? "Arabic font" : "Police arabe"}
                </label>
                <select
                  value={formConfig.fontFamilyAr ?? "Amiri"}
                  onChange={(e) => updateConfig("fontFamilyAr", e.target.value)}
                  className={inputCls}
                >
                  <option value="Amiri">Amiri</option>
                  <option value="Scheherazade New">Scheherazade New</option>
                  <option value="Reem Kufi">Reem Kufi</option>
                  <option value="Noto Naskh Arabic">Noto Naskh Arabic</option>
                </select>
              </div>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-2">
              <LayoutTemplate size={16} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {L === "ar" ? "الاتجاه" : L === "en" ? "Orientation" : "Orientation"}
              </span>
            </div>
            <div className="flex gap-3">
              {(["portrait", "landscape"] as const).map((ori) => (
                <button
                  key={ori}
                  onClick={() => updateConfig("orientation", ori)}
                  className={`flex-1 p-3 rounded-xl border-2 transition text-center ${
                    formConfig.orientation === ori
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`${ori === "portrait" ? "w-6 h-9" : "w-9 h-6"} border-2 border-current rounded mx-auto mb-1`}
                    style={{ color: formConfig.primaryColor }}
                  />
                  <p className="text-xs font-medium">
                    {ori === "portrait"
                      ? L === "ar" ? "عمودي" : L === "en" ? "Portrait" : "Portrait"
                      : L === "ar" ? "أفقي" : L === "en" ? "Landscape" : "Paysage"}
                  </p>
                </button>
              ))}
            </div>

            {/* Signataires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {L === "ar" ? "المدير" : L === "en" ? "Director" : "Directeur"}
                </label>
                <input
                  value={formConfig.directorName ?? ""}
                  onChange={(e) => updateConfig("directorName", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {L === "ar" ? "المدير (عربي)" : L === "en" ? "Director (Arabic)" : "Directeur (arabe)"}
                </label>
                <input
                  value={formConfig.directorNameAr ?? ""}
                  onChange={(e) => updateConfig("directorNameAr", e.target.value)}
                  dir="rtl"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.showTeacher ?? false}
                  onChange={(e) => updateConfig("showTeacher", e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {L === "ar" ? "إظهار المعلم" : L === "en" ? "Show teacher" : "Afficher l'enseignant"}
                </span>
              </label>
            </div>

            {formConfig.showTeacher && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {L === "ar" ? "المعلم" : L === "en" ? "Teacher" : "Enseignant"}
                  </label>
                  <input
                    value={formConfig.teacherName ?? ""}
                    onChange={(e) => updateConfig("teacherName", e.target.value)}
                    placeholder={L === "ar" ? "تلقائي من ملف الطالب" : L === "en" ? "Auto from student profile" : "Auto depuis le profil élève"}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {L === "ar" ? "المعلم (عربي)" : L === "en" ? "Teacher (Arabic)" : "Enseignant (arabe)"}
                  </label>
                  <input
                    value={formConfig.teacherNameAr ?? ""}
                    onChange={(e) => updateConfig("teacherNameAr", e.target.value)}
                    dir="rtl"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.showStats ?? true}
                  onChange={(e) => updateConfig("showStats", e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {L === "ar" ? "إظهار الإحصائيات" : L === "en" ? "Show stats" : "Afficher les stats"}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.showQr ?? true}
                  onChange={(e) => updateConfig("showQr", e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">QR Code</span>
              </label>
            </div>

            {/* Boutons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition shadow-md"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editingId
                  ? L === "ar" ? "تحديث" : L === "en" ? "Update" : "Mettre à jour"
                  : L === "ar" ? "حفظ" : L === "en" ? "Save" : "Enregistrer"}
              </button>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
                >
                  {L === "ar" ? "إلغاء" : L === "en" ? "Cancel" : "Annuler"}
                </button>
              )}
            </div>
          </div>

          {/* Mini preview */}
          {formName && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {L === "ar" ? "معاينة" : L === "en" ? "Preview" : "Aperçu"}
              </p>
              <div
                className="rounded-lg overflow-hidden mx-auto shadow-lg border"
                style={{
                  maxWidth: formConfig.orientation === "landscape" ? "320px" : "220px",
                  aspectRatio: formConfig.orientation === "landscape" ? "297/210" : "210/297",
                  background: formConfig.lightColor,
                  borderColor: `${formConfig.accentColor}60`,
                }}
              >
                <div className="h-full flex flex-col items-center justify-center p-3 text-center">
                  <p className="text-[8px] font-bold mb-1" style={{ color: formConfig.accentColor }}>
                    {formConfig.subtitle}
                  </p>
                  <p className="text-sm font-bold" style={{ color: formConfig.textColor }}>
                    {formConfig.title}
                  </p>
                  {formConfig.titleAr && (
                    <p className="text-xs mt-0.5" dir="rtl" style={{ color: formConfig.primaryColor }}>
                      {formConfig.titleAr}
                    </p>
                  )}
                  <div className="w-6 h-0.5 rounded-full my-2" style={{ background: formConfig.accentColor }} />
                  <p className="text-[8px] text-gray-400">
                    {L === "ar" ? "تُمنح لـ" : L === "en" ? "Awarded to" : "Décerné à"}
                  </p>
                  <p className="text-xs font-bold" style={{ color: formConfig.textColor }}>
                    Ahmed Benali
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
