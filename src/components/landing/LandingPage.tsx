"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { motion, type Variants } from "framer-motion"
import {
  Menu, X, Star, Play, Check, ArrowRight, Sun, Moon,
  Sparkles, Heart, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getIcon } from "@/lib/landing/icon-mapper"
import { type LandingContent } from "@/lib/landing/default-content"
import { HeroImage } from "./HeroImage"

type Lang = "fr" | "en" | "ar"

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

function LandingIcon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Icon = getIcon(name)
  return <Icon size={size} className={className} />
}

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
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-tahfidz-green flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-tahfidz-green/25 group-hover:shadow-tahfidz-green/40 transition">
              ط
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">TAHFIDZ</span>
          </Link>

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

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(["fr", "en", "ar"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition",
                    lang === l
                      ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            <Link
              href="/login"
              className="hidden sm:inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-tahfidz-green transition"
            >
              {t.nav.login}
            </Link>

            <Link
              href="/register-school"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-tahfidz-green text-white text-sm font-semibold hover:bg-tahfidz-green/90 transition shadow-lg shadow-tahfidz-green/25"
            >
              {t.nav.register}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

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
                className="block text-base font-medium text-gray-700 dark:text-gray-200 hover:text-tahfidz-green"
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-2 pt-2">
              {(["fr", "en", "ar"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-md border transition",
                    lang === l
                      ? "bg-tahfidz-green text-white border-tahfidz-green"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link
              href="/login"
              className="block text-base font-medium text-gray-700 dark:text-gray-200 hover:text-tahfidz-green"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/register-school"
              className="block w-full text-center px-4 py-2 rounded-lg bg-tahfidz-green text-white text-sm font-semibold"
            >
              {t.nav.register}
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}

function HeroSection({ t }: { t: LandingContent }) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-tahfidz-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-emerald-400/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tahfidz-green/10 text-tahfidz-green text-xs font-semibold mb-6">
                <Sparkles size={14} />
                {t.hero.badge}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6"
            >
              {t.hero.title}{" "}
              <span className="text-tahfidz-green">{t.hero.titleHighlight}</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
              {t.hero.subtitle}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link
                href="/register-school"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-tahfidz-green text-white font-semibold hover:bg-tahfidz-green/90 transition shadow-lg shadow-tahfidz-green/25"
              >
                {t.hero.ctaPrimary}
                <ArrowRight size={18} />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <Play size={18} className="text-tahfidz-green" />
                {t.hero.ctaSecondary}
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex justify-center lg:justify-start gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">200+</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t.hero.stat1}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">20K+</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t.hero.stat2}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">1K+</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t.hero.stat3}</div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <HeroImage />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection({ t }: { t: LandingContent }) {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.features.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t.features.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {t.features.items.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-tahfidz-green/10 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LandingIcon name={item.icon} size={24} className="text-tahfidz-green" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorksSection({ t }: { t: LandingContent }) {
  return (
    <section id="how" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.how.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t.how.subtitle}
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.how.steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-tahfidz-green text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-tahfidz-green/25">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{step.desc}</p>
              {index < 2 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+4rem)] w-[calc(100%-8rem)] h-0.5 bg-gradient-to-r from-tahfidz-green/30 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UsersSection({ t }: { t: LandingContent }) {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.users.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t.users.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {t.users.items.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <LandingIcon name={item.icon} size={26} className="text-tahfidz-green" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.role}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function AnimatedStat({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const { count, start } = useAnimatedCounter(value)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      onViewportEnter={start}
      className="text-center"
    >
      <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-emerald-100 text-sm font-medium">{label}</div>
    </motion.div>
  )
}

function StatsSection({ t }: { t: LandingContent }) {
  return (
    <section className="py-20 bg-gradient-to-br from-tahfidz-green to-emerald-700 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-16"
        >
          {t.stats.title}
        </motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {t.stats.items.map((stat, index) => (
            <AnimatedStat key={index} value={stat.value} label={stat.label} suffix={stat.suffix} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection({ t }: { t: LandingContent }) {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.testimonials.title}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {t.testimonials.items.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 relative"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">&ldquo;{item.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center text-tahfidz-green font-bold">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.role}</div>
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
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.pricing.title}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {t.pricing.plans.map((plan, index) => {
            const isPopular = index === 1
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-2xl p-6 flex flex-col",
                  isPopular
                    ? "bg-white dark:bg-gray-800 border-2 border-tahfidz-green shadow-xl shadow-tahfidz-green/10 scale-105 z-10"
                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-tahfidz-green text-white text-xs font-bold rounded-full">
                    {t.pricing.popular}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{plan.students}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price === "0" ? "0" : plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.price === "0" ? "" : t.pricing.perYear}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <Check size={16} className="text-tahfidz-green mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register-school"
                  className={cn(
                    "block w-full text-center py-2.5 rounded-xl font-semibold transition",
                    isPopular
                      ? "bg-tahfidz-green text-white hover:bg-tahfidz-green/90"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  {plan.price === "0" ? t.pricing.request : t.pricing.request}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CTASection({ t }: { t: LandingContent }) {
  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl bg-gradient-to-br from-tahfidz-green to-emerald-700 p-10 md:p-16 text-center overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.cta.title}</h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">{t.cta.subtitle}</p>
            <Link
              href="/register-school"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-tahfidz-green font-bold hover:bg-gray-100 transition shadow-lg"
            >
              {t.cta.button}
              <ArrowRight size={18} />
            </Link>
            <p className="text-emerald-200 text-sm mt-4">{t.cta.sub}</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FooterLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  const baseClass = "group inline-flex items-center gap-1.5 hover:text-tahfidz-green transition"

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClass}>
        {children}
        <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
      </a>
    )
  }

  if (href.startsWith("mailto:")) {
    return <a href={href} className={baseClass}>{children}</a>
  }

  if (href.startsWith("/#")) {
    return <a href={href} className={baseClass}>{children}</a>
  }

  return <Link href={href} className={baseClass}>{children}</Link>
}

function Footer({ t }: { t: LandingContent }) {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-tahfidz-green flex items-center justify-center text-white font-bold text-lg">ط</div>
              <span className="font-bold text-lg text-white">TAHFIDZ</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">{t.footer.desc}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.footer.product}</h4>
            <ul className="space-y-2.5 text-sm">
              {t.footer.linksProduct.map((link, i) => (
                <li key={i}>
                  <FooterLink href={link.href} external={link.external}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.footer.support}</h4>
            <ul className="space-y-2.5 text-sm">
              {t.footer.linksSupport.map((link, i) => (
                <li key={i}>
                  <FooterLink href={link.href} external={link.external}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.footer.legal}</h4>
            <ul className="space-y-2.5 text-sm">
              {t.footer.linksLegal.map((link, i) => (
                <li key={i}>
                  <FooterLink href={link.href} external={link.external}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-gray-500 flex items-center gap-2 text-center">
            <Heart size={14} className="text-tahfidz-green" />
            &copy; {new Date().getFullYear()} TAHFIDZ. {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}

interface LandingPageProps {
  content: Record<Lang, LandingContent>
  initialLang?: Lang
}

export default function LandingPage({ content, initialLang = "fr" }: LandingPageProps) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = content[lang] ?? content["fr"]

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
