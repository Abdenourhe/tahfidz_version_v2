"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const float = {
  y: [0, -12, 0],
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
}

const floatSlow = {
  y: [0, -8, 0],
  transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
}

export function IsometricHero() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glow background */}
      <div className="absolute inset-0 bg-tahfidz-green/10 dark:bg-tahfidz-green/20 rounded-full blur-3xl scale-110" />

      {/* Main image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10"
      >
        <div className="relative rounded-3xl overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-black/30">
          <Image
            src="/images/hero-illustration.png"
            alt="TAHFIDZ Platform"
            width={500}
            height={420}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div
        animate={float}
        className="absolute -top-4 -right-4 z-20"
      >
        <div className="w-12 h-12 rounded-xl bg-tahfidz-gold-light dark:bg-amber-900/30 border border-tahfidz-gold/20 flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-tahfidz-gold">%</span>
        </div>
      </motion.div>

      <motion.div
        animate={floatSlow}
        className="absolute top-8 -left-6 z-20"
      >
        <div className="w-10 h-10 rounded-lg bg-tahfidz-green-light dark:bg-emerald-900/30 border border-tahfidz-green/20 flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </motion.div>

      <motion.div
        animate={{ ...float, transition: { ...float.transition, delay: 1 } }}
        className="absolute bottom-12 -right-8 z-20"
      >
        <div className="w-14 h-14 rounded-2xl bg-tahfidz-purple-light dark:bg-purple-900/30 border border-tahfidz-purple/20 flex flex-col items-center justify-center gap-1 shadow-lg">
          <div className="w-6 h-1.5 rounded-full bg-tahfidz-purple" />
          <div className="w-4 h-1.5 rounded-full bg-tahfidz-purple/60" />
        </div>
      </motion.div>

      <motion.div
        animate={{ ...floatSlow, transition: { ...floatSlow.transition, delay: 1.5 } }}
        className="absolute -bottom-2 left-8 z-20"
      >
        <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-center justify-center shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      </motion.div>

      <motion.div
        animate={{ ...float, transition: { ...float.transition, delay: 2 } }}
        className="absolute top-1/2 -right-12 z-20"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 flex items-center justify-center shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      </motion.div>

      {/* Decorative dots pattern */}
      <div className="absolute -top-6 -left-6 w-24 h-24 opacity-20 z-0">
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
    </div>
  )
}
