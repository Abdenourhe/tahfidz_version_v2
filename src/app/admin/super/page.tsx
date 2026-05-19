"use client"
// src/app/admin/super/page.tsx — Dashboard Super-Admin TAHFIDZ v2

import Image from "next/image"
import { useState, useEffect, useCallback, useRef, Fragment, useMemo } from "react"
import {
  Loader2, Plus, Building2, Users, ToggleLeft, ToggleRight,
  CheckCircle2, X, LogOut, Clock, Check, Ban, Copy, KeyRound,
  Phone, Mail, MapPin, ChevronDown, ChevronRight, GraduationCap, BookOpen, UserCog,
  Pencil, Trash2, RefreshCw, Sun, Moon, Search, Download, ImagePlus,
  Activity, AlertTriangle, Zap, BarChart3, TrendingUp, TrendingDown,
  MessageSquare, Bell, Send, Eye, Filter, Calendar, ChevronLeft,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useDebounce } from "use-debounce"
import { Toaster, toast } from "sonner"
/* ─── Types ─────────────────────────────────────────────────────── */
interface SchoolUser {
  id: string; fullName: string; email: string; role: string; isActive: boolean; createdAt: string
}
interface School {
  id: string; name: string; nameAr: string | null; slug: string; plan: string
  isActive: boolean; createdAt: string; logo: string | null
  address: string | null; city: string | null; country: string | null; phone: string | null
  _count: { users: number }
  users: SchoolUser[]
}
interface SchoolRequest {
  id: string; schoolName: string; city: string | null; country: string
  adminName: string; adminEmail: string; adminPhone: string | null
  classCount: number; studentsPerClass: number; teachersCount: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  slug: string | null; createdAt: string; processedAt: string | null
}
interface ApprovalResult {
  schoolName: string; slug: string; plan: string; adminEmail: string; adminName: string
}
interface AuditLog {
  id: string; action: string; actor: string; target: string; details: string
  createdAt: string
}
interface SystemHealth {
  status: "healthy" | "warning" | "critical"; apiLatency: number; dbStatus: string
  lastError: string | null; errorCount24h: number
}
interface ImpersonateResult {
  url: string; token: string
}

/* ─── Constantes ─────────────────────────────────────────────────── */
const EMPTY_FORM = {
  schoolName: "", schoolSlug: "", plan: "FREE",
  address: "", city: "", country: "DZ", phone: "",
  adminEmail: "", adminName: "", adminPassword: "",
}

const PLAN_PRICES: Record<string, number> = {
  FREE: 0, STARTER: 29, PRO: 79, ENTERPRISE: 199,
}

const COUNTRIES = [
  { code: "DZ", name: "Algérie" },
  { code: "MA", name: "Maroc" },
  { code: "TN", name: "Tunisie" },
  { code: "LY", name: "Libye" },
  { code: "EG", name: "Égypte" },
  { code: "SA", name: "Arabie Saoudite" },
  { code: "AE", name: "Émirats Arabes Unis" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Koweït" },
  { code: "BH", name: "Bahreïn" },
  { code: "OM", name: "Oman" },
  { code: "JO", name: "Jordanie" },
  { code: "LB", name: "Liban" },
  { code: "SY", name: "Syrie" },
  { code: "IQ", name: "Irak" },
  { code: "PS", name: "Palestine" },
  { code: "SD", name: "Soudan" },
  { code: "MR", name: "Mauritanie" },
  { code: "SO", name: "Somalie" },
  { code: "DJ", name: "Djibouti" },
  { code: "KM", name: "Comores" },
  { code: "SN", name: "Sénégal" },
  { code: "ML", name: "Mali" },
  { code: "NE", name: "Niger" },
  { code: "TD", name: "Tchad" },
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "DE", name: "Allemagne" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "CA", name: "Canada" },
  { code: "US", name: "États-Unis" },
  { code: "OTHER", name: "Autre" },
]

/* ─── Helpers ────────────────────────────────────────────────────── */
function generateSlug(): string {
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  return `${L[Math.floor(Math.random() * 26)]}${L[Math.floor(Math.random() * 26)]}-${Math.floor(10000 + Math.random() * 90000)}`
}

function formatPhone(raw: string | null): string {
  if (!raw) return "—"
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("213") && digits.length >= 11) {
    const local = digits.slice(3)
    return `(+213) ${local.slice(0,3)} ${local.slice(3,6)} ${local.slice(6)}`
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `(+213) ${digits.slice(1,4)} ${digits.slice(4,7)} ${digits.slice(7)}`
  }
  return raw
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

/* ─── RequestCard ────────────────────────────────────────────────── */
function RequestCard({ r, processing, onApprove, onReject, onDelete }: {
  r: SchoolRequest; processing: string | null
  onApprove: (id: string) => void; onReject: (id: string) => void; onDelete?: (id: string) => void
}) {
  return (
    <div className={`p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${r.status !== "PENDING" ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{r.schoolName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              r.status === "PENDING" ? "bg-orange-100 text-orange-600" :
              r.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"
            }`}>{r.status === "PENDING" ? "En attente" : r.status === "APPROVED" ? "Approuvee" : "Rejetee"}</span>
            {r.slug && <span className="font-mono bg-tahfidz-green-light text-tahfidz-green px-2 py-0.5 rounded text-[10px]">🔑 {r.slug}</span>}
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11} />{r.city ? `${r.city}, ` : ""}{r.country}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"><Users size={13} className="text-tahfidz-green shrink-0" /><span className="font-medium">{r.adminName}</span></div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"><Phone size={13} className="text-tahfidz-green shrink-0" /><span className="font-mono tracking-wide">{formatPhone(r.adminPhone)}</span></div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 col-span-2"><Mail size={11} className="shrink-0" />{r.adminEmail}</div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{r.classCount} classes x {r.studentsPerClass} eleves = <strong className="text-gray-600 dark:text-gray-300">{r.classCount * r.studentsPerClass}</strong> eleves — {r.teachersCount} enseignants</p>
          <p className="text-xs text-gray-300 mt-0.5">{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0 items-end">
          {r.status === "PENDING" && (<>
            <button onClick={() => onApprove(r.id)} disabled={processing === r.id}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 disabled:opacity-50 transition">
              {processing === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}Approuver
            </button>
            <button onClick={() => onReject(r.id)} disabled={processing === r.id}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition">
              <Ban size={13} /> Rejeter
            </button>
          </>)}
          {r.status !== "PENDING" && onDelete && (
            <button onClick={() => onDelete(r.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
              <Trash2 size={12} /> Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Mini chart component ─────────────────────────────────────── */
function MiniBarChart({ data, color = "bg-tahfidz-green" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div key={i} className={`w-1.5 rounded-sm ${color}`} style={{ height: `${(v / max) * 100}%`, opacity: 0.3 + (i / data.length) * 0.7 }} />
      ))}
    </div>
  )
}

/* ─── Page principale ────────────────────────────────────────────── */
export default function SuperAdminPage() {
  /* ── États existants ── */
  const [tab, setTab] = useState<"schools" | "requests" | "health" | "audit" | "broadcast">("schools")
  const [schools, setSchools] = useState<School[]>([])
  const [requests, setRequests] = useState<SchoolRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ schoolId: "", schoolName: "", plan: "FREE", address: "", city: "", country: "DZ", phone: "", adminId: "", adminName: "", adminEmail: "", adminPassword: "" })
  const [dark, setDark] = useState(false)
  const [search, setSearch] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  /* ── Auto-refresh ── */
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  /* ── Filtres avancés ── */
  const [filterPlan, setFilterPlan] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  /* ── NOUVEAUX ÉTATS ── */
  // 2. Health & Monitoring
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)

  // 3. Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditFilter, setAuditFilter] = useState("")

  // 4. Analytics
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")

  // 5. Broadcast
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "active" | "inactive">("all")
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [showImpersonate, setShowImpersonate] = useState(false)
  const [impersonateSchool, setImpersonateSchool] = useState<School | null>(null)

  /* ── Dark mode ── */
  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const isDark = saved === "dark"
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle("dark")
    setDark(isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  /* ── Logo preview ── */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  /* ── Data ── */
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/schools")
    if (res.ok) {
      const data = await res.json()
      setSchools(data.schools || [])
      setRequests(data.requests || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 4000) }

  /* ── 2. Health Monitoring ── */
  const loadHealth = useCallback(async () => {
    setHealthLoading(true)
    const res = await fetch("/api/admin/health")
    if (res.ok) {
      const data = await res.json()
      setHealth(data)
    }
    setHealthLoading(false)
  }, [])

  useEffect(() => {
    if (tab === "health") loadHealth()
  }, [tab, loadHealth])

  /* ── 3. Audit Log ── */
  const loadAudit = useCallback(async () => {
    setAuditLoading(true)
    const res = await fetch("/api/admin/audit")
    if (res.ok) {
      const data = await res.json()
      setAuditLogs(data.logs || [])
    }
    setAuditLoading(false)
  }, [])

  useEffect(() => {
    if (tab === "audit") loadAudit()
  }, [tab, loadAudit])

    /* ── Filtre + Pagination ── */
  const filteredSchools = useMemo(() => {
    let result = [...schools]
    
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q))
      )
    }
    
    if (filterPlan !== "ALL") {
      result = result.filter(s => s.plan === filterPlan)
    }
    
    if (filterStatus === "ACTIVE") result = result.filter(s => s.isActive)
    if (filterStatus === "INACTIVE") result = result.filter(s => !s.isActive)
    
    return result
  }, [schools, search, filterPlan, filterStatus])

  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredSchools.slice(start, start + itemsPerPage)
  }, [filteredSchools, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / itemsPerPage))

  /* ── Auto-refresh ── */
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      load()
      setLastRefresh(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, load])

  /* ── Reset page on filter change ── */
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterPlan, filterStatus, itemsPerPage])

  /* ── Actions existantes ── */
  const toggle = async (id: string, current: boolean) => {
    await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "toggle", schoolId: id, isActive: !current }) })
    load()
  }

  const copyToClipboard = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000) }

  const approve = async (requestId: string) => {
    setProcessing(requestId)
    const res = await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "approve", requestId }) })
    if (res.ok) {
      const data = await res.json(); await load()
      setApprovalResult({ schoolName: data.schoolName, slug: data.slug, plan: data.plan, adminEmail: data.adminEmail, adminName: data.adminName })
      setTab("schools")
    } else { setError((await res.json()).error) }
    setProcessing(null)
  }

  const reject = async (requestId: string) => {
    setProcessing(requestId)
    await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "reject", requestId }) })
    await load(); toast.error("Demande rejetee."); setProcessing(null)
  }

  const clearHistory = async () => {
    if (!confirm(`Supprimer les ${processed.length} demande(s) traitees ?`)) return
    await fetch("/api/admin/schools?type=history", { method: "DELETE" }); await load(); setShowHistory(false); flash("Historique vide.")
  }

  const deleteRequest = async (requestId: string) => {
    if (!confirm("Supprimer cette demande definitivement ?")) return
    await fetch(`/api/admin/schools?type=request&id=${requestId}`, { method: "DELETE" }); await load()
  }

  const deleteSchool = async (school: School) => {
    if (!confirm(`⚠️ Supprimer "${school.name}" et TOUS ses utilisateurs ? Cette action est irreversible.`)) return
    const res = await fetch(`/api/admin/schools?type=school&id=${school.id}`, { method: "DELETE" })
    if (res.ok) { setExpandedSchool(null); await load(); flash(`Ecole "${school.name}" supprimee.`) }
    else { setError((await res.json()).error) }
  }

  const openEdit = (s: School) => {
    const admin = s.users.find(u => u.role === "ADMIN" || u.role === "SUPERADMIN")
    setEditForm({ schoolId: s.id, schoolName: s.name, plan: s.plan, address: s.address ?? "", city: s.city ?? "", country: s.country ?? "DZ", phone: s.phone ?? "", adminId: admin?.id ?? "", adminName: admin?.fullName ?? "", adminEmail: admin?.email ?? "", adminPassword: "" })
    setShowEdit(true)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null)
    const res = await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update-school", ...editForm }) })
    if (res.ok) { setShowEdit(false); await load(); flash("Informations mises a jour.") }
    else { setError((await res.json()).error || "Erreur") }
    setSaving(false)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setError(null)
    const res = await fetch("/api/admin/schools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    if (res.ok) {
      const data = await res.json()
      if (logoFile && data.school?.id) { const fd = new FormData(); fd.append("logo", logoFile); fd.append("schoolId", data.school.id); await fetch("/api/admin/schools/logo", { method: "POST", body: fd }) }
      toast.success("Ecole creee avec succes !"); setShowForm(false); setForm(EMPTY_FORM); setLogoFile(null); setLogoPreview(null); load()
    } else { setError((await res.json()).error || "Erreur") }
    setCreating(false)
  }

  const f = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: k === "schoolSlug" ? e.target.value.toLowerCase().replace(/\s+/g, "-") : e.target.value }))

  const exportCSV = () => {
    const rows = [["Nom", "Slug", "Plan", "Statut", "Utilisateurs", "Ville", "Pays", "Creation"], ...schools.map(s => [s.name, s.slug, s.plan, s.isActive ? "Active" : "Inactive", String(s._count.users), s.city || "", s.country || "", new Date(s.createdAt).toLocaleDateString("fr-FR")])]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "ecoles_tahfidz.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  /* ── 3. Bulk Actions ── */
  const toggleSelectSchool = (id: string) => {
    const next = new Set(selectedSchools)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedSchools(next)
    setShowBulkActions(next.size > 0)
  }

  const selectAll = () => {
    if (selectedSchools.size === filteredSchools.length) {
      setSelectedSchools(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedSchools(new Set(filteredSchools.map(s => s.id)))
      setShowBulkActions(true)
    }
  }

  const bulkToggle = async (active: boolean) => {
    if (!confirm(`${active ? "Activer" : "Desactiver"} ${selectedSchools.size} ecole(s) ?`)) return
    await Promise.all([...selectedSchools].map(id =>
      fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "toggle", schoolId: id, isActive: active }) })
    ))
    setSelectedSchools(new Set()); setShowBulkActions(false); await load(); flash(`${selectedSchools.size} ecole(s) ${active ? "activee(s)" : "desactivee(s)"}.`)
  }

  const bulkDelete = async () => {
    if (!confirm(`⚠️ SUPPRIMER ${selectedSchools.size} ecole(s) et TOUS leurs utilisateurs ? IRREVERSIBLE.`)) return
    await Promise.all([...selectedSchools].map(id =>
      fetch(`/api/admin/schools?type=school&id=${id}`, { method: "DELETE" })
    ))
    setSelectedSchools(new Set()); setShowBulkActions(false); await load(); flash(`${selectedSchools.size} ecole(s) supprimee(s).`)
  }

  /* ── 4. Impersonate ── */
  const impersonate = async (school: School) => {
    setImpersonateSchool(school)
    setShowImpersonate(true)
  }

  const confirmImpersonate = async () => {
    if (!impersonateSchool) return
    const res = await fetch("/api/admin/impersonate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: impersonateSchool.id }),
    })
    if (res.ok) {
      const data = await res.json()
      window.location.href = data.redirectUrl  // Redirection dans la même fenêtre
    } else {
      setError("Erreur d'impersonation")
    }
  }

  /* ── 5. Broadcast ── */
  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastMessage.trim()) return
    setBroadcastSending(true)
    const res = await fetch("/api/admin/broadcast", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: broadcastMessage, target: broadcastTarget }),
    })
    if (res.ok) {
      flash(`Message envoye a ${broadcastTarget === "all" ? "toutes" : broadcastTarget === "active" ? "actives" : "inactives"} les ecoles !`)
      setBroadcastMessage("")
    } else {
      setError("Erreur d'envoi du broadcast")
    }
    setBroadcastSending(false)
  }

  /* ── Computed ── */
  const pending = requests.filter(r => r.status === "PENDING")
  const processed = requests.filter(r => r.status !== "PENDING")
  const active = schools.filter(s => s.isActive).length
  const inactive = schools.filter(s => !s.isActive).length
  const totalUsers = schools.reduce((n, s) => n + s._count.users, 0)
  const totalStudents = schools.reduce((n, s) => n + s.users.filter(u => u.role === "STUDENT").length, 0)
  const totalTeachers = schools.reduce((n, s) => n + s.users.filter(u => u.role === "TEACHER").length, 0)
  const planCounts = schools.reduce<Record<string, number>>((acc, s) => { acc[s.plan] = (acc[s.plan] || 0) + 1; return acc }, {})
  const mrr = Object.entries(planCounts).reduce((sum, [plan, count]) => sum + (PLAN_PRICES[plan] || 0) * count, 0)

  // Growth data for chart
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
  const growthData = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i))
    const dateStr = d.toISOString().split("T")[0]
    const count = schools.filter(s => new Date(s.createdAt).toISOString().split("T")[0] === dateStr).length
    return { date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), count }
  })

  // Top schools
  const topSchools = [...schools].sort((a, b) => b._count.users - a._count.users).slice(0, 5)

  // Audit filter
  const filteredAudit = auditFilter.trim() ? auditLogs.filter(l => l.action.toLowerCase().includes(auditFilter.toLowerCase()) || l.actor.toLowerCase().includes(auditFilter.toLowerCase()) || l.target.toLowerCase().includes(auditFilter.toLowerCase())) : auditLogs

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <Loader2 className="animate-spin text-tahfidz-green" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-right" richColors />
      {/* ── Header ── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-tahfidz flex items-center justify-center shadow"><span className="text-white text-sm font-bold">TH</span></div>
          <div><h1 className="font-bold text-gray-900 dark:text-gray-100">TAHFIDZ — Super Admin</h1><p className="text-xs text-gray-400 dark:text-gray-500">Tableau de bord plateforme</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDark} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs transition" title={dark ? "Mode clair" : "Mode sombre"}>
            {dark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}<span className="hidden sm:inline">{dark ? "Clair" : "Sombre"}</span>
          </button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition">
            <LogOut size={15} /> <span className="hidden sm:inline">Deconnexion</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-5">
        {success && <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm"><CheckCircle2 size={16} /> {success}</div>}
        {error && <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}<button onClick={() => setError(null)}><X size={16} /></button></div>}

        {/* ── Stats principales ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: "Ecoles totales", value: schools.length, color: "text-tahfidz-green", bg: "bg-tahfidz-green-light dark:bg-emerald-900/30", icon: <Building2 size={16} /> },
            { label: "Actives", value: active, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30", icon: <CheckCircle2 size={16} /> },
            { label: "Inactives", value: inactive, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/30", icon: <Ban size={16} /> },
            { label: "En attente", value: pending.length, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/30", icon: <Clock size={16} /> },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
              <div className={`${s.bg} ${s.color} p-2.5 rounded-lg`}>{s.icon}</div>
              <div><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* ── Stats financieres ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><TrendingUp size={15} className="text-tahfidz-green" /><span className="text-sm text-gray-600 dark:text-gray-300">MRR estimé</span></div>
            <span className="text-xl font-bold text-tahfidz-green">{mrr}€/mois</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><BarChart3 size={15} className="text-tahfidz-purple" /><span className="text-sm text-gray-600 dark:text-gray-300">ARR estimé</span></div>
            <span className="text-xl font-bold text-tahfidz-purple">{mrr * 12}€/an</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><Users size={15} className="text-blue-500" /><span className="text-sm text-gray-600 dark:text-gray-300">ARPU estimé</span></div>
            <span className="text-xl font-bold text-blue-500">{schools.length > 0 ? (mrr / schools.length).toFixed(1) : "0"}€/ecole</span>
          </div>
        </div>

        {/* ── Stats secondaires ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{ label: "Utilisateurs totaux", value: totalUsers, color: "text-tahfidz-purple", icon: <Users size={15} /> },
            { label: "Eleves (toutes ecoles)", value: totalStudents, color: "text-tahfidz-green", icon: <GraduationCap size={15} /> },
            { label: "Enseignants", value: totalTeachers, color: "text-blue-500", icon: <BookOpen size={15} /> },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><span className={s.color}>{s.icon}</span><span className="text-sm text-gray-600 dark:text-gray-300">{s.label}</span></div>
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ── Plans distribution ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Repartition des plans</p>
          <div className="flex gap-3 flex-wrap">
            {[{ plan: "FREE", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
              { plan: "STARTER", color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
              { plan: "PRO", color: "bg-tahfidz-purple-light text-tahfidz-purple dark:bg-purple-900/30 dark:text-purple-400" },
              { plan: "ENTERPRISE", color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
            ].map(({ plan, color }) => (
              <div key={plan} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${color}`}>
                <span className="text-xs font-bold">{plan}</span>
                <span className="text-lg font-bold">{planCounts[plan] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
            {[
              { id: "schools", label: "Ecoles", icon: <Building2 size={15} />, count: schools.length, color: "text-tahfidz-green", border: "border-tahfidz-green" },
              { id: "requests", label: "Demandes", icon: <Clock size={15} />, count: pending.length, color: "text-orange-500", border: "border-orange-500", badge: pending.length > 0 },
              { id: "health", label: "Sante", icon: <Activity size={15} />, color: "text-red-500", border: "border-red-500" },
              { id: "audit", label: "Audit", icon: <Eye size={15} />, color: "text-tahfidz-purple", border: "border-tahfidz-purple" },
              { id: "broadcast", label: "Broadcast", icon: <Send size={15} />, color: "text-blue-500", border: "border-blue-500" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`flex-1 py-3.5 text-sm font-medium transition whitespace-nowrap ${tab === t.id ? `${t.color} border-b-2 ${t.border}` : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
                {t.icon}<span className="ml-1.5">{t.label}</span>
                {t.badge && <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold">{t.count}</span>}
              </button>
            ))}
          </div>


          {/* ── Tab Ecoles ── */}
          {tab === "schools" && (<>
                        {/* Barre de filtres avancés */}
            <div className="p-4 border-b border-gray-50 dark:border-gray-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, slug, ville..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                  {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={13} /></button>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition" title="Exporter CSV"><Download size={14} /> CSV</button>
                  <button onClick={() => { setForm(p => ({ ...p, schoolSlug: generateSlug() })); setShowForm(true); setError(null); setLogoFile(null); setLogoPreview(null) }}
                    className="flex items-center gap-1.5 px-4 py-2 gradient-tahfidz text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"><Plus size={14} /> Creer</button>
                </div>
              </div>
              
              {/* Filtres avancés */}
              <div className="flex flex-wrap items-center gap-2">
                <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                  <option value="ALL">Tous les plans</option>
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                  <option value="ALL">Tous les statuts</option>
                  <option value="ACTIVE">Actives</option>
                  <option value="INACTIVE">Inactives</option>
                </select>
                <button onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition ${autoRefresh ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-gray-200 dark:border-gray-700 text-gray-500"}`}>
                  <RefreshCw size={12} className={autoRefresh ? "animate-spin" : ""} />
                  Auto {autoRefresh ? "ON" : "OFF"}
                </button>
                {autoRefresh && <span className="text-[10px] text-gray-400">Refresh: {lastRefresh.toLocaleTimeString()}</span>}
                <span className="text-xs text-gray-400 ml-auto">{filteredSchools.length} ecole(s)</span>
              </div>
            </div>

            {/* Bulk actions bar */}
            {showBulkActions && (
              <div className="px-4 py-3 bg-tahfidz-green-light dark:bg-emerald-900/30 border-b border-tahfidz-green/20 flex items-center justify-between">
                <span className="text-sm text-tahfidz-green font-medium">{selectedSchools.size} selectionnee(s)</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => bulkToggle(true)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition flex items-center gap-1"><Check size={12} /> Activer</button>
                  <button onClick={() => bulkToggle(false)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition flex items-center gap-1"><Ban size={12} /> Desactiver</button>
                  <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1"><Trash2 size={12} /> Supprimer</button>
                  <button onClick={() => { setSelectedSchools(new Set()); setShowBulkActions(false) }} className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs"><X size={12} /></button>
                </div>
              </div>
            )}

            {search.trim() && <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">{filteredSchools.length} resultat{filteredSchools.length !== 1 ? "s" : ""} pour &laquo;{search}&raquo;</div>}

            {/* Growth chart */}
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><TrendingUp size={14} className="text-tahfidz-green" /> Croissance des inscriptions</h4>
                <div className="flex gap-1">
                  {(["7d", "30d", "90d", "1y"] as const).map(r => (
                    <button key={r} onClick={() => setTimeRange(r)} className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${timeRange === r ? "bg-tahfidz-green text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"}`}>
                      {r === "7d" ? "7j" : r === "30d" ? "30j" : r === "90d" ? "90j" : "1an"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-1 h-16">
                {growthData.map((d, i) => {
                  const max = Math.max(...growthData.map(g => g.count), 1)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full bg-tahfidz-green/20 dark:bg-tahfidz-green/30 rounded-t-sm transition-all hover:bg-tahfidz-green/40" style={{ height: `${(d.count / max) * 100}%` }} />
                      <span className="text-[8px] text-gray-400 rotate-45 origin-left translate-y-1">{d.date}</span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">{d.count} ecole(s)</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top schools */}
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5"><Zap size={14} className="text-amber-500" /> Top ecoles par utilisateurs</h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {topSchools.map((s, i) => (
                  <div key={s.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold text-xs">#{i + 1}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{s.name}</p>
                    <p className="text-xs text-tahfidz-green font-bold">{s._count.users} users</p>
                    <p className="text-[10px] text-gray-400">{s.plan}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="w-8 px-3 py-3"><input type="checkbox" checked={selectedSchools.size === filteredSchools.length && filteredSchools.length > 0} onChange={selectAll} className="rounded border-gray-300" /></th>
                    <th className="w-8 px-3 py-3"></th>
                    {["Logo", "Ecole", "Slug", "Plan", "Users", "Creation", "Statut", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedSchools.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">{search ? `Aucune ecole trouvee pour &laquo;${search}&raquo;` : "Aucune ecole"}</td></tr>
                  ) : paginatedSchools.map(s => {
                    const admin = s.users.find(u => u.role === "ADMIN" || u.role === "SUPERADMIN")
                    const byRole = s.users.reduce<Record<string, number>>((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc }, {})
                    const isOpen = expandedSchool === s.id
                    const isSelected = selectedSchools.has(s.id)
                    return (
                      <Fragment key={s.id}>
                        <tr
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition border-t border-gray-50 dark:border-gray-800 cursor-pointer select-none ${isSelected ? "bg-tahfidz-green-light/30 dark:bg-emerald-900/20" : ""}`}
                          onClick={() => setExpandedSchool(isOpen ? null : s.id)}
                        >
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={() => toggleSelectSchool(s.id)} className="rounded border-gray-300" /></td>
                          <td className="px-3 py-3 text-gray-300">
                            {isOpen ? <ChevronDown size={14} className="text-tahfidz-green" /> : <ChevronRight size={14} />}
                          </td>
                          <td className="px-4 py-3"><div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0">{s.logo ? (<Image src={s.logo} alt={s.name} width={36} height={36} className="w-full h-full object-contain p-0.5 bg-white" unoptimized />) : (<div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center"><span className="text-white font-bold text-sm">{s.name.charAt(0)}</span></div>)}</div></td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                          <td className="px-4 py-3"><div className="flex items-center gap-1.5"><span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{s.slug}</span><button onClick={() => copyToClipboard(s.slug, `slug-${s.id}`)} className="text-gray-300 hover:text-tahfidz-green transition">{copied === `slug-${s.id}` ? <Check size={12} className="text-tahfidz-green" /> : <Copy size={12} />}</button></div></td>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.plan === "ENTERPRISE" ? "bg-amber-100 text-amber-700" : s.plan === "PRO" ? "bg-tahfidz-purple-light text-tahfidz-purple" : s.plan === "STARTER" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{s.plan}</span></td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">{s._count.users}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button onClick={() => toggle(s.id, s.isActive)} title={s.isActive ? "Desactiver" : "Activer"} className={`p-1.5 rounded-lg transition ${s.isActive ? "hover:bg-red-50 text-red-400" : "hover:bg-green-50 text-gray-400 hover:text-green-600"}`}>{s.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button>
                              <button onClick={() => openEdit(s)} title="Modifier" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-300 hover:text-blue-500 transition"><Pencil size={15} /></button>
                              <button onClick={() => impersonate(s)} title="Voir comme admin" className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-300 hover:text-purple-500 transition"><Eye size={15} /></button>
                              <button onClick={() => deleteSchool(s)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                        {isOpen && (<tr><td colSpan={10} className="bg-gradient-to-r from-tahfidz-green-light/30 to-white dark:from-emerald-900/20 dark:to-gray-900 px-6 py-5 border-b border-tahfidz-green/10 dark:border-emerald-900/30">
                          <div className="flex items-center gap-4 mb-5 pb-4 border-b border-tahfidz-green/10 dark:border-emerald-900/30">
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0">{s.logo ? (<Image src={s.logo} alt={s.name} width={56} height={56} className="w-full h-full object-contain p-1 bg-white" unoptimized />) : (<div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center"><span className="text-white font-bold text-xl">{s.name.charAt(0)}</span></div>)}</div>
                            <div><h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{s.name}</h3>{s.nameAr && <p className="arabic text-sm text-gray-500 dark:text-gray-400">{s.nameAr}</p>}<div className="flex items-center gap-2 mt-1"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>{s.isActive ? "Active" : "Inactive"}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.plan === "ENTERPRISE" ? "bg-amber-100 text-amber-700" : s.plan === "PRO" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>{s.plan}</span>{!s.logo && <span className="text-[10px] text-gray-300 italic">Aucun logo</span>}</div></div>
                          </div>
                          <div className="grid grid-cols-4 gap-5">
                            <div className="space-y-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><MapPin size={11} /> Coordonnees</p><div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2">{s.address && <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300"><MapPin size={11} className="text-tahfidz-green mt-0.5 shrink-0" /><span>{s.address}</span></div>}<div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><Building2 size={11} className="text-tahfidz-green shrink-0" /><span>{[s.city, s.country].filter(Boolean).join(", ") || <span className="italic text-gray-300">Non renseigne</span>}</span></div>{s.phone && <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><Phone size={11} className="text-tahfidz-green shrink-0" /><span className="font-mono">{formatPhone(s.phone)}</span></div>}{!s.address && !s.city && !s.phone && <p className="text-xs text-gray-300 italic">Aucune coordonnee</p>}</div></div>
                            <div className="space-y-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><UserCog size={11} /> Administrateur</p>{admin ? (<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-1.5"><p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{admin.fullName}</p><p className="text-xs text-gray-400 flex items-center gap-1.5"><Mail size={11} />{admin.email}</p><div className="flex items-center gap-2 pt-1"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${admin.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>{admin.isActive ? "Actif" : "Inactif"}</span><span className="text-[10px] text-gray-300">depuis {new Date(admin.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span></div></div>) : <p className="text-xs text-gray-300 italic">Aucun admin</p>}</div>
                            <div className="space-y-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><Users size={11} /> Utilisateurs ({s._count.users})</p><div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2">{[{ role: "ADMIN", label: "Admins", icon: <UserCog size={12} />, color: "text-tahfidz-purple" }, { role: "TEACHER", label: "Enseignants", icon: <BookOpen size={12} />, color: "text-blue-500" }, { role: "STUDENT", label: "Eleves", icon: <GraduationCap size={12} />, color: "text-tahfidz-green" }, { role: "PARENT", label: "Parents", icon: <Users size={12} />, color: "text-orange-400" }].map(({ role, label, icon, color }) => (<div key={role} className="flex items-center justify-between"><span className={`flex items-center gap-1.5 text-xs ${color}`}>{icon}{label}</span><span className="text-xs font-bold text-gray-700 dark:text-gray-300">{byRole[role] ?? 0}</span></div>))}</div></div>
                            <div className="space-y-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><KeyRound size={11} /> Identifiants</p><div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2"><div className="flex items-center justify-between gap-2"><span className="text-xs text-gray-400">Slug</span><div className="flex items-center gap-1"><span className="font-mono text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{s.slug}</span><button onClick={() => copyToClipboard(s.slug, `detail-slug-${s.id}`)} className="text-gray-300 hover:text-tahfidz-green transition">{copied === `detail-slug-${s.id}` ? <Check size={11} className="text-tahfidz-green" /> : <Copy size={11} />}</button></div></div>{admin && (<div className="flex items-center justify-between gap-2"><span className="text-xs text-gray-400">Email</span><div className="flex items-center gap-1"><span className="font-mono text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 truncate max-w-[110px]">{admin.email}</span><button onClick={() => copyToClipboard(admin.email, `detail-email-${s.id}`)} className="text-gray-300 hover:text-tahfidz-green transition">{copied === `detail-email-${s.id}` ? <Check size={11} className="text-tahfidz-green" /> : <Copy size={11} />}</button></div></div>)}<div className="pt-1 border-t border-gray-50 dark:border-gray-700"><p className="text-[10px] text-gray-300">URL : /login → identifiant : {s.slug}</p></div></div></div>
                          </div>
                        </td></tr>)}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
                        {/* Pagination */}
            {filteredSchools.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Page {currentPage} sur {totalPages} ({filteredSchools.length} ecoles)
                  </span>
                  <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}
                    className="text-xs border rounded-lg px-2 py-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                    <option value={10}>10/page</option>
                    <option value={25}>25/page</option>
                    <option value={50}>50/page</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">←</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.min(Math.max(i + 1, currentPage - 2), totalPages - 4) + i
                    if (page < 1 || page > totalPages) return null
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`px-2 py-1 rounded-lg text-xs ${page === currentPage ? "bg-emerald-600 text-white" : "border dark:border-gray-700 dark:text-gray-300"}`}>
                        {page}
                      </button>
                    )
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">→</button>
                </div>
              </div>
            )}
          </>)}

          {/* ── Tab Demandes ── */}
          {tab === "requests" && (<div>
            {pending.length === 0 ? (
              <div className="py-12 text-center space-y-2"><CheckCircle2 size={32} className="mx-auto text-green-400" /><p className="text-gray-400 dark:text-gray-500 text-sm">Aucune demande en attente</p>{processed.length > 0 && (<div className="flex items-center gap-3 justify-center mt-1"><button onClick={() => setShowHistory(v => !v)} className="text-xs text-tahfidz-green hover:underline">{showHistory ? "Masquer" : `Voir l'historique (${processed.length})`}</button><button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-600 hover:underline flex items-center gap-1"><X size={11} /> Vider</button></div>)}</div>
            ) : (<div className="divide-y divide-gray-50 dark:divide-gray-800"><div className="px-5 py-2.5 bg-orange-50 dark:bg-orange-900/20 flex items-center"><span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{pending.length} demande{pending.length > 1 ? "s" : ""} en attente</span></div>{pending.map(r => <RequestCard key={r.id} r={r} processing={processing} onApprove={approve} onReject={reject} onDelete={deleteRequest} />)}</div>)}
            {processed.length > 0 && pending.length > 0 && (<div className="border-t border-gray-100 dark:border-gray-800"><div className="flex items-center"><button onClick={() => setShowHistory(v => !v)} className="flex-1 px-5 py-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"><ChevronDown size={13} className={`transition-transform ${showHistory ? "rotate-180" : ""}`} />{showHistory ? "Masquer" : `Historique — ${processed.length} demande${processed.length > 1 ? "s" : ""} traitee${processed.length > 1 ? "s" : ""}`}</button><button onClick={clearHistory} className="px-4 py-3 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-1"><X size={13} /> Vider</button></div>{showHistory && (<div className="divide-y divide-gray-50 dark:divide-gray-800 bg-gray-50/50 dark:bg-gray-800/30">{processed.map(r => <RequestCard key={r.id} r={r} processing={processing} onApprove={approve} onReject={reject} onDelete={deleteRequest} />)}</div>)}</div>)}
            {processed.length > 0 && pending.length === 0 && showHistory && (<div className="divide-y divide-gray-50 dark:divide-gray-800">{processed.map(r => <RequestCard key={r.id} r={r} processing={processing} onApprove={approve} onReject={reject} onDelete={deleteRequest} />)}</div>)}
          </div>)}

          {/* ── Tab Sante ── */}
          {tab === "health" && (<div className="p-6">
            {healthLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-tahfidz-green" /></div>
            ) : health ? (
              <div className="space-y-6">
                {/* Status global */}
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${health.status === "healthy" ? "bg-green-50 border-green-200 text-green-700" : health.status === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  <Activity size={24} />
                  <div><p className="font-semibold">Systeme {health.status === "healthy" ? "Sain" : health.status === "warning" ? "Attention" : "Critique"}</p><p className="text-xs">Dernier check : {formatDate(new Date())}</p></div>
                </div>
                {/* Metriques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-400 mb-1">Latence API</p>
                    <p className={`text-2xl font-bold ${health.apiLatency < 200 ? "text-green-600" : health.apiLatency < 500 ? "text-yellow-600" : "text-red-600"}`}>{health.apiLatency}ms</p>
                    <MiniBarChart data={[health.apiLatency * 0.8, health.apiLatency * 0.9, health.apiLatency, health.apiLatency * 1.1, health.apiLatency * 0.95]} color={health.apiLatency < 200 ? "bg-green-500" : health.apiLatency < 500 ? "bg-yellow-500" : "bg-red-500"} />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-400 mb-1">Base de donnees</p>
                    <p className={`text-lg font-bold ${health.dbStatus === "connected" ? "text-green-600" : "text-red-600"}`}>{health.dbStatus === "connected" ? "Connectee" : "Deconnectee"}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-400 mb-1">Erreurs 24h</p>
                    <p className={`text-2xl font-bold ${health.errorCount24h === 0 ? "text-green-600" : health.errorCount24h < 10 ? "text-yellow-600" : "text-red-600"}`}>{health.errorCount24h}</p>
                  </div>
                </div>
                {/* Derniere erreur */}
                {health.lastError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5 mb-2"><AlertTriangle size={12} /> Derniere erreur</p>
                    <p className="text-xs text-red-700 font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded">{health.lastError}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400"><p>Impossible de charger les donnees de sante</p></div>
            )}
          </div>)}

          {/* ── Tab Audit ── */}
          {tab === "audit" && (<div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={auditFilter} onChange={e => setAuditFilter(e.target.value)} placeholder="Filtrer par action, acteur ou cible..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
              <button onClick={loadAudit} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-tahfidz-green hover:border-tahfidz-green transition"><RefreshCw size={14} /></button>
            </div>
            {auditLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-tahfidz-green" /></div>
            ) : (
              <div className="space-y-2">
                {filteredAudit.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Aucun log trouve</p>
                ) : filteredAudit.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.action.includes("DELETE") ? "bg-red-500" : log.action.includes("CREATE") || log.action.includes("APPROVE") ? "bg-green-500" : log.action.includes("UPDATE") ? "bg-blue-500" : "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{log.action}</span>
                        <span className="text-[10px] text-gray-400">par {log.actor}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cible : {log.target}</p>
                      {log.details && <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{log.details}</p>}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>)}

          {/* ── Tab Broadcast ── */}
          {tab === "broadcast" && (<div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2"><Send size={18} className="text-blue-500" /><h3 className="font-semibold text-gray-900 dark:text-gray-100">Message broadcast</h3></div>
              <form onSubmit={sendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Destinataires</label>
                  <div className="flex gap-2">
                    {(["all", "active", "inactive"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setBroadcastTarget(t)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${broadcastTarget === t ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"}`}>
                        {t === "all" ? "Toutes" : t === "active" ? "Actives" : "Inactives"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{broadcastTarget === "all" ? `${schools.length}` : broadcastTarget === "active" ? `${active}` : `${inactive}`} ecole(s) concernee(s)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                  <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} rows={4} placeholder="Entrez votre message ici..."
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <p className="text-[10px] text-gray-400 mt-1 text-right">{broadcastMessage.length} / 500</p>
                </div>
                <button type="submit" disabled={broadcastSending || !broadcastMessage.trim()}
                  className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {broadcastSending ? <><Loader2 size={14} className="animate-spin" />Envoi...</> : <><Send size={14} /> Envoyer le message</>}
                </button>
              </form>
            </div>

            {/* Historique des broadcasts (placeholder) */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5"><Bell size={14} className="text-amber-500" /> Derniers messages envoyes</h4>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-700 dark:text-gray-300">Maintenance planifiee</span><span className="text-[10px] text-gray-400">il y a 2 jours</span></div>
                  <p className="text-xs text-gray-500 mt-1">Intervention serveur prevue le 20 mai a 02h00 UTC.</p>
                  <span className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full mt-1 inline-block">Toutes les ecoles</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-700 dark:text-gray-300">Nouvelle fonctionnalite</span><span className="text-[10px] text-gray-400">il y a 5 jours</span></div>
                  <p className="text-xs text-gray-500 mt-1">Export PDF des certificats maintenant disponible !</p>
                  <span className="text-[10px] text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full mt-1 inline-block">Ecoles actives</span>
                </div>
              </div>
            </div>
          </div>)}
        </div>
      </main>

      {/* ── Modal resultat approbation ── */}
      {approvalResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700"><CheckCircle2 size={20} /><h3 className="text-lg font-bold">Ecole approuvee !</h3></div>
              <button onClick={() => setApprovalResult(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300"><strong>{approvalResult.schoolName}</strong> est maintenant active sur la plateforme TAHFIDZ.</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><KeyRound size={12} /> Identifiants de connexion</p>
                <div className="space-y-2">
                  {[{ label: "Identifiant ecole (slug)", value: approvalResult.slug }, { label: "Plan assigne", value: approvalResult.plan }, { label: "Email admin", value: approvalResult.adminEmail }, { label: "Admin", value: approvalResult.adminName }].map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-2"><span className="text-xs text-gray-400 shrink-0">{item.label}</span><div className="flex items-center gap-1.5 min-w-0"><span className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded truncate">{item.value}</span><button onClick={() => copyToClipboard(item.value, `approval-${item.label}`)} className="text-gray-300 hover:text-tahfidz-green transition shrink-0">{copied === `approval-${item.label}` ? <Check size={12} className="text-tahfidz-green" /> : <Copy size={12} />}</button></div></div>
                  ))}
                </div>
              </div>
              <div className="bg-tahfidz-green-light dark:bg-emerald-900/30 rounded-lg p-3 text-xs text-tahfidz-green">🔗 URL : <span className="font-mono font-semibold">/login</span> → Slug : <span className="font-mono font-semibold">{approvalResult.slug}</span></div>
            </div>
            <div className="p-6 pt-0"><button onClick={() => setApprovalResult(null)} className="w-full py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">Fermer</button></div>
          </div>
        </div>
      )}

      {/* ── Modal impersonate ── */}
      {showImpersonate && impersonateSchool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Eye size={18} className="text-purple-500" /> Impersonation</h3>
              <button onClick={() => { setShowImpersonate(false); setImpersonateSchool(null) }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Vous allez vous connecter en tant qu'administrateur de <strong>{impersonateSchool.name}</strong>.</p>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-purple-700 dark:text-purple-300">⚠️ Cette action est enregistree dans les logs d'audit.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowImpersonate(false); setImpersonateSchool(null) }} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
              <button onClick={confirmImpersonate} className="flex-1 py-2.5 bg-purple-500 text-white text-sm font-semibold rounded-xl hover:bg-purple-600 transition flex items-center justify-center gap-2"><Eye size={14} /> Se connecter</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal creation ecole ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Plus size={18} className="text-tahfidz-green" /> Creer une ecole</h3>
              <button onClick={() => { setShowForm(false); setError(null); setLogoFile(null); setLogoPreview(null) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
            </div>
            <form onSubmit={create} className="p-6 space-y-5">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">{error}</div>}

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo de l'ecole</label>
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

              {/* Infos école */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Informations de l'ecole</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'ecole <span className="text-red-500">*</span></label>
                  <input value={form.schoolName} onChange={f("schoolName")} required placeholder="Ex : Ecole Iqra Alger"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Identifiant (slug) <span className="text-red-500">*</span></label>
                    <button type="button" onClick={() => setForm(p => ({ ...p, schoolSlug: generateSlug() }))} className="ml-auto text-[10px] text-tahfidz-green hover:underline flex items-center gap-0.5"><RefreshCw size={10} /> Regenerer</button>
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

              {/* Administrateur */}
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
                <button type="button" onClick={() => { setShowForm(false); setError(null); setLogoFile(null); setLogoPreview(null) }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creation...</> : <><Plus size={14} /> Creer l'ecole</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal edition ecole ── */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Pencil size={18} className="text-tahfidz-green" /> Modifier l'ecole</h3>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'ecole</label>
                <input value={editForm.schoolName} onChange={e => setEditForm(p => ({ ...p, schoolName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
                <select value={editForm.plan} onChange={e => setEditForm(p => ({ ...p, plan: e.target.value }))}
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
                  <input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Alger"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pays</label>
                  <select value={editForm.country} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Rue, quartier..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telephone</label>
                <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="0555 123 456"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Administrateur</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom admin</label>
                    <input value={editForm.adminName} onChange={e => setEditForm(p => ({ ...p, adminName: e.target.value }))}
                      placeholder="Nom complet"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email admin</label>
                    <input type="email" value={editForm.adminEmail} onChange={e => setEditForm(p => ({ ...p, adminEmail: e.target.value }))}
                      placeholder="admin@ecole.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe <span className="text-gray-400 font-normal">(laisser vide pour ne pas changer)</span></label>
                  <input type="password" value={editForm.adminPassword} onChange={e => setEditForm(p => ({ ...p, adminPassword: e.target.value }))}
                    placeholder="..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Enregistrer</> : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
