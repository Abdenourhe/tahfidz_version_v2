"use client"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { AnimatedCounter } from "./AnimatedCounter"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  prefix?: string
  suffix?: string
  colorClass?: string
  delay?: number
}

export function StatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
  colorClass = "text-tahfidz-green",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center shadow-sm"
    >
      <div className={`mx-auto mb-2 w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </motion.div>
  )
}
