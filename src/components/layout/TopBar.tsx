"use client"
// src/components/layout/TopBar.tsx
// Barre supérieure persistante — langue + dark mode

import { TopBarControls } from "@/components/layout/TopBarControls"

export function TopBar() {
  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="flex items-center justify-end px-6 h-14">
        <TopBarControls />
      </div>
    </div>
  )
}
