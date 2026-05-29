"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Loader2, Building2, Clock, Activity, Eye, Send,
  MessageCircleQuestion, CheckCircle2, X,
} from "lucide-react"
import { Toaster, toast } from "sonner"

import {
  School, SchoolRequest, AuditLog, FeedbackItem, SystemHealth,
  TabKey, TimeRange, EMPTY_FORM, generateSlug, formatDate,
} from "@/components/admin/superadmin/types"
import { SuperAdminHeader } from "@/components/admin/superadmin/header"
import { SuperAdminStats } from "@/components/admin/superadmin/stats"
import { SchoolsTab } from "@/components/admin/superadmin/schools-tab"
import { RequestsTab } from "@/components/admin/superadmin/requests-tab"
import { HealthTab, AuditTab, FeedbackTab } from "@/components/admin/superadmin/system-tabs"
import { BroadcastTab } from "@/components/admin/superadmin/broadcast-tab"
import {
  CreateSchoolModal, EditSchoolModal, ApprovalResultModal,
  ImpersonateModal, FeedbackDetailModal,
} from "@/components/admin/superadmin/modals"
// import { impersonateSchoolAdmin } from "./actions"

export default function SuperAdminPage() {
  /* ── Core state ── */
  const [tab, setTab] = useState<TabKey>("schools")
  const [schools, setSchools] = useState<School[]>([])
  const [requests, setRequests] = useState<SchoolRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dark, setDark] = useState(false)

  /* ── Form / Modal states ── */
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(EMPTY_FORM)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({
    schoolId: "", schoolName: "", plan: "FREE", address: "", city: "", country: "DZ",
    phone: "", adminId: "", adminName: "", adminEmail: "", adminPassword: "",
  })

  const [approvalResult, setApprovalResult] = useState<{ schoolName: string; slug: string; plan: string; adminEmail: string; adminName: string } | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const [expandedSchool, setExpandedSchool] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterPlan, setFilterPlan] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  /* ── Auto-refresh ── */
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  /* ── Bulk ── */
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  /* ── Time range ── */
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")

  /* ── Health ── */
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)

  /* ── Audit ── */
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)

  /* ── Feedback ── */
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false)
  const [adminNote, setAdminNote] = useState("")

  /* ── Broadcast ── */
  const [broadcastSending, setBroadcastSending] = useState(false)

  /* ── Impersonate ── */
  const [showImpersonate, setShowImpersonate] = useState(false)
  const [impersonateSchool, setImpersonateSchool] = useState<School | null>(null)
  const [impersonateLoading, setImpersonateLoading] = useState(false)

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

  /* ── Data loaders ── */
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

  const loadHealth = useCallback(async () => {
    setHealthLoading(true)
    const res = await fetch("/api/admin/health")
    if (res.ok) {
      const data = await res.json()
      setHealth(data)
    }
    setHealthLoading(false)
  }, [])

  useEffect(() => { if (tab === "health") loadHealth() }, [tab, loadHealth])

  const loadAudit = useCallback(async () => {
    setAuditLoading(true)
    setAuditError(null)
    try {
      const res = await fetch("/api/admin/audit")
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur HTTP " + res.status }))
        setAuditError(err.error || `Erreur ${res.status}`)
        setAuditLogs([])
        return
      }
      const data = await res.json()
      const logs: AuditLog[] = (data.logs || []).map((log: any) => ({
        id: log.id || String(Math.random()),
        action: log.action || "UNKNOWN",
        actor: log.actor || log.user?.email || log.user?.fullName || "Système",
        actorId: log.actorId || log.userId || "—",
        target: log.target || log.entityId || "—",
        targetId: log.targetId || log.entityId || "—",
        targetType: log.targetType || log.entityType || "SYSTEM",
        details: log.details || null,
        ipAddress: log.ipAddress || null,
        userAgent: log.userAgent || null,
        createdAt: log.createdAt || new Date().toISOString(),
      }))
      setAuditLogs(logs)
    } catch {
      setAuditError("Impossible de charger les logs d'audit")
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }, [])

  useEffect(() => { if (tab === "audit") loadAudit() }, [tab, loadAudit])

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true)
    setFeedbackError(null)
    try {
      const res = await fetch("/api/feedback")
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur HTTP " + res.status }))
        setFeedbackError(err.error || `Erreur ${res.status}`)
        setFeedbackList([])
        return
      }
      const data = await res.json()
      setFeedbackList(data.feedbacks || [])
    } catch {
      setFeedbackError("Impossible de charger les feedbacks")
      setFeedbackList([])
    } finally {
      setFeedbackLoading(false)
    }
  }, [])

  useEffect(() => { if (tab === "feedback") loadFeedback() }, [tab, loadFeedback])

  /* ── Auto-refresh ── */
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => { load(); setLastRefresh(new Date()) }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, load])

  /* ── Reset page on filter change ── */
  useEffect(() => { setCurrentPage(1) }, [search, filterPlan, filterStatus, itemsPerPage])

  /* ── Flash ── */
  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 4000) }

  /* ── Clipboard ── */
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  /* ── Actions ── */
  const toggle = async (id: string, current: boolean) => {
    await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "toggle", schoolId: id, isActive: !current }) })
    load()
  }

  const approve = async (requestId: string) => {
    setProcessing(requestId)
    const res = await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "approve", requestId }) })
    if (res.ok) {
      const data = await res.json()
      await load()
      setApprovalResult({ schoolName: data.schoolName, slug: data.slug, plan: data.plan, adminEmail: data.adminEmail, adminName: data.adminName })
      setTab("schools")
    } else { setError((await res.json()).error) }
    setProcessing(null)
  }

  const reject = async (requestId: string) => {
    setProcessing(requestId)
    await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "reject", requestId }) })
    await load()
    toast.error("Demande rejetee.")
    setProcessing(null)
  }

  const clearHistory = async () => {
    const processed = requests.filter(r => r.status !== "PENDING")
    if (!confirm(`Supprimer les ${processed.length} demande(s) traitees ?`)) return
    await fetch("/api/admin/schools?type=history", { method: "DELETE" })
    await load()
    flash("Historique vide.")
  }

  const deleteRequest = async (requestId: string) => {
    if (!confirm("Supprimer cette demande definitivement ?")) return
    await fetch(`/api/admin/schools?type=request&id=${requestId}`, { method: "DELETE" })
    await load()
  }

  const deleteSchool = async (school: School) => {
    if (!confirm(`⚠️ Supprimer "${school.name}" et TOUS ses utilisateurs ? Cette action est irreversible.`)) return
    const res = await fetch(`/api/admin/schools?type=school&id=${school.id}`, { method: "DELETE" })
    if (res.ok) { setExpandedSchool(null); await load(); flash(`Ecole "${school.name}" supprimee.`) }
    else { setError((await res.json()).error) }
  }

  const openEdit = (s: School) => {
    const admin = s.users.find(u => u.role === "ADMIN" || u.role === "SUPERADMIN")
    setEditForm({
      schoolId: s.id, schoolName: s.name, plan: s.plan,
      address: s.address ?? "", city: s.city ?? "", country: s.country ?? "DZ", phone: s.phone ?? "",
      adminId: admin?.id ?? "", adminName: admin?.fullName ?? "", adminEmail: admin?.email ?? "", adminPassword: "",
    })
    setShowEdit(true)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update-school", ...editForm }) })
    if (res.ok) { setShowEdit(false); await load(); flash("Informations mises a jour.") }
    else { setError((await res.json()).error || "Erreur") }
    setSaving(false)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const res = await fetch("/api/admin/schools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    if (res.ok) {
      const data = await res.json()
      if (logoFile && data.school?.id) {
        const fd = new FormData()
        fd.append("logo", logoFile)
        fd.append("schoolId", data.school.id)
        const logoRes = await fetch("/api/admin/school/logo", { method: "POST", body: fd })
        if (!logoRes.ok) {
          const logoErr = await logoRes.json().catch(() => ({ error: "Erreur upload logo" }))
          toast.error(logoErr.error || "Erreur upload logo")
        }
      }
      toast.success("Ecole creee avec succes !")
      setShowForm(false)
      setForm(EMPTY_FORM)
      setLogoFile(null)
      setLogoPreview(null)
      load()
    } else { setError((await res.json()).error || "Erreur") }
    setCreating(false)
  }

  const exportCSV = () => {
    const rows = [
      ["Nom", "Slug", "Plan", "Statut", "Utilisateurs", "Ville", "Pays", "Creation"],
      ...schools.map(s => [s.name, s.slug, s.plan, s.isActive ? "Active" : "Inactive", String(s._count.users), s.city || "", s.country || "", new Date(s.createdAt).toLocaleDateString("fr-FR")]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ecoles_tahfidz.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Bulk Actions ── */
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
    const count = selectedSchools.size
    setSelectedSchools(new Set())
    setShowBulkActions(false)
    await load()
    flash(`${count} ecole(s) ${active ? "activee(s)" : "desactivee(s)"}.`)
  }

  const bulkDelete = async () => {
    if (!confirm(`⚠️ SUPPRIMER ${selectedSchools.size} ecole(s) et TOUS leurs utilisateurs ? IRREVERSIBLE.`)) return
    await Promise.all([...selectedSchools].map(id =>
      fetch(`/api/admin/schools?type=school&id=${id}`, { method: "DELETE" })
    ))
    const count = selectedSchools.size
    setSelectedSchools(new Set())
    setShowBulkActions(false)
    await load()
    flash(`${count} ecole(s) supprimee(s).`)
  }

  /* ── Impersonate ── */
  const impersonate = async (school: School) => {
    setImpersonateSchool(school)
    setShowImpersonate(true)
  }

  const handleImpersonateSubmit = async (schoolId: string) => {
    setImpersonateLoading(true)
    try {
      console.log("[Impersonate] Fetching /api/admin/impersonate with schoolId:", schoolId)
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      })
      const data = await res.json()
      console.log("[Impersonate] Response:", res.status, data)
      if (!res.ok) {
        toast.error(data.error || "Erreur d'impersonation")
        return
      }
      // Vérifier que le cookie est bien posé avant de naviguer
      const debugRes = await fetch("/api/debug/session")
      const debugData = await debugRes.json()
      console.log("[Impersonate] Debug session:", debugData)
      if (!debugData.impersonationCookie) {
        toast.error("Cookie d'impersonation non détecté — essayez de rafraîchir la page")
        return
      }
      window.location.href = data.redirectUrl || "/admin/dashboard"
    } catch (err) {
      console.error("[Impersonate] Error:", err)
      toast.error("Erreur réseau")
    } finally {
      setImpersonateLoading(false)
    }
  }

  /* ── Broadcast ── */
  const sendBroadcast = async (message: string, target: "all" | "active" | "inactive") => {
    setBroadcastSending(true)
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, target }),
    })
    if (res.ok) {
      flash(`Message envoye a ${target === "all" ? "toutes" : target === "active" ? "actives" : "inactives"} les ecoles !`)
    } else {
      setError("Erreur d'envoi du broadcast")
    }
    setBroadcastSending(false)
  }

  /* ── Computed ── */
  const pendingCount = requests.filter(r => r.status === "PENDING").length
  const activeCount = schools.filter(s => s.isActive).length
  const inactiveCount = schools.filter(s => !s.isActive).length

  const filteredSchools = useMemo(() => {
    let result = [...schools]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || (s.city && s.city.toLowerCase().includes(q)))
    }
    if (filterPlan !== "ALL") result = result.filter(s => s.plan === filterPlan)
    if (filterStatus === "ACTIVE") result = result.filter(s => s.isActive)
    if (filterStatus === "INACTIVE") result = result.filter(s => !s.isActive)
    return result
  }, [schools, search, filterPlan, filterStatus])

  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredSchools.slice(start, start + itemsPerPage)
  }, [filteredSchools, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / itemsPerPage))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <Loader2 className="animate-spin text-tahfidz-green" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-right" richColors />

      <SuperAdminHeader dark={dark} onToggleDark={toggleDark} />

      <main className="max-w-6xl mx-auto p-6 space-y-5">
        {success && <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm"><CheckCircle2 size={16} /> {success}</div>}
        {error && <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}<button onClick={() => setError(null)}><X size={16} /></button></div>}

        {/* Stats */}
        <SuperAdminStats schools={schools} requests={requests} />

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
            {[
              { id: "schools" as TabKey, label: "Ecoles", icon: <Building2 size={15} />, count: schools.length, color: "text-tahfidz-green", border: "border-tahfidz-green" },
              { id: "requests" as TabKey, label: "Demandes", icon: <Clock size={15} />, count: pendingCount, color: "text-orange-500", border: "border-orange-500", badge: pendingCount > 0 },
              { id: "health" as TabKey, label: "Sante", icon: <Activity size={15} />, color: "text-red-500", border: "border-red-500" },
              { id: "audit" as TabKey, label: "Audit", icon: <Eye size={15} />, color: "text-tahfidz-purple", border: "border-tahfidz-purple" },
              { id: "broadcast" as TabKey, label: "Broadcast", icon: <Send size={15} />, color: "text-blue-500", border: "border-blue-500" },
              { id: "feedback" as TabKey, label: "Feedback", icon: <MessageCircleQuestion size={15} />, count: feedbackList.filter(f => f.status === "PENDING").length, color: "text-pink-500", border: "border-pink-500", badge: feedbackList.filter(f => f.status === "PENDING").length > 0 },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-3.5 text-sm font-medium transition whitespace-nowrap ${tab === t.id ? `${t.color} border-b-2 ${t.border}` : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
                {t.icon}<span className="ml-1.5">{t.label}</span>
                {t.badge && <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold">{t.count}</span>}
              </button>
            ))}
          </div>

          {tab === "schools" && (
            <SchoolsTab
              schools={schools}
              filteredSchools={filteredSchools}
              paginatedSchools={paginatedSchools}
              totalPages={totalPages}
              search={search} setSearch={setSearch}
              filterPlan={filterPlan} setFilterPlan={setFilterPlan}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh}
              lastRefresh={lastRefresh}
              currentPage={currentPage} setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage}
              selectedSchools={selectedSchools}
              showBulkActions={showBulkActions}
              toggleSelectSchool={toggleSelectSchool}
              selectAll={selectAll}
              bulkToggle={bulkToggle}
              bulkDelete={bulkDelete}
              expandedSchool={expandedSchool} setExpandedSchool={setExpandedSchool}
              timeRange={timeRange} setTimeRange={setTimeRange}
              copied={copied}
              copyToClipboard={copyToClipboard}
              onToggle={toggle}
              onOpenEdit={openEdit}
              onImpersonate={impersonate}
              onDeleteSchool={deleteSchool}
              onExportCSV={exportCSV}
              onCreateClick={() => { setForm(p => ({ ...p, schoolSlug: generateSlug() })); setShowForm(true); setError(null); setLogoFile(null); setLogoPreview(null) }}
            />
          )}

          {tab === "requests" && (
            <RequestsTab
              requests={requests}
              processing={processing}
              onApprove={approve}
              onReject={reject}
              onDelete={deleteRequest}
              onClearHistory={clearHistory}
            />
          )}

          {tab === "health" && <HealthTab health={health} loading={healthLoading} />}

          {tab === "audit" && <AuditTab logs={auditLogs} loading={auditLoading} error={auditError} onReload={loadAudit} />}

          {tab === "broadcast" && (
            <BroadcastTab
              schoolCount={schools.length}
              activeCount={activeCount}
              inactiveCount={inactiveCount}
              sending={broadcastSending}
              onSubmit={sendBroadcast}
            />
          )}

          {tab === "feedback" && (
            <FeedbackTab
              items={feedbackList}
              loading={feedbackLoading}
              error={feedbackError}
              onReload={loadFeedback}
              onSelect={fb => { setSelectedFeedback(fb); setAdminNote(fb.adminNote || ""); setShowFeedbackDetail(true) }}
            />
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      <CreateSchoolModal
        open={showForm}
        form={form}
        setForm={setForm}
        error={error}
        creating={creating}
        logoFile={logoFile}
        setLogoFile={setLogoFile}
        logoPreview={logoPreview}
        setLogoPreview={setLogoPreview}
        onClose={() => { setShowForm(false); setError(null); setLogoFile(null); setLogoPreview(null) }}
        onSubmit={create}
      />

      <EditSchoolModal
        open={showEdit}
        form={editForm}
        setForm={setEditForm}
        saving={saving}
        onClose={() => setShowEdit(false)}
        onSubmit={saveEdit}
      />

      <ApprovalResultModal
        result={approvalResult}
        copied={copied}
        copyToClipboard={copyToClipboard}
        onClose={() => setApprovalResult(null)}
      />

      <ImpersonateModal
        open={showImpersonate}
        school={impersonateSchool}
        onClose={() => { setShowImpersonate(false); setImpersonateSchool(null) }}
        onSubmit={handleImpersonateSubmit}
        loading={impersonateLoading}
      />

      <FeedbackDetailModal
        feedback={selectedFeedback}
        open={showFeedbackDetail}
        adminNote={adminNote}
        setAdminNote={setAdminNote}
        onClose={() => { setShowFeedbackDetail(false); setSelectedFeedback(null) }}
        onReload={loadFeedback}
      />
    </div>
  )
}
