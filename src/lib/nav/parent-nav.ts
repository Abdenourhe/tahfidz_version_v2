// src/lib/nav/parent-nav.ts
// Source unique de vérité pour la navigation du portail parent

import {
  LayoutDashboard,
  Link2,
  CalendarDays,
  Video,
  Library,
  Bell,
  User,
  LucideIcon,
} from "lucide-react"

export interface ParentNavItem {
  key: string
  href: string
  icon: LucideIcon
  mobile?: boolean // false = masqué en mobile, true ou undefined = visible
}

export const PARENT_NAV_ITEMS: ParentNavItem[] = [
  { key: "dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
  { key: "linkChild", href: "/parent/link", icon: Link2 },
  { key: "attendance", href: "/parent/attendance", icon: CalendarDays },
  { key: "halaqa", href: "/parent/halaqa", icon: Video },
  { key: "library", href: "/parent/library", icon: Library },
  { key: "notifications", href: "/parent/notifications", icon: Bell },
  { key: "profile", href: "/parent/profile", icon: User },
]
