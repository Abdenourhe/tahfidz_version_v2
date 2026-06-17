"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { motion, useScroll, useTransform, type Variants } from "framer-motion"
import {
  Menu, X, Star,
  Play, Check, ArrowRight,
  Sun, Moon,
  Sparkles, Heart, Zap
} from "lucide-react"
import { HeroImage } from "./landing/HeroImage"
import { defaultLandingContent, iconMap, type LandingContent } from "@/lib/landing/default-content"

// ─── Traductions ────────────────────────────────────────────────────────────
type Lang = "fr" | "en" | "ar"

function LandingIcon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Icon = iconMap[name]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}

// ─── Animation variants ─────────────────────────────────────────────────────
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
}

// ─── Animated counter hook ──────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  return { count, start: () => setStarted(true) }
}

// ─── Components ─────────────────────────────────────────────────────────────

function Navbar({ lang, setLang, t }: { lang: Lang; setLang: (l: Lang) => void; t: LandingContent }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const navLinks = [
    { label: t.nav.home, href: "#" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.how, href: "#how" },
    { label: t.nav.pricing, href: "#pricing" },
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-b border-gray-100 dark:border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-tahfidz-green flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-tahfidz-green/25 group-hover:shadow-tahfidz-green/40 transition">
              ط
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">TAHFIDZ</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-tahfidz-green dark:hover:text-tahfidz-green transition"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Lang switcher */}
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(["fr", "en", "ar"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    lang === l
                      ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            {/* Login */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-tahfidz-green hover:bg-tahfidz-green-light dark:hover:bg-emerald-900/30 rounded-lg transition"
            >
              {t.nav.login}
            </Link>

            {/* CTA */}
            <Link
              href="/register-school"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-tahfidz-green hover:bg-emerald-700 rounded-lg shadow-lg shadow-tahfidz-green/25 hover:shadow-tahfidz-green/40 transition"
            >
              {t.nav.register}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950"
        >
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 py-2"
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-2 pt-2">
              {(["fr", "en", "ar"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                    lang === l
                      ? "border-tahfidz-green text-tahfidz-green bg-tahfidz-green-light dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-700 text-gray-500"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                href="/login"
                className="flex-1 text-center py-2.5 text-sm font-semibold text-tahfidz-green border border-tahfidz-green rounded-lg"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register-school"
                className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-tahfidz-green rounded-lg"
              >
                {t.nav.register}
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}

function HeroSection({ t }: { t: LandingContent }) {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 100])

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-tahfidz-green-light/60 via-white to-tahfidz-purple-light/30 dark:from-emerald-900/20 dark:via-gray-950 dark:to-purple-900/10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tahfidz-green/5 dark:bg-tahfidz-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tahfidz-purple/5 dark:bg-tahfidz-purple/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tahfidz-green-light dark:bg-emerald-900/30 text-tahfidz-green text-xs font-semibold border border-tahfidz-green/10 dark:border-emerald-700/30">
                <Sparkles size={14} />
                {t.hero.badge}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight"
            >
              {t.hero.title}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tahfidz-green to-emerald-500">
                {t.hero.titleHighlight}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-5 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {t.hero.subtitle}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/register-school"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-white bg-tahfidz-green hover:bg-emerald-700 rounded-xl shadow-xl shadow-tahfidz-green/25 hover:shadow-tahfidz-green/40 transition-all hover:-translate-y-0.5"
              >
                {t.hero.ctaPrimary}
                <ArrowRight size={18} />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-tahfidz-green dark:hover:border-tahfidz-green rounded-xl transition-all hover:-translate-y-0.5">
                <Play size={18} className="text-tahfidz-green" />
                {t.hero.ctaSecondary}
              </button>
            </motion.div>

            {/* Stats mini */}
            <motion.div
              variants={fadeInUp}
              className="mt-10 flex items-center gap-8 justify-center lg:justify-start"
            >
              {[
                { label: t.hero.stat1, value: "200+" },
                { label: t.hero.stat2, value: "20K+" },
                { label: t.hero.stat3, value: "1K+" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ y: y1 }}
            className="relative"
          >
            <div className="relative rounded-3xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-6 shadow-2xl shadow-gray-200/50 dark:shadow-black/30">
              <HeroImage />
            </div>
            {/* Decorative dots */}
            <div className="absolute -top-6 -right-6 w-24 h-24 opacity-20">
              <svg viewBox="0 0 100 100">
                {Array.from({ length: 25 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={(i % 5) * 20 + 10}
                    cy={Math.floor(i / 5) * 20 + 10}
                    r="2"
                    fill="#1D9E75"
                  />
                ))}
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection({ t }: { t: LandingContent }) {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tahfidz-green-light dark:bg-emerald-900/30 text-tahfidz-green text-xs font-semibold">
              <Zap size={14} />
              {t.features.title}
            </span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t.features.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t.features.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {t.features.items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-tahfidz-green/30 dark:hover:border-tahfidz-green/30 hover:shadow-lg hover:shadow-tahfidz-green/5 dark:hover:shadow-tahfidz-green/10 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center text-tahfidz-green mb-4 group-hover:scale-110 transition">
                <LandingIcon name={item.icon} size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorksSection({ t }: { t: LandingContent }) {
  return (
    <section id="how" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t.how.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t.how.subtitle}
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-tahfidz-green/30 via-tahfidz-green to-tahfidz-green/30" />

          {t.how.steps.map((step, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: i * 0.2 }}
              className="relative text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-tahfidz-green text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-tahfidz-green/25 mb-6 relative z-10">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UsersSection({ t }: { t: LandingContent }) {
  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t.users.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t.users.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {t.users.items.map((item, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 border border-gray-100 dark:border-gray-800 text-center hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center text-tahfidz-green mb-4">
                <LandingIcon name={item.icon} size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{item.role}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function StatItem({ item }: { item: { value: number; label: string; suffix: string } }) {
  const { count, start } = useAnimatedCounter(item.value)
  return (
    <motion.div
      variants={fadeInUp}
      onViewportEnter={start}
      className="space-y-1"
    >
      <div className="text-3xl sm:text-4xl font-extrabold text-white">
        {count.toLocaleString()}{item.suffix}
      </div>
      <div className="text-sm text-emerald-100 font-medium">{item.label}</div>
    </motion.div>
  )
}

function StatsSection({ t }: { t: LandingContent }) {
  return (
    <section className="py-16 lg:py-20 bg-tahfidz-green dark:bg-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center"
        >
          {t.stats.items.map((item, i) => (
            <StatItem key={i} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection({ t }: { t: LandingContent }) {
  return (
    <section className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tahfidz-gold-light dark:bg-amber-900/20 text-tahfidz-gold text-xs font-semibold mb-4">
            <Heart size={14} />
            {t.testimonials.title}
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t.testimonials.title}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {t.testimonials.items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5 italic">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center text-tahfidz-green font-bold text-sm">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</div>
                  <div className="text-xs text-gray-400">{item.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function PricingSection({ t }: { t: LandingContent }) {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t.pricing.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {t.pricing.plans.map((plan, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              className={`relative p-6 rounded-2xl border transition-all ${
                i === 1
                  ? "border-tahfidz-green bg-tahfidz-green-light/30 dark:bg-emerald-900/10 shadow-lg shadow-tahfidz-green/10"
                  : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:border-tahfidz-green/30"
              }`}
            >
              {i === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-tahfidz-green text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                  {t.pricing.popular}
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.students}</p>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}€</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t.pricing.perYear}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Check size={16} className="text-tahfidz-green shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register-school"
                className={`block w-full text-center py-2.5 rounded-xl text-sm font-bold transition ${
                  i === 1
                    ? "bg-tahfidz-green text-white hover:bg-emerald-700 shadow-lg shadow-tahfidz-green/25"
                    : "bg-white dark:bg-gray-800 text-tahfidz-green border border-tahfidz-green hover:bg-tahfidz-green hover:text-white"
                }`}
              >
                {t.pricing.request}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function CTASection({ t }: { t: LandingContent }) {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-tahfidz-green-light/50 via-white to-tahfidz-purple-light/30 dark:from-emerald-900/20 dark:via-gray-950 dark:to-purple-900/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t.cta.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {t.cta.subtitle}
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-8">
            <Link
              href="/register-school"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-tahfidz-green hover:bg-emerald-700 rounded-xl shadow-xl shadow-tahfidz-green/25 hover:shadow-tahfidz-green/40 transition-all hover:-translate-y-1"
            >
              {t.cta.button}
              <ArrowRight size={20} />
            </Link>
          </motion.div>
          <motion.p variants={fadeInUp} className="mt-3 text-sm text-gray-400">
            {t.cta.sub}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

function Footer({ t }: { t: LandingContent }) {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-tahfidz-green flex items-center justify-center text-white font-bold text-sm">
                ط
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">TAHFIDZ</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t.footer.desc}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t.footer.product}</h4>
            <ul className="space-y-2">
              {t.footer.linksProduct.map((link) => (
                <li key={link}>
                  <span className="text-sm text-gray-500 dark:text-gray-400 hover:text-tahfidz-green transition cursor-pointer">
                    {link}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t.footer.support}</h4>
            <ul className="space-y-2">
              {t.footer.linksSupport.map((link) => (
                <li key={link}>
                  <span className="text-sm text-gray-500 dark:text-gray-400 hover:text-tahfidz-green transition cursor-pointer">
                    {link}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t.footer.legal}</h4>
            <ul className="space-y-2">
              {t.footer.linksLegal.map((link) => (
                <li key={link}>
                  <span className="text-sm text-gray-500 dark:text-gray-400 hover:text-tahfidz-green transition cursor-pointer">
                    {link}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()}{t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function LandingPage({ content }: { content?: Record<Lang, LandingContent> }) {
  const [lang, setLang] = useState<Lang>("fr")
  const t = content?.[lang] ?? defaultLandingContent[lang]

  useEffect(() => {
    document.documentElement.dir = t.dir
    document.documentElement.lang = lang
  }, [t.dir, lang])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar lang={lang} setLang={setLang} t={t} />
      <HeroSection t={t} />
      <FeaturesSection t={t} />
      <HowItWorksSection t={t} />
      <UsersSection t={t} />
      <StatsSection t={t} />
      <TestimonialsSection t={t} />
      <PricingSection t={t} />
      <CTASection t={t} />
      <Footer t={t} />
    </div>
  )
}
