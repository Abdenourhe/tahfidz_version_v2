'use client'
// src/components/superadmin/SiteConfigClient.tsx
// Interface superadmin d'édition du contenu du site (landing + contenus globaux)

import { useState } from 'react'
import {
  Layout, Globe, Save, Eye, Plus, Trash2, ChevronDown, ChevronUp,
  Star, Users, BookOpen, BarChart2, MessageSquare, Megaphone,
  CheckCircle2, XCircle, AlertTriangle, Info, Flag, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeLandingContent, type LandingContent } from '@/lib/landing/default-content'
import { SUPPORTED_CURRENCIES, getCurrencyLabel } from '@/lib/landing/currencies'
import type {
  SitePageConfig,
  SitePageKey,
  SitePageLang,
  PageContent,
  PageSection,
  ContactCard,
} from '@/lib/site-config/page-types'
import { defaultPageContents } from '@/lib/site-config/page-defaults'

// ── Types ──────────────────────────────────────────────────────────

type Lang = 'fr' | 'en' | 'ar'
type Landing = Record<Lang, LandingContent>

type EmailTemplate = { subject: string; body: string }
type BannerType = 'info' | 'warning' | 'success' | 'error'

type GlobalContent = {
  emails: Record<'welcome' | 'reset-password' | 'invite-parent', EmailTemplate>
  banner: {
    enabled: boolean
    message: string
    link: string
    type: BannerType
  }
}

interface SiteConfigClientProps {
  initialLanding: Record<'fr' | 'en' | 'ar', LandingContent>
  initialGlobal: any
  initialPages: Record<SitePageKey, SitePageConfig>
}

// ── Helpers de normalisation ───────────────────────────────────────

function normalizeGlobal(raw: any): GlobalContent {
  const template = (key: 'welcome' | 'reset-password' | 'invite-parent'): EmailTemplate => ({
    subject: raw?.emails?.[key]?.subject ?? '',
    body: raw?.emails?.[key]?.body ?? '',
  })

  const bannerType = raw?.banner?.type
  const validBannerType: BannerType = ['info', 'warning', 'success', 'error'].includes(bannerType)
    ? bannerType
    : 'info'

  return {
    emails: {
      welcome: template('welcome'),
      'reset-password': template('reset-password'),
      'invite-parent': template('invite-parent'),
    },
    banner: {
      enabled: raw?.banner?.enabled ?? false,
      message: raw?.banner?.message ?? '',
      link: raw?.banner?.link ?? '',
      type: validBannerType,
    },
  }
}

// ── Composants UI atomiques ────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  textarea = false,
  type = 'text',
  rows = 3,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  textarea?: boolean
  type?: string
  rows?: number
}) {
  const baseClass = cn(
    'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    'rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition-colors'
  )

  return (
    <div className='space-y-1.5'>
      <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={cn(baseClass, 'resize-y min-h-[80px]')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      )}
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
  open,
  onToggle,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/50'>
      <button
        type='button'
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80',
          'transition-colors'
        )}
      >
        <div className='flex items-center gap-2'>
          {Icon && <Icon className='w-4 h-4 text-tahfidz-green' />}
          <span className='text-sm font-semibold text-gray-800 dark:text-gray-100'>{title}</span>
        </div>
        {open ? (
          <ChevronUp className='w-4 h-4 text-gray-500' />
        ) : (
          <ChevronDown className='w-4 h-4 text-gray-500' />
        )}
      </button>
      {open && <div className='p-4 space-y-4'>{children}</div>}
    </div>
  )
}

function StringArrayEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  function update(index: number, value: string) {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  function add() {
    onChange([...items, ''])
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  const inputClass = cn(
    'flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    'rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none',
    'focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green'
  )

  return (
    <div className='space-y-2'>
      <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>{label}</label>
      {items.map((item, index) => (
        <div key={index} className='flex items-center gap-2'>
          <input
            type='text'
            value={item}
            onChange={(e) => update(index, e.target.value)}
            className={inputClass}
          />
          <button
            type='button'
            onClick={() => remove(index)}
            className='p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
            title='Supprimer'
          >
            <Trash2 className='w-4 h-4' />
          </button>
        </div>
      ))}
      <button
        type='button'
        onClick={add}
        className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
      >
        <Plus className='w-3.5 h-3.5' />
        Ajouter un élément
      </button>
    </div>
  )
}

function FooterLinksEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: { label: string; href: string; external?: boolean }[]
  onChange: (items: { label: string; href: string; external?: boolean }[]) => void
}) {
  function update(index: number, value: { label: string; href: string; external?: boolean }) {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  function add() {
    onChange([...items, { label: '', href: '/' }])
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  const inputClass = cn(
    'flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    'rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none',
    'focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green'
  )

  return (
    <div className='space-y-2'>
      <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>{label}</label>
      {items.map((item, index) => (
        <div key={index} className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-gray-500'>Lien {index + 1}</span>
            <button
              type='button'
              onClick={() => remove(index)}
              className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
              title='Supprimer'
            >
              <Trash2 className='w-3.5 h-3.5' />
            </button>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <input
              type='text'
              value={item.label}
              onChange={(e) => update(index, { ...item, label: e.target.value })}
              placeholder='Label'
              className={inputClass}
            />
            <input
              type='text'
              value={item.href}
              onChange={(e) => update(index, { ...item, href: e.target.value })}
              placeholder='/chemin ou https://...'
              className={inputClass}
            />
          </div>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={item.external ?? false}
              onChange={(e) => update(index, { ...item, external: e.target.checked })}
              className='w-4 h-4 rounded border-gray-300 accent-tahfidz-green focus:ring-tahfidz-green/50'
            />
            <span className='text-sm text-gray-700 dark:text-gray-200'>Lien externe</span>
          </label>
        </div>
      ))}
      <button
        type='button'
        onClick={add}
        className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
      >
        <Plus className='w-3.5 h-3.5' />
        Ajouter un lien
      </button>
    </div>
  )
}

function StatusMessage({
  status,
}: {
  status: { type: 'success' | 'error' | null; message: string }
}) {
  if (!status.type) return null

  const isSuccess = status.type === 'success'
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm',
        isSuccess
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
      )}
    >
      {isSuccess ? <CheckCircle2 className='w-4 h-4' /> : <XCircle className='w-4 h-4' />}
      <span>{status.message}</span>
    </div>
  )
}

// ── Éditeur de la landing page ─────────────────────────────────────

function LandingEditor({
  lang,
  content,
  onChange,
}: {
  lang: Lang
  content: LandingContent
  onChange: (content: LandingContent) => void
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    nav: true,
    hero: true,
    features: true,
    how: true,
    users: true,
    stats: true,
    testimonials: true,
    pricing: true,
    cta: true,
    footer: true,
  })

  function toggle(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function setSection<K extends keyof LandingContent>(key: K, value: LandingContent[K]) {
    onChange({ ...content, [key]: value } as LandingContent)
  }

  return (
    <div className='space-y-4'>
      {/* Direction de lecture */}
      <div className='flex items-center gap-3 p-3 bg-tahfidz-green-light dark:bg-emerald-900/20 rounded-xl border border-tahfidz-green/20 dark:border-emerald-800'>
        <Globe className='w-4 h-4 text-tahfidz-green' />
        <label className='text-sm font-medium text-gray-700 dark:text-gray-200'>
          Direction de lecture ({lang.toUpperCase()})
        </label>
        <select
          value={content.dir}
          onChange={(e) => setSection('dir', e.target.value as 'ltr' | 'rtl')}
          className={cn(
            'ml-auto px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50'
          )}
        >
          <option value='ltr'>LTR (gauche → droite)</option>
          <option value='rtl'>RTL (droite → gauche)</option>
        </select>
      </div>

      {/* Navigation */}
      <SectionCard title='Navigation' icon={Layout} open={openSections.nav} onToggle={() => toggle('nav')}>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Field label='Accueil' value={content.nav.home} onChange={(v) => setSection('nav', { ...content.nav, home: v })} />
          <Field label='Fonctionnalités' value={content.nav.features} onChange={(v) => setSection('nav', { ...content.nav, features: v })} />
          <Field label='Tarifs' value={content.nav.pricing} onChange={(v) => setSection('nav', { ...content.nav, pricing: v })} />
          <Field label='Comment ça marche' value={content.nav.how} onChange={(v) => setSection('nav', { ...content.nav, how: v })} />
          <Field label='Connexion' value={content.nav.login} onChange={(v) => setSection('nav', { ...content.nav, login: v })} />
          <Field label='Inscription' value={content.nav.register} onChange={(v) => setSection('nav', { ...content.nav, register: v })} />
        </div>
      </SectionCard>

      {/* Hero */}
      <SectionCard title='Hero' icon={Star} open={openSections.hero} onToggle={() => toggle('hero')}>
        <div className='space-y-4'>
          <Field label='Badge' value={content.hero.badge} onChange={(v) => setSection('hero', { ...content.hero, badge: v })} />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Field label='Titre' value={content.hero.title} onChange={(v) => setSection('hero', { ...content.hero, title: v })} />
            <Field label='Titre mis en valeur' value={content.hero.titleHighlight} onChange={(v) => setSection('hero', { ...content.hero, titleHighlight: v })} />
          </div>
          <Field label='Sous-titre' value={content.hero.subtitle} onChange={(v) => setSection('hero', { ...content.hero, subtitle: v })} textarea />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Field label='CTA principal' value={content.hero.ctaPrimary} onChange={(v) => setSection('hero', { ...content.hero, ctaPrimary: v })} />
            <Field label='CTA secondaire' value={content.hero.ctaSecondary} onChange={(v) => setSection('hero', { ...content.hero, ctaSecondary: v })} />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Field label='Stat 1' value={content.hero.stat1} onChange={(v) => setSection('hero', { ...content.hero, stat1: v })} />
            <Field label='Stat 2' value={content.hero.stat2} onChange={(v) => setSection('hero', { ...content.hero, stat2: v })} />
            <Field label='Stat 3' value={content.hero.stat3} onChange={(v) => setSection('hero', { ...content.hero, stat3: v })} />
          </div>
        </div>
      </SectionCard>

      {/* Fonctionnalités */}
      <SectionCard title='Fonctionnalités' icon={BookOpen} open={openSections.features} onToggle={() => toggle('features')}>
        <div className='space-y-4'>
          <Field label='Titre de section' value={content.features.title} onChange={(v) => setSection('features', { ...content.features, title: v })} />
          <Field label='Sous-titre' value={content.features.subtitle} onChange={(v) => setSection('features', { ...content.features, subtitle: v })} />
          <div className='space-y-3'>
            <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Liste des fonctionnalités</label>
            {content.features.items.map((item, index) => (
              <div key={index} className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-gray-500'>Élément {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => {
                      const next = content.features.items.filter((_, i) => i !== index)
                      setSection('features', { ...content.features, items: next })
                    }}
                    className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <Field
                    label='Icône'
                    value={item.icon}
                    onChange={(v) => {
                      const next = [...content.features.items]
                      next[index] = { ...item, icon: v }
                      setSection('features', { ...content.features, items: next })
                    }}
                  />
                  <Field
                    label='Titre'
                    value={item.title}
                    onChange={(v) => {
                      const next = [...content.features.items]
                      next[index] = { ...item, title: v }
                      setSection('features', { ...content.features, items: next })
                    }}
                  />
                  <Field
                    label='Description'
                    value={item.desc}
                    onChange={(v) => {
                      const next = [...content.features.items]
                      next[index] = { ...item, desc: v }
                      setSection('features', { ...content.features, items: next })
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type='button'
              onClick={() => setSection('features', { ...content.features, items: [...content.features.items, { icon: 'Star', title: '', desc: '' }] })}
              className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
            >
              <Plus className='w-3.5 h-3.5' />
              Ajouter une fonctionnalité
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Comment ça marche */}
      <SectionCard title='Comment ça marche' icon={BarChart2} open={openSections.how} onToggle={() => toggle('how')}>
        <div className='space-y-4'>
          <Field label='Titre de section' value={content.how.title} onChange={(v) => setSection('how', { ...content.how, title: v })} />
          <Field label='Sous-titre' value={content.how.subtitle} onChange={(v) => setSection('how', { ...content.how, subtitle: v })} />
          <div className='space-y-3'>
            <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Étapes</label>
            {content.how.steps.map((step, index) => (
              <div key={index} className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-gray-500'>Étape {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => setSection('how', { ...content.how, steps: content.how.steps.filter((_, i) => i !== index) })}
                    className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <Field
                    label='Numéro'
                    value={step.num}
                    onChange={(v) => {
                      const next = [...content.how.steps]
                      next[index] = { ...step, num: v }
                      setSection('how', { ...content.how, steps: next })
                    }}
                  />
                  <Field
                    label='Titre'
                    value={step.title}
                    onChange={(v) => {
                      const next = [...content.how.steps]
                      next[index] = { ...step, title: v }
                      setSection('how', { ...content.how, steps: next })
                    }}
                  />
                  <Field
                    label='Description'
                    value={step.desc}
                    onChange={(v) => {
                      const next = [...content.how.steps]
                      next[index] = { ...step, desc: v }
                      setSection('how', { ...content.how, steps: next })
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type='button'
              onClick={() => setSection('how', { ...content.how, steps: [...content.how.steps, { num: '', title: '', desc: '' }] })}
              className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
            >
              <Plus className='w-3.5 h-3.5' />
              Ajouter une étape
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Rôles */}
      <SectionCard title='Rôles' icon={Users} open={openSections.users} onToggle={() => toggle('users')}>
        <div className='space-y-4'>
          <Field label='Titre de section' value={content.users.title} onChange={(v) => setSection('users', { ...content.users, title: v })} />
          <Field label='Sous-titre' value={content.users.subtitle} onChange={(v) => setSection('users', { ...content.users, subtitle: v })} />
          <div className='space-y-3'>
            <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Rôles</label>
            {content.users.items.map((item, index) => (
              <div key={index} className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-gray-500'>Rôle {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => setSection('users', { ...content.users, items: content.users.items.filter((_, i) => i !== index) })}
                    className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <Field
                    label='Icône'
                    value={item.icon}
                    onChange={(v) => {
                      const next = [...content.users.items]
                      next[index] = { ...item, icon: v }
                      setSection('users', { ...content.users, items: next })
                    }}
                  />
                  <Field
                    label='Rôle'
                    value={item.role}
                    onChange={(v) => {
                      const next = [...content.users.items]
                      next[index] = { ...item, role: v }
                      setSection('users', { ...content.users, items: next })
                    }}
                  />
                  <Field
                    label='Description'
                    value={item.desc}
                    onChange={(v) => {
                      const next = [...content.users.items]
                      next[index] = { ...item, desc: v }
                      setSection('users', { ...content.users, items: next })
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type='button'
              onClick={() => setSection('users', { ...content.users, items: [...content.users.items, { icon: 'Users', role: '', desc: '' }] })}
              className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
            >
              <Plus className='w-3.5 h-3.5' />
              Ajouter un rôle
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Statistiques */}
      <SectionCard title='Statistiques' icon={BarChart2} open={openSections.stats} onToggle={() => toggle('stats')}>
        <div className='space-y-4'>
          <Field label='Titre de section' value={content.stats.title} onChange={(v) => setSection('stats', { ...content.stats, title: v })} />
          <div className='space-y-3'>
            <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Chiffres</label>
            {content.stats.items.map((item, index) => (
              <div key={index} className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-gray-500'>Stat {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => setSection('stats', { ...content.stats, items: content.stats.items.filter((_, i) => i !== index) })}
                    className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <Field
                    label='Valeur'
                    type='number'
                    value={item.value}
                    onChange={(v) => {
                      const next = [...content.stats.items]
                      next[index] = { ...item, value: Number(v) }
                      setSection('stats', { ...content.stats, items: next })
                    }}
                  />
                  <Field
                    label='Libellé'
                    value={item.label}
                    onChange={(v) => {
                      const next = [...content.stats.items]
                      next[index] = { ...item, label: v }
                      setSection('stats', { ...content.stats, items: next })
                    }}
                  />
                  <Field
                    label='Suffixe'
                    value={item.suffix}
                    onChange={(v) => {
                      const next = [...content.stats.items]
                      next[index] = { ...item, suffix: v }
                      setSection('stats', { ...content.stats, items: next })
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type='button'
              onClick={() => setSection('stats', { ...content.stats, items: [...content.stats.items, { value: 0, label: '', suffix: '' }] })}
              className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
            >
              <Plus className='w-3.5 h-3.5' />
              Ajouter un chiffre
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Témoignages */}
      <SectionCard title='Témoignages' icon={MessageSquare} open={openSections.testimonials} onToggle={() => toggle('testimonials')}>
        <div className='space-y-4'>
          <Field label='Titre de section' value={content.testimonials.title} onChange={(v) => setSection('testimonials', { ...content.testimonials, title: v })} />
          <div className='space-y-3'>
            <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Témoignages</label>
            {content.testimonials.items.map((item, index) => (
              <div key={index} className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-gray-500'>Témoignage {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => setSection('testimonials', { ...content.testimonials, items: content.testimonials.items.filter((_, i) => i !== index) })}
                    className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  <Field
                    label='Nom'
                    value={item.name}
                    onChange={(v) => {
                      const next = [...content.testimonials.items]
                      next[index] = { ...item, name: v }
                      setSection('testimonials', { ...content.testimonials, items: next })
                    }}
                  />
                  <Field
                    label='Rôle / École'
                    value={item.role}
                    onChange={(v) => {
                      const next = [...content.testimonials.items]
                      next[index] = { ...item, role: v }
                      setSection('testimonials', { ...content.testimonials, items: next })
                    }}
                  />
                  <Field
                    label='Texte'
                    value={item.text}
                    onChange={(v) => {
                      const next = [...content.testimonials.items]
                      next[index] = { ...item, text: v }
                      setSection('testimonials', { ...content.testimonials, items: next })
                    }}
                    textarea
                  />
                </div>
              </div>
            ))}
            <button
              type='button'
              onClick={() => setSection('testimonials', { ...content.testimonials, items: [...content.testimonials.items, { name: '', role: '', text: '' }] })}
              className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
            >
              <Plus className='w-3.5 h-3.5' />
              Ajouter un témoignage
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Tarifs */}
      <SectionCard title='Tarifs' icon={Megaphone} open={openSections.pricing} onToggle={() => toggle('pricing')}>
        <div className='space-y-4'>
          <Field label='Titre de section' value={content.pricing.title} onChange={(v) => setSection('pricing', { ...content.pricing, title: v })} />
          <Field label='Sous-titre' value={content.pricing.subtitle} onChange={(v) => setSection('pricing', { ...content.pricing, subtitle: v })} />
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Période par défaut</label>
              <select
                value={content.pricing.period}
                onChange={(e) => setSection('pricing', { ...content.pricing, period: e.target.value as 'month' | 'year' })}
                className={cn(
                  'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                  'rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none',
                  'focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green'
                )}
              >
                <option value='month'>Mensuel</option>
                <option value='year'>Annuel</option>
              </select>
            </div>
            <Field label='Libellé mensuel (ex: mois / month / شهر)' value={content.pricing.monthlyLabel} onChange={(v) => setSection('pricing', { ...content.pricing, monthlyLabel: v })} />
            <Field label='Libellé annuel (ex: an / year / سنة)' value={content.pricing.yearlyLabel} onChange={(v) => setSection('pricing', { ...content.pricing, yearlyLabel: v })} />
            <Field label='Libellé bouton' value={content.pricing.request} onChange={(v) => setSection('pricing', { ...content.pricing, request: v })} />
            <Field label='Libellé populaire' value={content.pricing.popular} onChange={(v) => setSection('pricing', { ...content.pricing, popular: v })} />
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Devise</label>
              <select
                value={content.pricing.currency}
                onChange={(e) => setSection('pricing', { ...content.pricing, currency: e.target.value })}
                className={cn(
                  'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                  'rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none',
                  'focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green'
                )}
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {getCurrencyLabel(currency.code, lang)} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className='space-y-3'>
            <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Plans</label>
            {content.pricing.plans.map((plan, index) => (
              <div key={index} className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-gray-500'>Plan {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => setSection('pricing', { ...content.pricing, plans: content.pricing.plans.filter((_, i) => i !== index) })}
                    className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-5 gap-3'>
                  <Field
                    label='Nom'
                    value={plan.name}
                    onChange={(v) => {
                      const next = [...content.pricing.plans]
                      next[index] = { ...plan, name: v }
                      setSection('pricing', { ...content.pricing, plans: next })
                    }}
                  />
                  <Field
                    label='Tranche élèves'
                    value={plan.students}
                    onChange={(v) => {
                      const next = [...content.pricing.plans]
                      next[index] = { ...plan, students: v }
                      setSection('pricing', { ...content.pricing, plans: next })
                    }}
                  />
                  <Field
                    label='Prix mensuel'
                    value={plan.monthlyPrice}
                    onChange={(v) => {
                      const next = [...content.pricing.plans]
                      next[index] = { ...plan, monthlyPrice: v }
                      setSection('pricing', { ...content.pricing, plans: next })
                    }}
                  />
                  <Field
                    label='Prix annuel'
                    value={plan.yearlyPrice}
                    onChange={(v) => {
                      const next = [...content.pricing.plans]
                      next[index] = { ...plan, yearlyPrice: v }
                      setSection('pricing', { ...content.pricing, plans: next })
                    }}
                  />
                </div>
                <StringArrayEditor
                  label='Avantages mensuels'
                  items={plan.monthlyFeatures}
                  onChange={(monthlyFeatures) => {
                    const next = [...content.pricing.plans]
                    next[index] = { ...plan, monthlyFeatures }
                    setSection('pricing', { ...content.pricing, plans: next })
                  }}
                />
                <StringArrayEditor
                  label='Avantages annuels'
                  items={plan.yearlyFeatures}
                  onChange={(yearlyFeatures) => {
                    const next = [...content.pricing.plans]
                    next[index] = { ...plan, yearlyFeatures }
                    setSection('pricing', { ...content.pricing, plans: next })
                  }}
                />
              </div>
            ))}
            <button
              type='button'
              onClick={() => setSection('pricing', { ...content.pricing, plans: [...content.pricing.plans, { name: '', students: '', monthlyPrice: '', yearlyPrice: '', monthlyFeatures: [''], yearlyFeatures: [''] }] })}
              className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
            >
              <Plus className='w-3.5 h-3.5' />
              Ajouter un plan
            </button>
          </div>
        </div>
      </SectionCard>

      {/* CTA */}
      <SectionCard title='Appel à l action' icon={Megaphone} open={openSections.cta} onToggle={() => toggle('cta')}>
        <div className='space-y-4'>
          <Field label='Titre' value={content.cta.title} onChange={(v) => setSection('cta', { ...content.cta, title: v })} />
          <Field label='Sous-titre' value={content.cta.subtitle} onChange={(v) => setSection('cta', { ...content.cta, subtitle: v })} />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Field label='Bouton' value={content.cta.button} onChange={(v) => setSection('cta', { ...content.cta, button: v })} />
            <Field label='Sous-texte' value={content.cta.sub} onChange={(v) => setSection('cta', { ...content.cta, sub: v })} />
          </div>
        </div>
      </SectionCard>

      {/* Footer */}
      <SectionCard title='Pied de page' icon={Flag} open={openSections.footer} onToggle={() => toggle('footer')}>
        <div className='space-y-4'>
          <Field label='Description' value={content.footer.desc} onChange={(v) => setSection('footer', { ...content.footer, desc: v })} textarea />
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Field label='Titre colonne Produit' value={content.footer.product} onChange={(v) => setSection('footer', { ...content.footer, product: v })} />
            <Field label='Titre colonne Support' value={content.footer.support} onChange={(v) => setSection('footer', { ...content.footer, support: v })} />
            <Field label='Titre colonne Légal' value={content.footer.legal} onChange={(v) => setSection('footer', { ...content.footer, legal: v })} />
          </div>
          <FooterLinksEditor
            label='Liens Produit'
            items={content.footer.linksProduct}
            onChange={(v) => setSection('footer', { ...content.footer, linksProduct: v })}
          />
          <FooterLinksEditor
            label='Liens Support'
            items={content.footer.linksSupport}
            onChange={(v) => setSection('footer', { ...content.footer, linksSupport: v })}
          />
          <FooterLinksEditor
            label='Liens Légal'
            items={content.footer.linksLegal}
            onChange={(v) => setSection('footer', { ...content.footer, linksLegal: v })}
          />
          <Field label='Copyright' value={content.footer.copyright} onChange={(v) => setSection('footer', { ...content.footer, copyright: v })} />
        </div>
      </SectionCard>
    </div>
  )
}

// ── Éditeur des contenus globaux ───────────────────────────────────

function GlobalEditor({
  global,
  onChange,
}: {
  global: GlobalContent
  onChange: (global: GlobalContent) => void
}) {
  const emailLabels: Record<keyof GlobalContent['emails'], string> = {
    welcome: 'Bienvenue',
    'reset-password': 'Réinitialisation du mot de passe',
    'invite-parent': 'Invitation parent',
  }

  function updateEmail(
    key: keyof GlobalContent['emails'],
    field: keyof EmailTemplate,
    value: string
  ) {
    const next = { ...global.emails }
    next[key] = { ...next[key], [field]: value }
    onChange({ ...global, emails: next })
  }

  function updateBanner<K extends keyof GlobalContent['banner']>(field: K, value: GlobalContent['banner'][K]) {
    const next = { ...global.banner }
    next[field] = value
    onChange({ ...global, banner: next })
  }

  const typeIcons: Record<BannerType, React.ReactNode> = {
    info: <Info className='w-4 h-4 text-blue-500' />,
    warning: <AlertTriangle className='w-4 h-4 text-amber-500' />,
    success: <CheckCircle2 className='w-4 h-4 text-green-500' />,
    error: <XCircle className='w-4 h-4 text-red-500' />,
  }

  return (
    <div className='space-y-6'>
      {/* Modèles d'emails */}
      <div className='space-y-4'>
        <h3 className='text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2'>
          <MessageSquare className='w-4 h-4 text-tahfidz-green' />
          Modèles d&apos;emails
        </h3>
        {(Object.keys(emailLabels) as Array<keyof GlobalContent['emails']>).map((key) => (
          <div
            key={key}
            className='p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 space-y-3'
          >
            <h4 className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
              {emailLabels[key]}
            </h4>
            <Field
              label='Sujet'
              value={global.emails[key].subject}
              onChange={(v) => updateEmail(key, 'subject', v)}
            />
            <Field
              label='Corps'
              value={global.emails[key].body}
              onChange={(v) => updateEmail(key, 'body', v)}
              textarea
              rows={6}
            />
          </div>
        ))}
      </div>

      {/* Bannière */}
      <div className='p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 space-y-4'>
        <h3 className='text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2'>
          <Flag className='w-4 h-4 text-tahfidz-green' />
          Bannière
        </h3>

        <label className='flex items-center gap-3 cursor-pointer'>
          <input
            type='checkbox'
            checked={global.banner.enabled}
            onChange={(e) => updateBanner('enabled', e.target.checked)}
            className={cn(
              'w-4 h-4 rounded border-gray-300 accent-tahfidz-green',
              'focus:ring-tahfidz-green/50'
            )}
          />
          <span className='text-sm text-gray-700 dark:text-gray-200'>Activer la bannière</span>
        </label>

        <Field
          label='Message'
          value={global.banner.message}
          onChange={(v) => updateBanner('message', v)}
        />
        <Field
          label='Lien'
          value={global.banner.link}
          onChange={(v) => updateBanner('link', v)}
        />

        <div className='space-y-1.5'>
          <label className='block text-xs font-medium text-gray-600 dark:text-gray-400'>Type</label>
          <div className='flex items-center gap-2'>
            {typeIcons[global.banner.type]}
            <select
              value={global.banner.type}
              onChange={(e) => updateBanner('type', e.target.value as BannerType)}
              className={cn(
                'flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                'rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none',
                'focus:ring-2 focus:ring-tahfidz-green/50'
              )}
            >
              <option value='info'>Info</option>
              <option value='warning'>Avertissement</option>
              <option value='success'>Succès</option>
              <option value='error'>Erreur</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Éditeur de pages statiques ─────────────────────────────────────

function PageEditor({
  content,
  onChange,
  isContact,
}: {
  content: PageContent
  onChange: (content: PageContent) => void
  isContact: boolean
}) {
  function update<K extends keyof PageContent>(field: K, value: PageContent[K]) {
    onChange({ ...content, [field]: value } as PageContent)
  }

  function updateSection(index: number, section: PageSection) {
    const next = [...content.sections]
    next[index] = section
    update('sections', next)
  }

  function addSection() {
    update('sections', [...content.sections, { title: '', body: '' }])
  }

  function removeSection(index: number) {
    update('sections', content.sections.filter((_, i) => i !== index))
  }

  function updateCard(index: number, card: ContactCard) {
    const next = [...(content.contactCards ?? [])]
    next[index] = card
    update('contactCards', next)
  }

  function addCard() {
    update('contactCards', [...(content.contactCards ?? []), { icon: 'Mail', title: '', value: '' }])
  }

  function removeCard(index: number) {
    update('contactCards', (content.contactCards ?? []).filter((_, i) => i !== index))
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Field label='Titre de page' value={content.title} onChange={(v) => update('title', v)} />
        <Field
          label='Titre meta (optionnel)'
          value={content.metaTitle ?? ''}
          onChange={(v) => update('metaTitle', v || undefined)}
        />
      </div>

      <Field
        label='Description meta (optionnelle)'
        value={content.metaDescription ?? ''}
        onChange={(v) => update('metaDescription', v || undefined)}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Field
          label="Date de dernière mise à jour (optionnelle)"
          value={content.lastUpdated ?? ''}
          onChange={(v) => update('lastUpdated', v || undefined)}
        />
        <Field
          label='Introduction (optionnelle)'
          value={content.intro ?? ''}
          onChange={(v) => update('intro', v || undefined)}
        />
      </div>

      {isContact && (
        <div className='p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 space-y-4'>
          <h3 className='text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2'>
            <MessageSquare className='w-4 h-4 text-tahfidz-green' />
            Cartes de contact
          </h3>
          {(content.contactCards ?? []).map((card, index) => (
            <div
              key={index}
              className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 space-y-3'
            >
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold text-gray-500'>Carte {index + 1}</span>
                <button
                  type='button'
                  onClick={() => removeCard(index)}
                  className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </button>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <Field
                  label='Icône'
                  value={card.icon}
                  onChange={(v) => updateCard(index, { ...card, icon: v })}
                />
                <Field
                  label='Titre'
                  value={card.title}
                  onChange={(v) => updateCard(index, { ...card, title: v })}
                />
                <Field
                  label='Valeur'
                  value={card.value}
                  onChange={(v) => updateCard(index, { ...card, value: v })}
                />
              </div>
              <Field
                label='Lien (optionnel)'
                value={card.href ?? ''}
                onChange={(v) => updateCard(index, { ...card, href: v || undefined })}
              />
            </div>
          ))}
          <button
            type='button'
            onClick={addCard}
            className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
          >
            <Plus className='w-3.5 h-3.5' />
            Ajouter une carte
          </button>
        </div>
      )}

      <div className='space-y-4'>
        <h3 className='text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2'>
          <FileText className='w-4 h-4 text-tahfidz-green' />
          Sections
        </h3>
        {content.sections.map((section, index) => (
          <div
            key={index}
            className='p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 space-y-3'
          >
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold text-gray-500'>Section {index + 1}</span>
              <button
                type='button'
                onClick={() => removeSection(index)}
                className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors'
              >
                <Trash2 className='w-3.5 h-3.5' />
              </button>
            </div>
            <Field
              label='Titre'
              value={section.title}
              onChange={(v) => updateSection(index, { ...section, title: v })}
            />
            <Field
              label='Contenu (paragraphes séparés par une ligne vide ; listes avec "- ")'
              value={section.body}
              onChange={(v) => updateSection(index, { ...section, body: v })}
              textarea
              rows={8}
            />
          </div>
        ))}
        <button
          type='button'
          onClick={addSection}
          className='flex items-center gap-1.5 text-xs font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors'
        >
          <Plus className='w-3.5 h-3.5' />
          Ajouter une section
        </button>
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────

const PAGE_KEYS: SitePageKey[] = [
  'privacy',
  'terms',
  'security',
  'contact',
  'updates',
  'help',
  'docs',
  'api-docs',
]

const PAGE_LABELS: Record<SitePageKey, string> = {
  privacy: 'Confidentialité',
  terms: 'Conditions',
  security: 'Sécurité',
  contact: 'Contact',
  updates: 'Mises à jour',
  help: 'Aide',
  docs: 'Documentation',
  'api-docs': 'API',
}

export function SiteConfigClient({ initialLanding, initialGlobal, initialPages }: SiteConfigClientProps) {
  const [landing, setLanding] = useState<Landing>({
    fr: normalizeLandingContent(initialLanding.fr, 'fr'),
    en: normalizeLandingContent(initialLanding.en, 'en'),
    ar: normalizeLandingContent(initialLanding.ar, 'ar'),
  })
  const [global, setGlobal] = useState<GlobalContent>(normalizeGlobal(initialGlobal))
  const [pages, setPages] = useState<Record<SitePageKey, SitePageConfig>>(initialPages)
  const [activeTab, setActiveTab] = useState<'landing' | 'global' | 'pages'>('landing')
  const [activeLang, setActiveLang] = useState<Lang>('fr')
  const [activePageKey, setActivePageKey] = useState<SitePageKey>('privacy')
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  })
  const [saving, setSaving] = useState<'landing' | 'global' | SitePageKey | null>(null)

  async function saveLanding() {
    setSaving('landing')
    setStatus({ type: null, message: '' })
    try {
      const res = await fetch('/api/admin/site-config/landing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(landing),
      })
      if (!res.ok) {
        throw new Error(`Erreur ${res.status} lors de la sauvegarde.`)
      }
      setStatus({ type: 'success', message: 'Landing page sauvegardée avec succès.' })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.',
      })
    } finally {
      setSaving(null)
    }
  }

  async function saveGlobal() {
    setSaving('global')
    setStatus({ type: null, message: '' })
    try {
      const res = await fetch('/api/admin/site-config/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(global),
      })
      if (!res.ok) {
        throw new Error(`Erreur ${res.status} lors de la sauvegarde.`)
      }
      setStatus({ type: 'success', message: 'Contenus globaux sauvegardés avec succès.' })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.',
      })
    } finally {
      setSaving(null)
    }
  }

  async function savePage(key: SitePageKey) {
    setSaving(key)
    setStatus({ type: null, message: '' })
    try {
      const res = await fetch(`/api/admin/site-config/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pages[key]),
      })
      if (!res.ok) {
        throw new Error(`Erreur ${res.status} lors de la sauvegarde.`)
      }
      setStatus({ type: 'success', message: `Page "${PAGE_LABELS[key]}" sauvegardée avec succès.` })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.',
      })
    } finally {
      setSaving(null)
    }
  }

  const langLabel: Record<Lang, string> = { fr: 'FR', en: 'EN', ar: 'AR' }

  const primaryBtn = cn(
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
    'bg-tahfidz-green text-white hover:bg-tahfidz-green/90',
    'disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
  )

  const secondaryBtn = cn(
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
  )

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
      <div className='max-w-5xl mx-auto px-4 py-8 space-y-6'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Contenu du site</h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
              Éditez la landing page, les contenus globaux et les pages statiques de TAHFIDZ.
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => window.open('/', '_blank')}
              className={secondaryBtn}
            >
              <Eye className='w-4 h-4' />
              Aperçu
            </button>
            {activeTab === 'landing' && (
              <button
                type='button'
                onClick={saveLanding}
                disabled={saving === 'landing'}
                className={primaryBtn}
              >
                <Save className='w-4 h-4' />
                {saving === 'landing' ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            )}
            {activeTab === 'global' && (
              <button
                type='button'
                onClick={saveGlobal}
                disabled={saving === 'global'}
                className={primaryBtn}
              >
                <Save className='w-4 h-4' />
                {saving === 'global' ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            )}
            {activeTab === 'pages' && (
              <button
                type='button'
                onClick={() => savePage(activePageKey)}
                disabled={saving === activePageKey}
                className={primaryBtn}
              >
                <Save className='w-4 h-4' />
                {saving === activePageKey ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            )}
          </div>
        </div>

        {/* Onglets principaux */}
        <div className='flex items-center gap-1 border-b border-gray-200 dark:border-gray-700'>
          <button
            type='button'
            onClick={() => setActiveTab('landing')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'landing'
                ? 'border-tahfidz-green text-tahfidz-green'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            Landing page
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('global')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'global'
                ? 'border-tahfidz-green text-tahfidz-green'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            Contenus globaux
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('pages')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'pages'
                ? 'border-tahfidz-green text-tahfidz-green'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            Pages statiques
          </button>
        </div>

        {/* Contenu Landing */}
        {activeTab === 'landing' && (
          <div className='space-y-6'>
            <div className='flex items-center gap-2'>
              {(['fr', 'en', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  type='button'
                  onClick={() => setActiveLang(lang)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
                    activeLang === lang
                      ? 'bg-tahfidz-green text-white border-tahfidz-green'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  {langLabel[lang]}
                </button>
              ))}
            </div>

            <LandingEditor
              lang={activeLang}
              content={landing[activeLang]}
              onChange={(nextContent) =>
                setLanding((prev) => ({ ...prev, [activeLang]: nextContent } as Landing))
              }
            />

            <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <button type='button' onClick={() => window.open('/', '_blank')} className={secondaryBtn}>
                <Eye className='w-4 h-4' />
                Aperçu
              </button>
              <button
                type='button'
                onClick={saveLanding}
                disabled={saving === 'landing'}
                className={primaryBtn}
              >
                <Save className='w-4 h-4' />
                {saving === 'landing' ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        )}

        {/* Contenu Global */}
        {activeTab === 'global' && (
          <div className='space-y-6'>
            <GlobalEditor global={global} onChange={setGlobal} />

            <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <button type='button' onClick={() => window.open('/', '_blank')} className={secondaryBtn}>
                <Eye className='w-4 h-4' />
                Aperçu
              </button>
              <button
                type='button'
                onClick={saveGlobal}
                disabled={saving === 'global'}
                className={primaryBtn}
              >
                <Save className='w-4 h-4' />
                {saving === 'global' ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        )}

        {/* Contenu Pages statiques */}
        {activeTab === 'pages' && (
          <div className='space-y-6'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
              <div className='flex items-center gap-2'>
                {(['fr', 'en', 'ar'] as const).map((lang) => (
                  <button
                    key={lang}
                    type='button'
                    onClick={() => setActiveLang(lang)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
                      activeLang === lang
                        ? 'bg-tahfidz-green text-white border-tahfidz-green'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    {langLabel[lang]}
                  </button>
                ))}
              </div>

              <select
                value={activePageKey}
                onChange={(e) => setActivePageKey(e.target.value as SitePageKey)}
                className={cn(
                  'px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                  'rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none',
                  'focus:ring-2 focus:ring-tahfidz-green/50'
                )}
              >
                {PAGE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {PAGE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <PageEditor
              content={pages[activePageKey][activeLang]}
              onChange={(nextContent) =>
                setPages((prev) => ({
                  ...prev,
                  [activePageKey]: { ...prev[activePageKey], [activeLang]: nextContent },
                }))
              }
              isContact={activePageKey === 'contact'}
            />

            <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                type='button'
                onClick={() => window.open(`/${activePageKey === 'api-docs' ? 'api-docs' : activePageKey}`, '_blank')}
                className={secondaryBtn}
              >
                <Eye className='w-4 h-4' />
                Aperçu
              </button>
              <button
                type='button'
                onClick={() => savePage(activePageKey)}
                disabled={saving === activePageKey}
                className={primaryBtn}
              >
                <Save className='w-4 h-4' />
                {saving === activePageKey ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        )}

        <StatusMessage status={status} />
      </div>
    </div>
  )
}
