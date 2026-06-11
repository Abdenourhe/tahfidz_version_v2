"use client"
import { useRef, useState, Dispatch, SetStateAction } from "react"
import {
  X, Plus, Pencil, CheckCircle2, Check, Copy, KeyRound,
  Loader2, RefreshCw, ImagePlus, Trash2,
} from "lucide-react"
import { ApprovalResult, FeedbackItem, COUNTRIES } from "./types"
import { formatDate } from "./types"
import { getFeedbackTypeColor, getFeedbackTypeLabel, getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from "./types"

// ─── Create School Modal ──────────────────────────────────────────
export function CreateSchoolModal({
  open,
  form,
  setForm,
  error,
  creating,
  logoFile,
  setLogoFile,
  logoPreview,
  setLogoPreview,
  onClose,
  onSubmit,
}: {
  open: boolean
  form: Record<string, string>
  setForm: Dispatch<SetStateAction<Record<string, string>>>
  error: string | null
  creating: boolean
  logoFile: File | null
  setLogoFile: (f: File | null) => void
  logoPreview: string | null
  setLogoPreview: (v: string | null) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const logoRef = useRef<HTMLInputElement>(null)
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: k === "schoolSlug" ? e.target.value.toLowerCase().replace(/\s+/g, "-") : e.target.value })

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Plus size={18} className="text-tahfidz-green" /> Creer une ecole</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo de l&apos;ecole</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImagePlus size={20} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" onChange={handleLogoChange} className="hidden" />
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition w-full text-center">
                  {logoFile ? logoFile.name : "Choisir un logo (PNG, JPG, SVG)"}
                </button>
                {logoFile && <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoRef.current) logoRef.current.value = "" }} className="text-xs text-red-400 hover:text-red-600 mt-1 flex items-center gap-1"><X size={11} /> Retirer</button>}
                <p className="text-[10px] text-gray-400 mt-1">Max 2 Mo — PNG, JPG, WEBP ou SVG</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Informations de l&apos;ecole</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l&apos;ecole <span className="text-red-500">*</span></label>
              <input value={form.schoolName} onChange={f("schoolName")} required placeholder="Ex : Ecole Iqra Alger"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Identifiant (slug) <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setForm({ ...form, schoolSlug: `${Math.random().toString(36).substring(2, 4).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}` })} className="ml-auto text-[10px] text-tahfidz-green hover:underline flex items-center gap-0.5"><RefreshCw size={10} /> Regenerer</button>
              </div>
              <input value={form.schoolSlug} onChange={f("schoolSlug")} required placeholder="ex: AB-12345"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              <p className="text-[10px] text-gray-400 mt-0.5">Identifiant unique utilise pour la connexion.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <select value={form.plan} onChange={f("plan")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
                <option value="FREE">Free (0€)</option>
                <option value="STARTER">Starter (29€/mois)</option>
                <option value="PRO">Pro (79€/mois)</option>
                <option value="ENTERPRISE">Enterprise (199€/mois)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                <input value={form.city} onChange={f("city")} placeholder="Alger"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pays</label>
                <select value={form.country} onChange={f("country")}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                <input value={form.address} onChange={f("address")} placeholder="Rue, quartier..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telephone</label>
                <input value={form.phone} onChange={f("phone")} placeholder="0555 123 456"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compte administrateur</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet <span className="text-red-500">*</span></label>
              <input value={form.adminName} onChange={f("adminName")} required placeholder="Prénom Nom"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.adminEmail} onChange={f("adminEmail")} required placeholder="admin@ecole.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe <span className="text-red-500">*</span></label>
              <input type="password" value={form.adminPassword} onChange={f("adminPassword")} required minLength={6} placeholder="Min. 6 caracteres"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
            <button type="submit" disabled={creating}
              className="flex-1 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
              {creating ? <><Loader2 size={14} className="animate-spin" /> Creation...</> : <><Plus size={14} /> Creer l&apos;ecole</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Edit School Modal ────────────────────────────────────────────
export function EditSchoolModal({
  open,
  form,
  setForm,
  saving,
  logoFile,
  setLogoFile,
  logoPreview,
  setLogoPreview,
  onClose,
  onSubmit,
}: {
  open: boolean
  form: Record<string, string>
  setForm: Dispatch<SetStateAction<Record<string, string>>>
  saving: boolean
  logoFile: File | null
  setLogoFile: (f: File | null) => void
  logoPreview: string | null
  setLogoPreview: (v: string | null) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const logoRef = useRef<HTMLInputElement>(null)
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Pencil size={18} className="text-tahfidz-green" /> Modifier l&apos;ecole</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo de l&apos;ecole</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImagePlus size={20} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" onChange={handleLogoChange} className="hidden" />
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition w-full text-center">
                  {logoFile ? logoFile.name : "Changer le logo (PNG, JPG, SVG)"}
                </button>
                {logoFile && <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoRef.current) logoRef.current.value = "" }} className="text-xs text-red-400 hover:text-red-600 mt-1 flex items-center gap-1"><X size={11} /> Retirer</button>}
                <p className="text-[10px] text-gray-400 mt-1">Max 2 Mo — PNG, JPG, WEBP ou SVG</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l&apos;ecole</label>
            <input value={form.schoolName} onChange={e => setForm({ ...form, schoolName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
              <option value="FREE">Free</option>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Alger"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pays</label>
              <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Rue, quartier..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telephone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0555 123 456"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Administrateur</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom admin</label>
                <input value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} placeholder="Nom complet"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email admin</label>
                <input type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@ecole.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe <span className="text-gray-400 font-normal">(laisser vide pour ne pas changer)</span></label>
              <input type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} placeholder="..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Enregistrer</> : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Approval Result Modal ────────────────────────────────────────
export function ApprovalResultModal({
  result,
  copied,
  copyToClipboard,
  onClose,
}: {
  result: ApprovalResult | null
  copied: string | null
  copyToClipboard: (text: string, key: string) => void
  onClose: () => void
}) {
  if (!result) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700"><CheckCircle2 size={20} /><h3 className="text-lg font-bold">Ecole approuvee !</h3></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300"><strong>{result.schoolName}</strong> est maintenant active sur la plateforme TAHFIDZ.</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><KeyRound size={12} /> Identifiants de connexion</p>
            <div className="space-y-2">
              {[{ label: "Identifiant ecole (slug)", value: result.slug }, { label: "Plan assigne", value: result.plan }, { label: "Email admin", value: result.adminEmail }, { label: "Admin", value: result.adminName }].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-2"><span className="text-xs text-gray-400 shrink-0">{item.label}</span><div className="flex items-center gap-1.5 min-w-0"><span className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded truncate">{item.value}</span><button onClick={() => copyToClipboard(item.value, `approval-${item.label}`)} className="text-gray-300 hover:text-tahfidz-green transition shrink-0">{copied === `approval-${item.label}` ? <Check size={12} className="text-tahfidz-green" /> : <Copy size={12} />}</button></div></div>
              ))}
            </div>
          </div>
          <div className="bg-tahfidz-green-light dark:bg-emerald-900/30 rounded-lg p-3 text-xs text-tahfidz-green">🔗 URL : <span className="font-mono font-semibold">/login</span> → Slug : <span className="font-mono font-semibold">{result.slug}</span></div>
        </div>
        <div className="p-6 pt-0"><button onClick={onClose} className="w-full py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">Fermer</button></div>
      </div>
    </div>
  )
}

// ─── Feedback Detail Modal ────────────────────────────────────────
export function FeedbackDetailModal({
  feedback,
  open,
  adminNote,
  setAdminNote,
  onClose,
  onReload,
}: {
  feedback: FeedbackItem | null
  open: boolean
  adminNote: string
  setAdminNote: (v: string) => void
  onClose: () => void
  onReload: () => Promise<void>
}) {
  const [updating, setUpdating] = useState(false)
  if (!open || !feedback) return null

  const updateStatus = async (status: string) => {
    setUpdating(true)
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: feedback.id, status }) })
    await onReload()
    setUpdating(false)
  }

  const saveNote = async () => {
    setUpdating(true)
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: feedback.id, adminNote }) })
    await onReload()
    setUpdating(false)
  }

  const remove = async () => {
    if (!confirm("Supprimer ce feedback ?")) return
    setUpdating(true)
    await fetch(`/api/feedback?id=${feedback.id}`, { method: "DELETE" })
    await onReload()
    setUpdating(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${getFeedbackTypeColor(feedback.type)}`}>{getFeedbackTypeLabel(feedback.type)}</span>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{feedback.title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Infos envoyeur */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Expéditeur</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">Nom:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{feedback.user.fullName}</span></div>
              <div><span className="text-gray-400">Email:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{feedback.user.email}</span></div>
              <div><span className="text-gray-400">Rôle:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{feedback.user.role}</span></div>
              {feedback.user.phone && <div><span className="text-gray-400">Tél:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{feedback.user.phone}</span></div>}
              <div><span className="text-gray-400">École:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{feedback.school.name} ({feedback.school.slug})</span></div>
              <div><span className="text-gray-400">Date:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(feedback.createdAt)}</span></div>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{feedback.message}</p>
            </div>
          </div>

          {/* Screenshot */}
          {feedback.screenshot && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Capture d&apos;écran</p>
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img src={feedback.screenshot} alt="Screenshot" className="w-full max-h-80 object-contain bg-gray-50 dark:bg-gray-800" />
              </div>
            </div>
          )}

          {/* Statut & Priorité */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded ${getStatusColor(feedback.status)}`}>{getStatusLabel(feedback.status)}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded ${getPriorityColor(feedback.priority)}`}>{getPriorityLabel(feedback.priority)}</span>
            {feedback.resolvedAt && <span className="text-xs text-gray-400">Résolu le {formatDate(feedback.resolvedAt)}</span>}
          </div>

          {/* Note admin */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Note admin</p>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Ajouter une note interne..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 flex-wrap">
            <button onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">Fermer</button>
            <button onClick={saveNote} disabled={updating}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition flex items-center gap-1.5">
              {updating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Sauvegarder note
            </button>
            <button onClick={() => updateStatus("IN_PROGRESS")} disabled={updating || feedback.status === "IN_PROGRESS"}
              className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 transition">En cours</button>
            <button onClick={() => updateStatus("RESOLVED")} disabled={updating || feedback.status === "RESOLVED"}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 transition flex items-center gap-1.5">
              {updating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Résolu
            </button>
            <button onClick={remove}
              className="px-4 py-2 bg-red-50 text-red-500 text-sm rounded-lg hover:bg-red-100 transition flex items-center gap-1.5"><Trash2 size={12} /> Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
