"use client"

import Image from "next/image"
import { motion } from "framer-motion"

/*
  Remplace cette URL par ton illustration Freepik (ou autre).
  Option 1 — Image externe (URL directe):
    src="https://cdn.example.com/mon-image.png"

  Option 2 — Image locale (copie dans public/images/):
    src="/images/hero-illustration.png"
*/
const IMAGE_SRC = "/images/hero-illustration.png"
const IMAGE_ALT = "TAHFIDZ Platform"

export function HeroImage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative w-full max-w-xl mx-auto"
    >
      {/* Glow background */}
      <div className="absolute inset-0 bg-tahfidz-green/10 dark:bg-tahfidz-green/15 rounded-full blur-3xl scale-110" />

      {/* Image container */}
      <div className="relative z-10 rounded-3xl overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-black/20">
        <Image
          src={IMAGE_SRC}
          alt={IMAGE_ALT}
          width={600}
          height={500}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
    </motion.div>
  )
}
