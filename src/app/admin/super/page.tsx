"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Loader2, Building2, Clock, Activity, Eye, Send,
  MessageCircleQuestion, CheckCircle2, X, Lock, EyeOff,
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { signOut } from "next-auth/react"

import {
  School, SchoolRequest, AuditLog, FeedbackItem, SystemHealth,
  TabKey, TimeRange, EMPTY_FORM, generateSlug,
} from "@/components/admin/superadmin/types"
import { SuperAdminHeader } from "@/components/admin/superadmin/header"
import { SuperAdminStats } from "@/components/admin/superadmin/stats"
import { SchoolsTab } from "@/components/admin/superadmin/schools-tab"
import { RequestsTab } from "@/components/admin/superadmin/requests-tab"
import { HealthTab, AuditTab, FeedbackTab } from "@/components/admin/superadmin/system-tabs"
import { BroadcastTab } from "@/components/admin/superadmin/broadcast-tab"
import { UpdatesTab } from "@/components/admin/superadmin/updates-tab"
import {
  CreateSchoolModal, EditSchoolModal, ApprovalResultModal,
  FeedbackDetailModal,
} from "@/components/admin/superadmin/modals"

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
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null)

  /* ── Password change modal ── */
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [curPwd, setCurPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confPwd, setConfPwd] = useState("")
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdErr, setPwdErr] = useState<string | null>(null)

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

  /* ── School Updates ── */
  const [updateRequests, setUpdateRequests] = useState<any[]>([])
  const [updatesLoading, setUpdatesLoading] = useState(false)

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

  const loadUpdates = useCallback(async () => {
    setUpdatesLoading(true)
    try {
      const res = await fetch("/api/admin/school-updates")
      if (res.ok) {
        const data = await res.json()
        setUpdateRequests(data.requests || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatesLoading(false)
    }
  }, [])

  useEffect(() => { if (tab === "updates") loadUpdates() }, [tab, loadUpdates])

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

  /* ── Change password ── */
  const changeSuperAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confPwd) { setPwdErr("Les mots de passe ne correspondent pas."); return }
    if (newPwd.length < 8) { setPwdErr("Le mot de passe doit contenir au moins 8 caracteres."); return }
    setPwdLoading(true); setPwdErr(null)
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success("Mot de passe modifie ! Deconnexion...")
      setShowPwdModal(false)
      setCurPwd(""); setNewPwd(""); setConfPwd("")
      setTimeout(() => signOut({ callbackUrl: "/login" }), 1500)
    } catch (e) {
      setPwdErr(e instanceof Error ? e.message : "Erreur")
    }
    setPwdLoading(false)
  }

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
    setEditLogoPreview(s.logo)
    setEditLogoFile(null)
    setShowEdit(true)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch("/api/admin/schools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update-school", ...editForm }) })
    if (res.ok) {
      if (editLogoFile && editForm.schoolId) {
        const fd = new FormData()
        fd.append("logo", editLogoFile)
        fd.append("schoolId", editForm.schoolId)
        const logoRes = await fetch("/api/admin/school/logo", { method: "POST", body: fd })
        if (!logoRes.ok) {
          const logoErr = await logoRes.json().catch(() => ({ error: "Erreur upload logo" }))
          toast.error(logoErr.error || "Erreur upload logo")
        }
      }
      setShowEdit(false)
      setEditLogoFile(null)
      setEditLogoPreview(null)
      await load()
      flash("Informations mises a jour.")
    }
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

      <SuperAdminHeader dark={dark} onToggleDark={toggleDark} onChangePassword={() => setShowPwdModal(true)} />

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
              { id: "updates" as TabKey, label: "Mises à jour", icon: <Building2 size={15} />, count: updateRequests.length, color: "text-orange-500", border: "border-orange-500", badge: updateRequests.length > 0 },
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

          {tab === "updates" && (
            <UpdatesTab
              requests={updateRequests}
              loading={updatesLoading}
              onReload={loadUpdates}
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
        logoFile={editLogoFile}
        setLogoFile={setEditLogoFile}
        logoPreview={editLogoPreview}
        setLogoPreview={setEditLogoPreview}
        onClose={() => { setShowEdit(false); setEditLogoFile(null); setEditLogoPreview(null) }}
        onSubmit={saveEdit}
      />

      <ApprovalResultModal
        result={approvalResult}
        copied={copied}
        copyToClipboard={copyToClipboard}
        onClose={() => setApprovalResult(null)}
      />

      <FeedbackDetailModal
        feedback={selectedFeedback}
        open={showFeedbackDetail}
        adminNote={adminNote}
        setAdminNote={setAdminNote}
        onClose={() => { setShowFeedbackDetail(false); setSelectedFeedback(null) }}
        onReload={loadFeedback}
      />

      {/* ── Change Password Modal ── */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Lock size={18} className="text-tahfidz-green" /> Modifier mon mot de passe</h3>
              <button onClick={() => { setShowPwdModal(false); setPwdErr(null); setCurPwd(""); setNewPwd(""); setConfPwd("") }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
            </div>
            <form onSubmit={changeSuperAdminPassword} className="p-6 space-y-4">
              {pwdErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{pwdErr}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe actuel</label>
                <div className="relative">
                  <input type={showCur ? "text" : "password"} value={curPwd} onChange={e => setCurPwd(e.target.value)} required
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                  <button type="button" onClick={() => setShowCur(!showCur)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer</label>
                <input type="password" value={confPwd} onChange={e => setConfPwd(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowPwdModal(false); setPwdErr(null); setCurPwd(""); setNewPwd(""); setConfPwd("") }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
                <button type="submit" disabled={pwdLoading}
                  className="flex-1 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {pwdLoading ? <><Loader2 size={14} className="animate-spin" /> Enregistrement...</> : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
