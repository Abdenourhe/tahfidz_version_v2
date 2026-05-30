"use client"

import { motion } from "framer-motion"

const float = {
  y: [0, -12, 0],
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
}

const floatSlow = {
  y: [0, -8, 0],
  transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG ISOMÉTRIQUE : Homme avec thobe + bureau + ordinateur + icônes flottantes
// ═══════════════════════════════════════════════════════════════════════════════
function IsometricIllustration() {
  return (
    <svg viewBox="0 0 500 420" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradients */}
        <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#5C440E" />
        </linearGradient>
        <linearGradient id="thobeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5E6C8" />
          <stop offset="100%" stopColor="#D4C4A0" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16213e" />
        </linearGradient>
        <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="250" cy="380" rx="140" ry="25" fill="#000" opacity="0.15" />

      {/* Bureau (isométrique) */}
      <g filter="url(#shadow)">
        {/* Plateau du bureau */}
        <path d="M120 280 L250 220 L380 280 L250 340 Z" fill="url(#deskGrad)" />
        {/* Côté gauche */}
        <path d="M120 280 L120 340 L250 400 L250 340 Z" fill="#6B4F0F" />
        {/* Côté droit */}
        <path d="M380 280 L380 340 L250 400 L250 340 Z" fill="#4A3608" />
        {/* Pieds */}
        <rect x="140" y="340" width="15" height="35" fill="#5C440E" rx="2" />
        <rect x="345" y="340" width="15" height="35" fill="#5C440E" rx="2" />
      </g>

      {/* Ordinateur portable */}
      <g transform="translate(200, 200)">
        {/* Écran */}
        <rect x="0" y="0" width="100" height="70" rx="4" fill="url(#screenGrad)" stroke="#333" strokeWidth="1" />
        {/* Contenu écran - Dashboard */}
        <rect x="8" y="8" width="84" height="54" rx="2" fill="#0f172a" />
        {/* Barre de titre */}
        <rect x="8" y="8" width="84" height="8" rx="1" fill="#1e293b" />
        <circle cx="14" cy="12" r="2" fill="#ef4444" />
        <circle cx="20" cy="12" r="2" fill="#f59e0b" />
        <circle cx="26" cy="12" r="2" fill="#10b981" />
        {/* Graphiques */}
        <rect x="12" y="22" width="30" height="20" rx="2" fill="#10b981" opacity="0.3" />
        <rect x="16" y="26" width="6" height="16" rx="1" fill="#10b981" />
        <rect x="26" y="30" width="6" height="12" rx="1" fill="#059669" />
        <rect x="36" y="24" width="6" height="18" rx="1" fill="#34d399" />
        {/* Ligne de progression */}
        <rect x="12" y="48" width="76" height="4" rx="2" fill="#1e293b" />
        <rect x="12" y="48" width="55" height="4" rx="2" fill="#10b981" />
        {/* Clavier/base */}
        <path d="M-10 70 L50 90 L110 70 L50 50 Z" fill="#374151" />
        <path d="M-10 70 L50 90 L50 95 L-10 75 Z" fill="#1f2937" />
        <path d="M110 70 L50 90 L50 95 L110 75 Z" fill="#111827" />
      </g>

      {/* Livre/Coran sur le bureau */}
      <g transform="translate(160, 260)">
        <rect x="0" y="0" width="35" height="45" rx="2" fill="#059669" filter="url(#shadow)" />
        <rect x="3" y="3" width="29" height="39" rx="1" fill="#10b981" />
        <text x="17" y="22" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">قرآن</text>
        <line x1="17" y1="28" x2="17" y2="38" stroke="white" strokeWidth="1" opacity="0.5" />
      </g>

      {/* Tasse à café */}
      <g transform="translate(320, 270)">
        <ellipse cx="15" cy="20" rx="12" ry="8" fill="#fff" filter="url(#shadow)" />
        <ellipse cx="15" cy="18" rx="10" ry="6" fill="#92400e" />
        <path d="M25 15 Q30 15 30 20 Q30 25 25 25" stroke="#fff" strokeWidth="2" fill="none" />
        {/* Vapeur */}
        <path d="M12 10 Q15 5 12 0" stroke="#fff" strokeWidth="1.5" opacity="0.4" fill="none" />
        <path d="M18 10 Q21 5 18 0" stroke="#fff" strokeWidth="1.5" opacity="0.4" fill="none" />
      </g>

      {/* PERSONNAGE : Homme avec thobe */}
      <g transform="translate(250, 140)">
        {/* Ombre */}
        <ellipse cx="0" cy="240" rx="50" ry="12" fill="#000" opacity="0.1" />
        
        {/* Thobe (corps) */}
        <path d="M-35 60 L-25 230 L25 230 L35 60 Q35 50 0 50 Q-35 50 -35 60 Z" fill="url(#thobeGrad)" filter="url(#shadow)" />
        
        {/* Ceinture */}
        <rect x="-32" y="110" width="64" height="6" rx="2" fill="#C4A35A" />
        
        {/* Tête */}
        <circle cx="0" cy="25" r="28" fill="#F5E6C8" />
        
        {/* Barbe */}
        <path d="M-20 30 Q0 55 20 30 Q20 40 0 50 Q-20 40 -20 30" fill="#2D1810" />
        
        {/* Kufi (bonnet) */}
        <ellipse cx="0" cy="8" rx="26" ry="12" fill="#fff" />
        <ellipse cx="0" cy="5" rx="24" ry="10" fill="#f8fafc" />
        
        {/* Visage */}
        <circle cx="-8" cy="22" r="3" fill="#2D1810" />
        <circle cx="8" cy="22" r="3" fill="#2D1810" />
        <path d="M-3 32 Q0 35 3 32" stroke="#2D1810" strokeWidth="1.5" fill="none" />
        
        {/* Bras droit (tient tablette) */}
        <path d="M30 70 Q50 100 45 130" stroke="#F5E6C8" strokeWidth="14" strokeLinecap="round" fill="none" />
        <circle cx="45" cy="130" r="8" fill="#F5E6C8" />
        
        {/* Tablette */}
        <rect x="35" y="115" width="40" height="55" rx="4" fill="#1f2937" transform="rotate(-15 55 142)" filter="url(#shadow)" />
        <rect x="38" y="118" width="34" height="49" rx="2" fill="#0f172a" transform="rotate(-15 55 142)" />
        {/* Graphique sur tablette */}
        <rect x="42" y="125" width="20" height="8" rx="1" fill="#10b981" transform="rotate(-15 55 142)" />
        <rect x="42" y="138" width="15" height="4" rx="1" fill="#34d399" transform="rotate(-15 55 142)" />
        <rect x="42" y="146" width="18" height="4" rx="1" fill="#059669" transform="rotate(-15 55 142)" />
        
        {/* Bras gauche */}
        <path d="M-30 70 Q-50 100 -45 130" stroke="#F5E6C8" strokeWidth="14" strokeLinecap="round" fill="none" />
        <circle cx="-45" cy="130" r="8" fill="#F5E6C8" />
      </g>

      {/* Sol/ombre décorative */}
      <ellipse cx="250" cy="380" rx="100" ry="15" fill="#10b981" opacity="0.08" />
    </svg>
  )
}

export function IsometricHero() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glow background */}
      <div className="absolute inset-0 bg-tahfidz-green/10 dark:bg-tahfidz-green/20 rounded-full blur-3xl scale-110" />

      {/* Main illustration SVG */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10"
      >
        <div className="relative rounded-3xl overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-black/30 p-4">
          <IsometricIllustration />
        </div>
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div animate={float} className="absolute -top-4 -right-4 z-20">
        <div className="w-12 h-12 rounded-xl bg-tahfidz-gold-light dark:bg-amber-900/30 border border-tahfidz-gold/20 flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-tahfidz-gold">%</span>
        </div>
      </motion.div>

      <motion.div animate={floatSlow} className="absolute top-8 -left-6 z-20">
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