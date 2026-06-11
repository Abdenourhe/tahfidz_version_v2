"use client"
import { useEffect, useState, useRef } from "react"
import { useInView } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const start = 0
    const end = value
    if (end === 0) { setCount(0); return }
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4)
      const current = Math.round(start + (end - start) * ease)
      setCount(current)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  )
}
