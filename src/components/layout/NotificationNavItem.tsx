"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotification } from "@/contexts/NotificationContext"

interface Props {
  href: string
  label: string
  isActive: boolean
  activeClass?: string
  inactiveClass?: string
  iconActiveClass?: string
  iconInactiveClass?: string
  iconContainerClass?: string
  className?: string
  collapsed?: boolean
  showLabel?: boolean
}

export function NotificationNavItem({
  href,
  label,
  isActive,
  activeClass   = "bg-tahfidz-green-light text-tahfidz-green font-semibold",
  inactiveClass = "text-gray-600 hover:bg-gray-50",
  iconActiveClass   = "text-tahfidz-green",
  iconInactiveClass = "text-gray-400",
  iconContainerClass,
  className,
  collapsed,
  showLabel = true,
}: Props) {
  const { unreadCount } = useNotification()

  const iconSize = collapsed ? 22 : (iconContainerClass ? 16 : 18)
  const iconEl = (
    <>
      <Bell size={iconSize} className={cn(isActive ? iconActiveClass : iconInactiveClass)} />
      {unreadCount > 0 && (
        <span className={cn(
          "absolute min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none",
          collapsed ? "-top-2 -right-2" : "-top-1.5 -right-1.5"
        )}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </>
  )

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-xl text-sm transition-all duration-150 group",
        collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
        isActive ? activeClass : inactiveClass,
        className,
      )}
    >
      {iconContainerClass ? (
        <div className={cn("relative flex-shrink-0", iconContainerClass)}>
          {iconEl}
        </div>
      ) : (
        <div className="relative shrink-0">
          {iconEl}
        </div>
      )}
      {!collapsed && showLabel && <span className="flex-1 truncate">{label}</span>}
    </Link>
  )
}
