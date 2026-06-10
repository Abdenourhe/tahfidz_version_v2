"use client"
import Image from "next/image"
import { motion } from "framer-motion"
import { ReactNode } from "react"

interface ProfileHeaderProps {
  name: string
  nameAr?: string | null
  role: string
  roleColor?: string
  avatar?: string | null
  avatarLetter: string
  avatarColor?: string
  children?: ReactNode
  avatarNode?: ReactNode
}

export function ProfileHeader({
  name,
  nameAr,
  role,
  roleColor = "bg-tahfidz-green/10 text-tahfidz-green",
  avatar,
  avatarLetter,
  avatarColor = "bg-tahfidz-green",
  children,
  avatarNode,
}: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {avatarNode ? (
          <div className="flex-shrink-0">{avatarNode}</div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative w-20 h-20 rounded-2xl ${avatarColor} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden`}
          >
            {avatar ? (
              <Image src={avatar} alt={name} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-3xl">{avatarLetter}</span>
            )}
            <motion.div
              className="absolute inset-0 rounded-2xl ring-2 ring-white/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColor}`}>{role}</span>
          </div>
          {nameAr && <p className="arabic text-gray-500 dark:text-gray-400 text-base mt-0.5">{nameAr}</p>}
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </motion.div>
  )
}
