"use client"

import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import {
  BookOpen, Users, TrendingUp, MessageCircle,
  CheckCircle2, BarChart3, Calendar, Award, Bell
} from "lucide-react"

const IMAGE_SRC = "/images/hero-illustration.png"
const IMAGE_ALT = "TAHFIDZ Platform"

/* ─── Floating icon config ───────────────────────────────────────── */
interface FloatingIcon {
  Icon: React.ElementType
  position: string        // tailwind position classes
  color: string           // bg color
  iconColor: string       // icon color
  size?: "sm" | "md" | "lg"
  delay?: number
  duration?: number
}

const floatingIcons: FloatingIcon[] = [
  {
    Icon: BookOpen,
    position: "top-4 left-4",
    color: "bg-tahfidz-green",
    iconColor: "text-white",
    size: "md",
    delay: 0,
    duration: 4,
  },
  {
    Icon: Users,
    position: "top-8 right-8",
    color: "bg-tahfidz-purple",
    iconColor: "text-white",
    size: "md",
    delay: 0.5,
    duration: 4.5,
  },
  {
    Icon: TrendingUp,
    position: "bottom-16 left-2",
    color: "bg-tahfidz-gold",
    iconColor: "text-white",
    size: "sm",
    delay: 1,
    duration: 3.5,
  },
  {
    Icon: MessageCircle,
    position: "bottom-8 right-4",
    color: "bg-blue-500",
    iconColor: "text-white",
    size: "md",
    delay: 1.2,
    duration: 5,
  },
  {
    Icon: CheckCircle2,
    position: "top-1/3 -left-6",
    color: "bg-emerald-500",
    iconColor: "text-white",
    size: "sm",
    delay: 0.8,
    duration: 4,
  },
  {
    Icon: BarChart3,
    position: "bottom-1/3 -right-6",
    color: "bg-rose-500",
    iconColor: "text-white",
    size: "sm",
    delay: 1.5,
    duration: 4.2,
  },
  {
    Icon: Calendar,
    position: "top-1/2 -right-10",
    color: "bg-orange-500",
    iconColor: "text-white",
    size: "sm",
    delay: 0.3,
    duration: 3.8,
  },
  {
    Icon: Award,
    position: "bottom-1/4 -left-10",
    color: "bg-violet-500",
    iconColor: "text-white",
    size: "sm",
    delay: 2,
    duration: 4.5,
  },
  {
    Icon: Bell,
    position: "top-2 right-1/3",
    color: "bg-red-500",
    iconColor: "text-white",
    size: "sm",
    delay: 0.6,
    duration: 3.2,
  },
]

const sizeMap = { sm: "w-9 h-9", md: "w-11 h-11", lg: "w-14 h-14" }
const iconSizeMap = { sm: 16, md: 20, lg: 24 }

function FloatingBadge({ item }: { item: FloatingIcon }) {
  return (
    <motion.div
      className={`absolute ${item.position} z-20`}
      animate={{
        y: [0, -10, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: item.duration ?? 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: item.delay ?? 0,
      }}
    >
      <div
        className={`${sizeMap[item.size ?? "md"]} ${item.color} rounded-xl flex items-center justify-center shadow-lg shadow-black/10 backdrop-blur-sm`}
      >
        <item.Icon size={iconSizeMap[item.size ?? "md"]} className={item.iconColor} />
      </div>
      {/* Glow ring */}
      <div
        className={`absolute inset-0 ${item.color} rounded-xl opacity-30 blur-md -z-10`}
      />
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export function HeroImage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95])

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-tahfidz-green/10 dark:bg-tahfidz-green/15 rounded-full blur-3xl scale-110"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating icons behind image */}
      {floatingIcons.map((item, i) => (
        <FloatingBadge key={i} item={item} />
      ))}

      {/* Main image container */}
      <motion.div
        style={{ y, rotate, scale }}
        className="relative z-10"
      >
        <div className="relative rounded-3xl overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-black/20">
          <Image
            src={IMAGE_SRC}
            alt={IMAGE_ALT}
            width={600}
            height={500}
            className="w-full h-auto object-contain"
            priority
          />

          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-tahfidz-green/5 via-transparent to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Bottom floating stat card */}
      <motion.div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 rounded-lg bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center">
            <TrendingUp size={16} className="text-tahfidz-green" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-gray-900 dark:text-white">+23%</div>
            <div className="text-gray-400">Memorisation</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
