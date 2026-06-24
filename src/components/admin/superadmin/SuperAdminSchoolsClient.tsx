"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Search, X, Download, Plus, RefreshCw, Check, Ban, Trash2,
  ChevronDown, ChevronRight, Pencil, ToggleLeft, ToggleRight,
  Copy, TrendingUp, Zap, MapPin, Phone, Mail, Building2,
  Users, UserCog, BookOpen, GraduationCap, KeyRound,
  Loader2, AlertTriangle, ImagePlus, Activity, BarChart3,
  SlidersHorizontal, FilterX, LayoutGrid, Clock, Video, Infinity,
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import type { School } from "./types"
import { formatPhone, COUNTRIES } from "./types"
import { PLANS } from "@/lib/halaqa-quota"
import type { LandingContent } from "@/lib/landing/default-content"

interface Props {
  schools: School[]
}

type PlanValue = "FREE" | "STARTER" | "ECONOMIQUE" | "PRO" | "ENTERPRISE"
type LandingPlan = LandingContent["pricing"]["plans"][number]
type TimeRange = "7d" | "30d" | "90d" | "1y"

interface CreateForm {
  schoolName: string
  schoolSlug: string
  plan: PlanValue
  address: string
  city: string
  country: string
  phone: string
  adminEmail: string
  adminName: string
  adminPassword: string
}

interface EditForm {
  schoolId: string
  schoolName: string
  schoolSlug: string
  plan: PlanValue
  isActive: boolean
  address: string
  city: string
  country: string
  phone: string
  adminId: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

const EMPTY_CREATE: CreateForm = {
  schoolName: "",
  schoolSlug: "",
  plan: "FREE",
  address: "",
  city: "",
  country: "DZ",
  phone: "",
  adminEmail: "",
  adminName: "",
  adminPassword: "",
}

function generateSlug(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  return `${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}-${Math.floor(10000 + Math.random() * 90000)}`
}

function serializeForCsv(value: string | null | undefined): string {
  if (value == null) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function SuperAdminSchoolsClient({ schools }: Props) {
  const router = useRouter()
  const { useT, locale } = useLanguage()
  const t = (k: string) => useT("superadmin", k)
  const tc = (k: string) => useT("common", k)
  const planLocale = (locale === "ar" ? "ar" : locale === "en" ? "en" : "fr") as keyof typeof PLANS.FREE.name
  const [landingPlans, setLandingPlans] = useState<LandingPlan[]>([])
  const [landingCurrency, setLandingCurrency] = useState("CAD")

  useEffect(() => {
    fetch(`/api/site-config/landing/plans?lang=${planLocale}`)
      .then((res) => res.json())
      .then((data: { plans?: LandingPlan[]; currency?: string }) => {
        setLandingPlans(data.plans ?? [])
        setLandingCurrency(data.currency ?? "CAD")
      })
      .catch(() => setLandingPlans([]))
  }, [planLocale])

  // ─── Filters & pagination ─────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [filterPlan, setFilterPlan] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")

  // ─── Selection & expansion ────────────────────────────────────────
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set())
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // ─── Loading states ───────────────────────────────────────────────
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── Modals ───────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE)
  const [createLogoFile, setCreateLogoFile] = useState<File | null>(null)
  const [createLogoPreview, setCreateLogoPreview] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editSchool, setEditSchool] = useState<School | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const [deleteSchool, setDeleteSchool] = useState<School | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const createLogoRef = useRef<HTMLInputElement>(null)
  const editLogoRef = useRef<HTMLInputElement>(null)

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLowerCase()
    return schools.filter((s) => {
      const matchesSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        (s.city && s.city.toLowerCase().includes(term))
      const matchesPlan = filterPlan === "ALL" || s.plan === filterPlan
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" ? s.isActive : !s.isActive)
      return matchesSearch && matchesPlan && matchesStatus
    })
  }, [schools, search, filterPlan, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / itemsPerPage))
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredSchools.slice(start, start + itemsPerPage)
  }, [filteredSchools, currentPage, itemsPerPage])

  const showBulkActions = selectedSchools.size > 0

  const stats = useMemo(() => {
    const total = schools.length
    const active = schools.filter((s) => s.isActive).length
    const inactive = total - active
    const byPlan = {
      FREE: schools.filter((s) => s.plan === "FREE").length,
      STARTER: schools.filter((s) => s.plan === "STARTER").length,
      ECONOMIQUE: schools.filter((s) => s.plan === "ECONOMIQUE").length,
      PRO: schools.filter((s) => s.plan === "PRO").length,
      ENTERPRISE: schools.filter((s) => s.plan === "ENTERPRISE").length,
    }
    return { total, active, inactive, byPlan }
  }, [schools])

  const growthData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    return Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      const dateStr = d.toISOString().split("T")[0]
      const count = schools.filter(
        (s) => new Date(s.createdAt).toISOString().split("T")[0] === dateStr
      ).length
      return {
        date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        count,
      }
    })
  }, [schools, timeRange])

  const topSchools = useMemo(
    () => [...schools].sort((a, b) => b._count.users - a._count.users).slice(0, 5),
    [schools]
  )

  function resetPagination() {
    setCurrentPage(1)
  }

  function hasActiveFilters() {
    return search !== "" || filterPlan !== "ALL" || filterStatus !== "ALL"
  }

  function clearFilters() {
    setSearch("")
    setFilterPlan("ALL")
    setFilterStatus("ALL")
    resetPagination()
  }

  function copyToClipboard(text: string, key: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  function toggleSelectSchool(id: string) {
    setSelectedSchools((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selectedSchools.size === filteredSchools.length && filteredSchools.length > 0) {
      setSelectedSchools(new Set())
    } else {
      setSelectedSchools(new Set(filteredSchools.map((s) => s.id)))
    }
  }

  async function refreshData() {
    router.refresh()
  }

  async function toggleSchool(id: string, current: boolean) {
    setLoadingId(id)
    await fetch("/api/admin/schools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "toggle", schoolId: id, isActive: !current }),
    })
    await refreshData()
    setLoadingId(null)
  }

  async function bulkToggle(active: boolean) {
    setBulkLoading(true)
    await Promise.all(
      Array.from(selectedSchools).map((id) =>
        fetch("/api/admin/schools", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "toggle", schoolId: id, isActive: active }),
        })
      )
    )
    setSelectedSchools(new Set())
    await refreshData()
    setBulkLoading(false)
  }

  async function deleteSingleSchool(school: School) {
    setLoadingId(school.id)
    await fetch(`/api/admin/schools?type=school&id=${school.id}`, { method: "DELETE" })
    setDeleteSchool(null)
    setSelectedSchools((prev) => {
      const next = new Set(prev)
      next.delete(school.id)
      return next
    })
    await refreshData()
    setLoadingId(null)
  }

  async function bulkDelete() {
    setBulkLoading(true)
    await Promise.all(
      Array.from(selectedSchools).map((id) =>
        fetch(`/api/admin/schools?type=school&id=${id}`, { method: "DELETE" })
      )
    )
    setSelectedSchools(new Set())
    setBulkDeleteOpen(false)
    await refreshData()
    setBulkLoading(false)
  }

  async function uploadLogo(schoolId: string, file: File) {
    const formData = new FormData()
    formData.append("logo", file)
    formData.append("schoolId", schoolId)
    await fetch("/api/admin/schools/logo", { method: "POST", body: formData })
  }

  async function removeLogo(schoolId: string) {
    await fetch(`/api/admin/schools/logo?schoolId=${schoolId}`, { method: "DELETE" })
  }

  function openCreate() {
    setCreateForm({ ...EMPTY_CREATE, schoolSlug: generateSlug() })
    setCreateLogoFile(null)
    setCreateLogoPreview(null)
    setCreateError(null)
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)

    const res = await fetch("/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolName: createForm.schoolName,
        schoolSlug: createForm.schoolSlug,
        plan: createForm.plan,
        address: createForm.address,
        city: createForm.city,
        country: createForm.country,
        phone: createForm.phone,
        adminEmail: createForm.adminEmail,
        adminName: createForm.adminName,
        adminPassword: createForm.adminPassword,
      }),
    })
    const data = (await res.json()) as { school?: { id: string }; error?: string }

    if (!res.ok || !data.school) {
      setCreateError(data.error ?? t("errorOccurred"))
      setCreating(false)
      return
    }

    if (createLogoFile) {
      await uploadLogo(data.school.id, createLogoFile)
    }

    setCreateOpen(false)
    await refreshData()
    setCreating(false)
  }

  function openEdit(school: School) {
    const admin = school.users.find((u) => u.role === "ADMIN" || u.role === "SUPERADMIN")
    setEditSchool(school)
    setEditForm({
      schoolId: school.id,
      schoolName: school.name,
      schoolSlug: school.slug,
      plan: school.plan as PlanValue,
      isActive: school.isActive,
      address: school.address ?? "",
      city: school.city ?? "",
      country: school.country ?? "DZ",
      phone: school.phone ?? "",
      adminId: admin?.id ?? "",
      adminName: admin?.fullName ?? "",
      adminEmail: admin?.email ?? "",
      adminPassword: "",
    })
    setEditLogoFile(null)
    setEditLogoPreview(school.logo)
    setEditError(null)
  }

  function closeEdit() {
    setEditSchool(null)
    setEditForm(null)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setSaving(true)
    setEditError(null)

    const body: Record<string, unknown> = {
      type: "update-school",
      schoolId: editForm.schoolId,
      schoolName: editForm.schoolName,
      slug: editForm.schoolSlug,
      plan: editForm.plan,
      isActive: editForm.isActive,
      address: editForm.address,
      city: editForm.city,
      country: editForm.country,
      phone: editForm.phone,
    }
    if (editForm.adminId) {
      body.adminId = editForm.adminId
      body.adminName = editForm.adminName
      body.adminEmail = editForm.adminEmail
      if (editForm.adminPassword) body.adminPassword = editForm.adminPassword
    }

    const res = await fetch("/api/admin/schools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as { ok?: boolean; error?: string }

    if (!res.ok) {
      setEditError(data.error ?? t("errorOccurred"))
      setSaving(false)
      return
    }

    if (editLogoFile && editSchool) {
      await uploadLogo(editSchool.id, editLogoFile)
    } else if (editSchool && editSchool.logo && editLogoPreview === null) {
      await removeLogo(editSchool.id)
    }

    setEditSchool(null)
    setEditForm(null)
    await refreshData()
    setSaving(false)
  }

  function onExportCSV() {
    const headers = [
      t("schoolName"),
      t("slug"),
      t("plan"),
      tc("status"),
      t("city"),
      t("country"),
      t("address"),
      t("phone"),
      t("users"),
      t("creationDate"),
    ]
    const rows = filteredSchools.map((s) => [
      s.name,
      s.slug,
      s.plan,
      s.isActive ? t("activeLabel") : t("inactiveLabel"),
      s.city ?? "",
      s.country ?? "",
      s.address ?? "",
      s.phone ?? "",
      String(s._count.users),
      new Date(s.createdAt).toLocaleDateString("fr-FR"),
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.map(serializeForCsv).join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tahfidz-schools-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function updateCreateForm<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setCreateForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateEditForm<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  function handleCreateLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCreateLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setCreateLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleEditLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setEditLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const planBadgeClass = (plan: string) => {
    switch (plan) {
      case "ENTERPRISE":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 ring-amber-200 dark:ring-amber-800"
      case "PRO":
        return "bg-tahfidz-purple-light text-tahfidz-purple dark:bg-tahfidz-purple/20 dark:text-tahfidz-purple-light ring-tahfidz-purple/20 dark:ring-tahfidz-purple/30"
      case "ECONOMIQUE":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800"
      case "STARTER":
        return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 ring-blue-200 dark:ring-blue-800"
      default:
        return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ring-gray-200 dark:ring-gray-700"
    }
  }

  const planBarClass = (plan: string) => {
    switch (plan) {
      case "ENTERPRISE":
        return "bg-amber-500"
      case "PRO":
        return "bg-tahfidz-purple"
      case "ECONOMIQUE":
        return "bg-emerald-500"
      case "STARTER":
        return "bg-blue-500"
      default:
        return "bg-gray-400"
    }
  }

  const statusBadgeClass = (isActive: boolean) =>
    isActive
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800"
      : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 ring-red-200 dark:ring-red-800"

  const planMeta: { key: PlanValue; label: string }[] = useMemo(() => {
    return (["FREE", "STARTER", "ECONOMIQUE", "PRO", "ENTERPRISE"] as PlanValue[])
      .filter((key) => landingPlans.find((p) => p.key === key)?.enabled !== false)
      .map((key) => ({
        key,
        label: landingPlans.find((p) => p.key === key)?.name ?? PLANS[key].name[planLocale] ?? PLANS[key].name.fr,
      }))
  }, [landingPlans, planLocale])

  const allFiltersEmpty = !hasActiveFilters()

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="text-tahfidz-green" size={26} />
            {t("schools")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            onClick={refreshData}
            className="p-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            title={tc("refresh")}
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Download size={16} /> {t("exportCsv")}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 gradient-tahfidz text-white rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-sm shadow-emerald-200 dark:shadow-none"
          >
            <Plus size={16} /> {t("createSchool")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="col-span-2 xl:col-span-1 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{t("totalSchools")}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</p>
            </div>
            <div className="p-2 bg-tahfidz-green-light dark:bg-emerald-900/30 rounded-xl">
              <LayoutGrid size={18} className="text-tahfidz-green" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{t("activeSchools")}</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Activity size={18} className="text-emerald-500" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% {t("activeLabel")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{t("inactiveSchools")}</p>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400 mt-1">{stats.inactive}</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
              <Ban size={18} className="text-red-500" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% {t("inactiveLabel")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-2 md:col-span-2 xl:col-span-4 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-tahfidz-green" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("schoolsByPlan")}</p>
          </div>
          <div className="flex items-end gap-2 h-10 mb-2">
            {planMeta.map(({ key }) => {
              const count = stats.byPlan[key]
              const max = Math.max(...Object.values(stats.byPlan), 1)
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1 group/tooltip relative">
                  <div
                    className={cn("w-full rounded-t-md transition-all opacity-90 hover:opacity-100", planBarClass(key))}
                    style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? "4px" : "0px" }}
                  />
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{count}</span>
                  <div className="absolute bottom-full mb-1 hidden group-hover/tooltip:block bg-gray-900 dark:bg-gray-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                    {count} {t("schoolsCount")} — {key}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-2">
            {planMeta.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1">
                <span className={cn("w-2 h-2 rounded-full", planBarClass(key))} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPagination() }}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); resetPagination() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex items-center gap-2 text-gray-400">
                <SlidersHorizontal size={14} />
                <span className="text-xs hidden sm:inline">{tc("filter")}</span>
              </div>
              <select
                value={filterPlan}
                onChange={(e) => { setFilterPlan(e.target.value); resetPagination() }}
                className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50"
              >
                <option value="ALL">{t("allPlans")}</option>
                {planMeta.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); resetPagination() }}
                className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50"
              >
                <option value="ALL">{t("allStatuses")}</option>
                <option value="ACTIVE">{t("activeLabel")}</option>
                <option value="INACTIVE">{t("inactiveLabel")}</option>
              </select>
              <button
                onClick={clearFilters}
                disabled={allFiltersEmpty}
                className="flex items-center gap-1 px-3 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-tahfidz-green hover:bg-tahfidz-green-light dark:hover:bg-emerald-900/20 rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <FilterX size={13} /> {t("clearFilters")}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 py-3 bg-gradient-to-r from-tahfidz-green-light to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10 border-b border-tahfidz-green/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <span className="text-sm text-tahfidz-green font-semibold flex items-center gap-2">
              <Check size={14} />
              {selectedSchools.size} {t("selected")}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bulkToggle(true)}
                disabled={bulkLoading}
                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
              >
                <Check size={12} /> {t("activate")}
              </button>
              <button
                onClick={() => bulkToggle(false)}
                disabled={bulkLoading}
                className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
              >
                <Ban size={12} /> {t("deactivate")}
              </button>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                disabled={bulkLoading}
                className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
              >
                <Trash2 size={12} /> {t("deleteSelected")}
              </button>
              <button
                onClick={() => setSelectedSchools(new Set())}
                className="px-2 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                title={tc("close")}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {search.trim() && (
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <span>
              {filteredSchools.length} {t("resultsCount")} {t("forSearch")} «{search}»
            </span>
            <button onClick={() => { setSearch(""); resetPagination() }} className="text-tahfidz-green hover:underline">
              {t("clearFilters")}
            </button>
          </div>
        )}

        {/* Growth chart */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp size={16} className="text-tahfidz-green" /> {t("growthTitle")}
            </h4>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-medium transition",
                    timeRange === r
                      ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  {r === "7d" ? "7j" : r === "30d" ? "30j" : r === "90d" ? "90j" : "1an"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {growthData.map((d, i) => {
              const max = Math.max(...growthData.map((g) => g.count), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-gradient-to-t from-tahfidz-green to-emerald-400 dark:from-tahfidz-green dark:to-emerald-500 rounded-t-md transition-all opacity-80 hover:opacity-100"
                    style={{ height: `${(d.count / max) * 100}%` }}
                  />
                  <span className="text-[9px] text-gray-400 rotate-45 origin-left translate-y-1">{d.date}</span>
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.count} {t("schoolsCount")}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top schools */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> {t("topSchoolsTitle")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topSchools.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <span className="text-white font-bold text-xs">#{i + 1}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{s.name}</p>
                <p className="text-xs text-tahfidz-green font-bold">{s._count.users} {t("users")}</p>
                <p className={cn("text-[10px] font-medium mt-0.5", planBadgeClass(s.plan))}>{s.plan}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={selectedSchools.size === filteredSchools.length && filteredSchools.length > 0}
                    onChange={selectAll}
                    className="rounded border-gray-300 dark:border-gray-600 text-tahfidz-green focus:ring-tahfidz-green"
                  />
                </th>
                <th className="w-8 px-3 py-3.5" />
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("logo")}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("school")}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("slug")}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("plan")}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("users")}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("creationDate")}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tc("status")}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tc("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSchools.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-14 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Building2 size={22} className="text-gray-300" />
                      </div>
                      <p className="text-sm">{search ? `${t("searchNoResult")} «${search}»` : t("noSchoolsFound")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSchools.map((s) => {
                  const admin = s.users.find((u) => u.role === "ADMIN" || u.role === "SUPERADMIN")
                  const byRole = s.users.reduce<Record<string, number>>((acc, u) => {
                    acc[u.role] = (acc[u.role] || 0) + 1
                    return acc
                  }, {})
                  const isOpen = expandedSchool === s.id
                  const isSelected = selectedSchools.has(s.id)

                  return (
                    <Fragment key={s.id}>
                      <tr
                        className={cn(
                          "group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border-t border-gray-100 dark:border-gray-800 cursor-pointer select-none",
                          isSelected && "bg-emerald-50/50 dark:bg-emerald-900/15"
                        )}
                        onClick={() => setExpandedSchool(isOpen ? null : s.id)}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectSchool(s.id)}
                            className="rounded border-gray-300 dark:border-gray-600 text-tahfidz-green focus:ring-tahfidz-green"
                          />
                        </td>
                        <td className="px-3 py-3.5 text-gray-300 group-hover:text-tahfidz-green transition">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                            {s.logo ? (
                              <Image
                                src={s.logo}
                                alt={s.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-contain p-0.5"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{s.name.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</p>
                            {s.nameAr && <p className="arabic text-xs text-gray-400 dark:text-gray-500">{s.nameAr}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                              {s.slug}
                            </span>
                            <button
                              onClick={() => copyToClipboard(s.slug, `slug-${s.id}`)}
                              className="text-gray-300 hover:text-tahfidz-green transition"
                            >
                              {copied === `slug-${s.id}` ? <Check size={12} className="text-tahfidz-green" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold ring-1", planBadgeClass(s.plan))}>
                            {s.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <Users size={14} className="text-gray-400" />
                            <span className="font-semibold">{s._count.users}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1", statusBadgeClass(s.isActive))}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", s.isActive ? "bg-emerald-500" : "bg-red-500")} />
                            {s.isActive ? t("activeShort") : t("inactiveShort")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleSchool(s.id, s.isActive)}
                              title={s.isActive ? t("deactivate") : t("activate")}
                              disabled={loadingId === s.id}
                              className={cn(
                                "p-2 rounded-lg transition",
                                s.isActive
                                  ? "hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600"
                                  : "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600"
                              )}
                            >
                              {loadingId === s.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : s.isActive ? (
                                <ToggleRight size={20} />
                              ) : (
                                <ToggleLeft size={20} />
                              )}
                            </button>
                            <button
                              onClick={() => openEdit(s)}
                              title={tc("edit")}
                              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 transition"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteSchool(s)}
                              title={tc("delete")}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td
                            colSpan={10}
                            className="bg-gradient-to-r from-emerald-50/60 to-white dark:from-emerald-900/10 dark:to-gray-900 px-6 py-6 border-b border-emerald-100 dark:border-emerald-900/20"
                          >
                            {/* School profile header */}
                            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-emerald-100/80 dark:border-emerald-900/20">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0 bg-white dark:bg-gray-800">
                                {s.logo ? (
                                  <Image
                                    src={s.logo}
                                    alt={s.name}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-contain p-1"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                                    <span className="text-white font-bold text-2xl">{s.name.charAt(0)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{s.name}</h3>
                                {s.nameAr && <p className="arabic text-sm text-gray-500 dark:text-gray-400">{s.nameAr}</p>}
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold ring-1", statusBadgeClass(s.isActive))}>
                                    {s.isActive ? t("activeShort") : t("inactiveShort")}
                                  </span>
                                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold ring-1", planBadgeClass(s.plan))}>
                                    {s.plan}
                                  </span>
                                  {!s.logo && <span className="text-[10px] text-gray-400 italic">{t("noLogo")}</span>}
                                </div>
                              </div>
                              <div className="hidden sm:flex items-center gap-2">
                                <button
                                  onClick={() => openEdit(s)}
                                  className="px-3 py-1.5 text-xs font-medium text-tahfidz-green bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition"
                                >
                                  {tc("edit")}
                                </button>
                              </div>
                            </div>

                            {/* Profile cards grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                              {/* Identity */}
                              <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mb-3">
                                  <Building2 size={11} /> {t("identity")}
                                </p>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] text-gray-400">{t("schoolName")}</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-400">{t("slugLabel")}</p>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                        {s.slug}
                                      </span>
                                      <button
                                        onClick={() => copyToClipboard(s.slug, `detail-slug-${s.id}`)}
                                        className="text-gray-300 hover:text-tahfidz-green transition"
                                      >
                                        {copied === `detail-slug-${s.id}` ? <Check size={11} className="text-tahfidz-green" /> : <Copy size={11} />}
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-400">{t("creationDate")}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                      {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Contact */}
                              <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mb-3">
                                  <Mail size={11} /> {t("contact")}
                                </p>
                                <div className="space-y-3">
                                  <div className="flex items-start gap-2">
                                    <MapPin size={13} className="text-tahfidz-green mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-[10px] text-gray-400">{t("address")}</p>
                                      <p className="text-xs text-gray-700 dark:text-gray-300">{s.address ?? <span className="italic text-gray-400">{t("noCoordinates")}</span>}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Building2 size={13} className="text-tahfidz-green mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-[10px] text-gray-400">{t("city")} / {t("country")}</p>
                                      <p className="text-xs text-gray-700 dark:text-gray-300">
                                        {[s.city, s.country].filter(Boolean).join(", ") || <span className="italic text-gray-400">{t("noCoordinates")}</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Phone size={13} className="text-tahfidz-green mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-[10px] text-gray-400">{t("phone")}</p>
                                      <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{formatPhone(s.phone)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Administrator */}
                              <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mb-3">
                                  <UserCog size={11} /> {t("administrator")}
                                </p>
                                {admin ? (
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-[10px] text-gray-400">{t("adminName")}</p>
                                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{admin.fullName}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Mail size={13} className="text-tahfidz-green mt-0.5 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-[10px] text-gray-400">{tc("email")}</p>
                                        <div className="flex items-center gap-1">
                                          <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[140px]">{admin.email}</p>
                                          <button
                                            onClick={() => copyToClipboard(admin.email, `detail-email-${s.id}`)}
                                            className="text-gray-300 hover:text-tahfidz-green transition shrink-0"
                                          >
                                            {copied === `detail-email-${s.id}` ? <Check size={11} className="text-tahfidz-green" /> : <Copy size={11} />}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold ring-1", statusBadgeClass(admin.isActive))}>
                                        {admin.isActive ? tc("active") : tc("inactive")}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        {t("since")} {new Date(admin.createdAt).toLocaleDateString("fr-FR", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">{t("noAdmin")}</p>
                                )}
                              </div>

                              {/* Users */}
                              <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mb-3">
                                  <Users size={11} /> {t("users")} ({s._count.users})
                                </p>
                                <div className="space-y-2.5">
                                  {[
                                    { role: "ADMIN", label: t("admin"), icon: <UserCog size={12} />, color: "text-tahfidz-purple", bg: "bg-tahfidz-purple-light dark:bg-tahfidz-purple/20" },
                                    { role: "TEACHER", label: t("teacher"), icon: <BookOpen size={12} />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
                                    { role: "STUDENT", label: t("student"), icon: <GraduationCap size={12} />, color: "text-tahfidz-green", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
                                    { role: "PARENT", label: t("parent"), icon: <Users size={12} />, color: "text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30" },
                                  ].map(({ role, label, icon, color, bg }) => (
                                    <div key={role} className="flex items-center justify-between">
                                      <span className={cn("flex items-center gap-1.5 text-xs font-medium", color)}>
                                        {icon} {label}
                                      </span>
                                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md min-w-[1.75rem] text-center", bg, color)}>
                                        {byRole[role] ?? 0}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Credentials */}
                              <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mb-3">
                                  <KeyRound size={11} /> {t("credentials")}
                                </p>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] text-gray-400">{t("slugLabel")}</p>
                                    <p className="font-mono text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300 break-all">
                                      {s.slug}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-400">{t("planLabel")}</p>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.plan}</p>
                                  </div>
                                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                      {t("loginHint")} <span className="font-mono font-semibold text-tahfidz-green">{s.slug}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Plan quotas */}
                              <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mb-3">
                                  <Zap size={11} /> {t("planQuotas")}
                                </p>
                                {(() => {
                                  const planDef = PLANS[s.plan as PlanValue]
                                  const limits = planDef?.limits
                                  const landingPlan = landingPlans.find((p) => p.key === s.plan)
                                  if (!planDef || !limits) {
                                    return <p className="text-xs text-gray-400 italic">{t("noPlanData")}</p>
                                  }
                                  const maxStudents = limits.maxStudents
                                  const maxTeachers = limits.maxTeachers
                                  const monthlyHalaqas = limits.monthlyHalaqas
                                  return (
                                    <div className="space-y-2.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">{t("planLabel")}</span>
                                        <span className="text-xs font-semibold text-tahfidz-green">{landingPlan?.name ?? planDef.name[planLocale] ?? planDef.name.fr}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Users size={10} /> {tc("maxStudents")}</span>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{maxStudents === null ? <Infinity size={12} /> : maxStudents}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><UserCog size={10} /> {tc("maxTeachers")}</span>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{maxTeachers === null ? <Infinity size={12} /> : maxTeachers}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><BookOpen size={10} /> {tc("monthlyHalaqas")}</span>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{monthlyHalaqas === null ? <Infinity size={12} /> : monthlyHalaqas}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} /> {tc("maxDuration")}</span>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{limits.halaqaMaxDuration} min</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Video size={10} /> {tc("recordingAllowed")}</span>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{limits.halaqaAllowRecording ? tc("yes") : tc("no")}</span>
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredSchools.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3.5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("page")} {currentPage} / {totalPages} ({filteredSchools.length} {t("schoolsCount")})
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                className="text-xs border rounded-lg px-2 py-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-tahfidz-green/50"
              >
                <option value={10}>10 {t("perPage")}</option>
                <option value={25}>25 {t("perPage")}</option>
                <option value={50}>50 {t("perPage")}</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                ←
              </button>
              {(() => {
                const windowSize = Math.min(5, totalPages)
                let start = Math.max(1, currentPage - Math.floor(windowSize / 2))
                let end = start + windowSize - 1
                if (end > totalPages) {
                  end = totalPages
                  start = Math.max(1, end - windowSize + 1)
                }
                return Array.from({ length: end - start + 1 }, (_, i) => {
                  const page = start + i
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                        page === currentPage
                          ? "bg-tahfidz-green text-white shadow-sm"
                          : "border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {page}
                    </button>
                  )
                })
              })()}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create School Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Plus size={20} className="text-tahfidz-green" /> {t("createSchool")}
              </h3>
              <button onClick={closeCreate} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {createError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("logo")}</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 shrink-0">
                    {createLogoPreview ? (
                      <img src={createLogoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImagePlus size={22} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={createLogoRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleCreateLogoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => createLogoRef.current?.click()}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition w-full text-center"
                    >
                      {createLogoFile ? createLogoFile.name : `${tc("add")} ${t("logo")}`}
                    </button>
                    {createLogoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setCreateLogoFile(null)
                          setCreateLogoPreview(null)
                          if (createLogoRef.current) createLogoRef.current.value = ""
                        }}
                        className="text-xs text-red-400 hover:text-red-600 mt-1.5 flex items-center gap-1"
                      >
                        <X size={11} /> {t("remove")}
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5">{t("logoHint")}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={12} /> {t("schoolInfo")}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("schoolName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={createForm.schoolName}
                    onChange={(e) => updateCreateForm("schoolName", e.target.value)}
                    required
                    placeholder="Ex : Ecole Iqra Alger"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("slugLabel")} <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => updateCreateForm("schoolSlug", generateSlug())}
                      className="ml-auto text-[10px] text-tahfidz-green hover:underline flex items-center gap-0.5"
                    >
                      <RefreshCw size={10} /> {t("generateSlug")}
                    </button>
                  </div>
                  <input
                    value={createForm.schoolSlug}
                    onChange={(e) => updateCreateForm("schoolSlug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    required
                    placeholder="ex: AB-12345"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{t("loginHint")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("planLabel")}</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => updateCreateForm("plan", e.target.value as PlanValue)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                  >
                    {planMeta.map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("city")}</label>
                    <input
                      value={createForm.city}
                      onChange={(e) => updateCreateForm("city", e.target.value)}
                      placeholder="Alger"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("country")}</label>
                    <select
                      value={createForm.country}
                      onChange={(e) => updateCreateForm("country", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("address")}</label>
                    <input
                      value={createForm.address}
                      onChange={(e) => updateCreateForm("address", e.target.value)}
                      placeholder="Rue, quartier..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("phone")}</label>
                    <input
                      value={createForm.phone}
                      onChange={(e) => updateCreateForm("phone", e.target.value)}
                      placeholder="0555 123 456"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <UserCog size={12} /> {t("adminAccount")}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("adminName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={createForm.adminName}
                    onChange={(e) => updateCreateForm("adminName", e.target.value)}
                    required
                    placeholder="Prénom Nom"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {tc("email")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.adminEmail}
                    onChange={(e) => updateCreateForm("adminEmail", e.target.value)}
                    required
                    placeholder="admin@ecole.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("adminPassword")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={createForm.adminPassword}
                    onChange={(e) => updateCreateForm("adminPassword", e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 caractères"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {tc("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {creating ? <><Loader2 size={14} className="animate-spin" /> {t("creating")}</> : <><Plus size={14} /> {t("createSchool")}</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit School Modal */}
      {editSchool && editForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Pencil size={20} className="text-tahfidz-green" /> {tc("edit")} <span className="truncate max-w-[200px] font-semibold">{editSchool.name}</span>
              </h3>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {editError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("logo")}</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 shrink-0">
                    {editLogoPreview ? (
                      <img src={editLogoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImagePlus size={22} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={editLogoRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleEditLogoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editLogoRef.current?.click()}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition w-full text-center"
                    >
                      {editLogoFile ? editLogoFile.name : `${tc("edit")} ${t("logo")}`}
                    </button>
                    {(editLogoFile || editLogoPreview) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditLogoFile(null)
                          setEditLogoPreview(null)
                          if (editLogoRef.current) editLogoRef.current.value = ""
                        }}
                        className="text-xs text-red-400 hover:text-red-600 mt-1.5 flex items-center gap-1"
                      >
                        <X size={11} /> {t("remove")}
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5">{t("logoHint")}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("schoolName")}</label>
                <input
                  value={editForm.schoolName}
                  onChange={(e) => updateEditForm("schoolName", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("slugLabel")}</label>
                <input
                  value={editForm.schoolSlug}
                  onChange={(e) => updateEditForm("schoolSlug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("planLabel")}</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => updateEditForm("plan", e.target.value as PlanValue)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                >
                  <option value="FREE">{t("planFree")}</option>
                  <option value="STARTER">{t("planStarter")}</option>
                  <option value="ECONOMIQUE">{t("planEconomique")}</option>
                  <option value="PRO">{t("planPro")}</option>
                  <option value="ENTERPRISE">{t("planEnterprise")}</option>
                </select>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => updateEditForm("isActive", e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-tahfidz-green focus:ring-tahfidz-green"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tc("active")}</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("city")}</label>
                  <input
                    value={editForm.city}
                    onChange={(e) => updateEditForm("city", e.target.value)}
                    placeholder="Alger"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("country")}</label>
                  <select
                    value={editForm.country}
                    onChange={(e) => updateEditForm("country", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("address")}</label>
                <input
                  value={editForm.address}
                  onChange={(e) => updateEditForm("address", e.target.value)}
                  placeholder="Rue, quartier..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("phone")}</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => updateEditForm("phone", e.target.value)}
                  placeholder="0555 123 456"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                />
              </div>

              {editForm.adminId && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <UserCog size={12} /> {t("adminAccount")}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("adminName")}</label>
                      <input
                        value={editForm.adminName}
                        onChange={(e) => updateEditForm("adminName", e.target.value)}
                        placeholder="Nom complet"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tc("email")}</label>
                      <input
                        type="email"
                        value={editForm.adminEmail}
                        onChange={(e) => updateEditForm("adminEmail", e.target.value)}
                        placeholder="admin@ecole.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("adminPassword")}{" "}
                      <span className="text-gray-400 font-normal">({t("passwordHint")})</span>
                    </label>
                    <input
                      type="password"
                      value={editForm.adminPassword}
                      onChange={(e) => updateEditForm("adminPassword", e.target.value)}
                      placeholder="..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {tc("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={14} className="animate-spin" /> {t("saving")}</> : tc("save")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete single modal */}
      {deleteSchool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteSchool(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full"
          >
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("deleteConfirmTitle")}</h3>
            <p className="text-sm text-gray-500 mb-6">{t("deleteConfirmDesc")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteSchool(null)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={() => deleteSingleSchool(deleteSchool)}
                disabled={loadingId === deleteSchool.id}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {loadingId === deleteSchool.id ? <Loader2 size={16} className="animate-spin mx-auto" /> : tc("delete")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk delete modal */}
      {bulkDeleteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBulkDeleteOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full"
          >
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("deleteBulkConfirmTitle")}</h3>
            <p className="text-sm text-gray-500 mb-6">{t("deleteBulkConfirmDesc")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkDeleteOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkLoading}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : tc("delete")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
