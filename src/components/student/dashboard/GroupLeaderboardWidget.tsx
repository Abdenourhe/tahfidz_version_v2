"use client"

import { Star, Trophy, Medal } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface Peer {
  userId: string
  totalStars: number
  currentStreak: number
  user: { fullName: string; avatar?: string | null }
}

export function GroupLeaderboardWidget({ peers, currentUserId }: { peers: Peer[]; currentUserId: string }) {
  const t = useT("studentDashboardClient")
  if (peers.length === 0) return null

  const sorted = [...peers].sort((a, b) => b.totalStars - a.totalStars)
  const top3 = sorted.slice(0, 3)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t("leaderboardTitle")}</h3>
        <Trophy size={16} className="text-tahfidz-gold" />
      </div>
      <div className="space-y-2">
        {top3.map((peer, i) => (
          <div
            key={peer.userId}
            className={`flex items-center gap-3 p-2.5 rounded-lg ${
              peer.userId === currentUserId ? "bg-tahfidz-green-light/30 dark:bg-emerald-900/20" : "bg-gray-50 dark:bg-gray-800"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center text-xs font-bold">
              {i === 0 ? <Medal size={16} className="text-tahfidz-gold" /> : i === 1 ? <Medal size={16} className="text-gray-400" /> : i === 2 ? <Medal size={16} className="text-orange-400" /> : <span className="text-gray-400">{i + 1}</span>}
            </div>
            <div className="w-7 h-7 rounded-full gradient-tahfidz flex items-center justify-center overflow-hidden shrink-0">
              {peer.user.avatar ? (
                <img src={peer.user.avatar} alt={peer.user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[10px] font-bold">{peer.user.fullName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{peer.user.fullName}</p>
            <span className="flex items-center gap-1 text-xs font-bold text-tahfidz-gold">
              <Star size={12} /> {peer.totalStars}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
