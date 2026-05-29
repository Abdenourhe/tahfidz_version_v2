"use client"

import { motion } from "framer-motion"

export function IsometricHero() {
  const float = {
    y: [0, -12, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  }

  const floatSlow = {
    y: [0, -8, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
  }

  const pulse = {
    scale: [1, 1.05, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  }

  return (
    <svg
      viewBox="0 0 600 500"
      className="w-full h-auto max-w-lg mx-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background platform */}
      <ellipse cx="300" cy="420" rx="220" ry="40" fill="#E8F8F2" className="dark:fill-emerald-900/30" />
      
      {/* Desk */}
      <motion.g animate={floatSlow}>
        <rect x="180" y="280" width="240" height="20" rx="4" fill="#8B5E3C" />
        <rect x="200" y="300" width="20" height="80" rx="2" fill="#6B4226" />
        <rect x="380" y="300" width="20" height="80" rx="2" fill="#6B4226" />
      </motion.g>

      {/* Laptop */}
      <motion.g animate={float}>
        <rect x="260" y="240" width="100" height="60" rx="6" fill="#1F2937" className="dark:fill-gray-800" />
        <rect x="268" y="248" width="84" height="44" rx="3" fill="#10B981" opacity="0.2" />
        {/* Chart on screen */}
        <rect x="278" y="258" width="12" height="24" rx="1" fill="#10B981" />
        <rect x="296" y="264" width="12" height="18" rx="1" fill="#34D399" />
        <rect x="314" y="252" width="12" height="30" rx="1" fill="#059669" />
        <rect x="332" y="268" width="12" height="14" rx="1" fill="#6EE7B7" />
        {/* Laptop base */}
        <rect x="250" y="300" width="120" height="8" rx="2" fill="#374151" className="dark:fill-gray-700" />
      </motion.g>

      {/* Quran book */}
      <motion.g animate={floatSlow}>
        <rect x="340" y="265" width="40" height="28" rx="3" fill="#1D9E75" />
        <rect x="342" y="267" width="36" height="24" rx="2" fill="#E8F8F2" />
        <path d="M360 273 Q365 270 370 273 Q365 276 360 273" fill="#1D9E75" />
        <path d="M360 278 Q365 275 370 278 Q365 281 360 278" fill="#1D9E75" />
        <path d="M360 283 Q365 280 370 283 Q365 286 360 283" fill="#1D9E75" />
      </motion.g>

      {/* Person - Thobe */}
      <motion.g animate={float}>
        {/* Body */}
        <rect x="230" y="180" width="70" height="120" rx="12" fill="#D4A843" />
        <rect x="230" y="180" width="70" height="120" rx="12" fill="url(#thobeGradient)" opacity="0.3" />
        {/* Head */}
        <circle cx="265" cy="155" r="22" fill="#F5D0B0" />
        {/* Beard */}
        <path d="M250 165 Q265 185 280 165" fill="#2D2D2D" />
        {/* Cap */}
        <ellipse cx="265" cy="138" rx="20" ry="8" fill="#FFFFFF" />
        {/* Eyes */}
        <circle cx="258" cy="155" r="2" fill="#2D2D2D" />
        <circle cx="272" cy="155" r="2" fill="#2D2D2D" />
        {/* Arms holding tablet */}
        <rect x="210" y="200" width="20" height="50" rx="8" fill="#D4A843" />
        <rect x="300" y="200" width="20" height="50" rx="8" fill="#D4A843" />
        {/* Tablet */}
        <rect x="245" y="215" width="40" height="50" rx="4" fill="#374151" className="dark:fill-gray-600" />
        <rect x="250" y="222" width="30" height="36" rx="2" fill="#10B981" opacity="0.3" />
        {/* Mini chart on tablet */}
        <circle cx="265" cy="240" r="8" fill="none" stroke="#1D9E75" strokeWidth="2" />
        <path d="M265 240 L265 232" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" />
        <path d="M265 240 L271 244" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Floating elements */}
      <motion.g animate={{ ...float, transition: { ...float.transition, delay: 1 } }}>
        <circle cx="150" cy="120" r="18" fill="#FEF9E7" stroke="#B8860B" strokeWidth="2" />
        <text x="150" y="125" textAnchor="middle" fontSize="14" fill="#B8860B" fontWeight="bold">%</text>
      </motion.g>

      <motion.g animate={{ ...floatSlow, transition: { ...floatSlow.transition, delay: 1.5 } }}>
        <rect x="420" y="100" width="36" height="36" rx="8" fill="#F0EEFF" stroke="#5B4FCF" strokeWidth="2" />
        <rect x="430" y="112" width="16" height="4" rx="2" fill="#5B4FCF" />
        <rect x="430" y="120" width="12" height="4" rx="2" fill="#5B4FCF" opacity="0.6" />
      </motion.g>

      <motion.g animate={{ ...float, transition: { ...float.transition, delay: 2 } }}>
        <circle cx="460" cy="200" r="16" fill="#E8F8F2" stroke="#1D9E75" strokeWidth="2" />
        <path d="M454 200 L460 206 L468 196" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.g>

      <motion.g animate={{ ...floatSlow, transition: { ...floatSlow.transition, delay: 0.8 } }}>
        <rect x="130" y="220" width="32" height="32" rx="8" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
        <circle cx="146" cy="236" r="6" fill="#EF4444" opacity="0.2" />
        <circle cx="146" cy="236" r="3" fill="#EF4444" />
      </motion.g>

      {/* Chart floating above */}
      <motion.g animate={pulse}>
        <rect x="360" y="130" width="80" height="50" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" className="dark:fill-gray-800 dark:stroke-gray-700" />
        <rect x="370" y="160" width="10" height="14" rx="2" fill="#10B981" />
        <rect x="385" y="152" width="10" height="22" rx="2" fill="#34D399" />
        <rect x="400" y="145" width="10" height="29" rx="2" fill="#059669" />
        <rect x="415" y="155" width="10" height="19" rx="2" fill="#6EE7B7" />
        <line x1="370" y1="140" x2="425" y2="140" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2 2" className="dark:stroke-gray-500" />
      </motion.g>

      {/* Connection lines */}
      <motion.path
        d="M300 240 Q320 180 360 150"
        stroke="#1D9E75"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        fill="none"
        opacity="0.4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />

      <motion.path
        d="M280 240 Q200 200 150 140"
        stroke="#B8860B"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        fill="none"
        opacity="0.4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />

      <defs>
        <linearGradient id="thobeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  )
}
