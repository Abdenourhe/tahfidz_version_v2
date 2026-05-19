"use client"
// src/components/layout/TopBar.tsx
// Barre supérieure persistante — langue + dark mode

import { TopBarControls } from "@/components/layout/TopBarControls"

export function TopBar() {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-end px-6 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <TopBarControls />
    </div>
  )
}
