"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  MessageSquare,
  Send,
  BarChart3,
  Settings,
  Rocket,
  Music2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/accounts", label: "Cuentas", icon: Users },
  { href: "/leads", label: "Leads", icon: MessageSquare },
  { href: "/messages", label: "Mensajes", icon: Send },
  { href: "/campaign", label: "Campaña", icon: Rocket },
  { href: "/metrics", label: "Métricas", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-tiktok-gray border-r border-white/10 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tiktok-cyan to-tiktok-red flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Insta-Cli</h1>
            <p className="text-xs text-tiktok-cyan">Tiktok</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-tiktok-red/20 to-tiktok-cyan/20 text-white border-l-2 border-tiktok-red"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-tiktok-cyan")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-gradient-to-r from-tiktok-red/10 to-tiktok-cyan/10 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Estado del Agente</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-400">Conectado</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
