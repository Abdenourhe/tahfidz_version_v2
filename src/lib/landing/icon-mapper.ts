// src/lib/landing/icon-mapper.ts
// Mappe les noms d'icônes string vers les composants Lucide React.

import type { ComponentType } from "react"
import {
  Star,
  BookOpen,
  Users,
  GraduationCap,
  BarChart2,
  Megaphone,
  Shield,
  UserCheck,
  BookMarked,
  Wifi,
} from "lucide-react"

export type IconComponent = ComponentType<{
  size?: number
  className?: string
  strokeWidth?: number
}>

const iconMap: Record<string, IconComponent> = {
  BookOpen: BookOpen as IconComponent,
  Users: Users as IconComponent,
  GraduationCap: GraduationCap as IconComponent,
  BarChart2: BarChart2 as IconComponent,
  Megaphone: Megaphone as IconComponent,
  Shield: Shield as IconComponent,
  UserCheck: UserCheck as IconComponent,
  BookMarked: BookMarked as IconComponent,
  Wifi: Wifi as IconComponent,
}

export function getIcon(name: string): IconComponent {
  return iconMap[name] ?? Star
}
