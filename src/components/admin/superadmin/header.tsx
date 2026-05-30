"use client"
import { LogOut, Sun, Moon, Lock } from "lucide-react"
import { signOut } from "next-auth/react"

export function SuperAdminHeader({
  dark,
  onToggleDark,
  onChangePassword,
}: {
  dark: boolean
  onToggleDark: () => void
  onChangePassword: () => void
}) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl gradient-tahfidz flex items-center justify-center shadow"><span className="text-white text-sm font-bold">TH</span></div>
        <div><h1 className="font-bold text-gray-900 dark:text-gray-100">TAHFIDZ — Super Admin</h1><p className="text-xs text-gray-400 dark:text-gray-500">Tableau de bord plateforme</p></div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onChangePassword} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs transition" title="Modifier mon mot de passe">
          <Lock size={14} /><span className="hidden sm:inline">Mot de passe</span>
        </button>
        <button onClick={onToggleDark} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs transition" title={dark ? "Mode clair" : "Mode sombre"}>
          {dark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}<span className="hidden sm:inline">{dark ? "Clair" : "Sombre"}</span>
        </button>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition">
          <LogOut size={15} /> <span className="hidden sm:inline">Deconnexion</span>
        </button>
      </div>
    </header>
  )
}
