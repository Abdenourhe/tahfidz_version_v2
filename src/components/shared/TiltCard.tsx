"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  intensity?: number
  glare?: boolean
}

export function TiltCard({ children, className, intensity = 8, glare = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  const springConfig = { stiffness: 300, damping: 30 }
  const rotateX = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), springConfig)
  const rotateY = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), springConfig)

  const glareX = useSpring(useTransform(x, [0, 1], [0, 100]), springConfig)
  const glareY = useSpring(useTransform(y, [0, 1], [0, 100]), springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    x.set(px)
    y.set(py)
  }

  const handleMouseLeave = () => {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
      {glare && (
        <motion.div
          style={{
            left: glareX,
            top: glareY,
            transform: "translate(-50%, -50%)",
          }}
          className="pointer-events-none absolute -inset-[100%] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <div
            className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 60%)",
            }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
