"use client"

import { useCallback, useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { agentFetch, getAgentBaseUrl } from "@/lib/local-agent"
import {
  Users,
  MessageSquare,
  Send,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

interface DashboardStats {
  totalAccounts: number
  activeAccounts: number
  totalLeads: number
  freeLeads: number
  contactedLeads: number
  rejectedLeads: number
  totalMessages: number
  totalLogs: number
  failedLogs: number
}

const emptyStats: DashboardStats = {
  totalAccounts: 0,
  activeAccounts: 0,
  totalLeads: 0,
  freeLeads: 0,
  contactedLeads: 0,
  rejectedLeads: 0,
  totalMessages: 0,
  totalLogs: 0,
  failedLogs: 0,
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const data = await agentFetch<DashboardStats>("/api/dashboard")
      setStats(data)
      setConnectionError(null)
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "No se pudo conectar con el agente local")
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tiktok-gradient mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400">Resumen general del sistema</p>
          </div>

          {connectionError && (
            <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              La app desplegada necesita el agente local corriendo en{" "}
              <span className="font-mono">{getAgentBaseUrl()}</span>. Error actual: {connectionError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Cuentas
                </CardTitle>
                <Users className="w-4 h-4 text-tiktok-cyan" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAccounts}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeAccounts} activas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Leads
                </CardTitle>
                <MessageSquare className="w-4 h-4 text-tiktok-red" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="success" className="text-[10px]">
                    {stats.freeLeads} libres
                  </Badge>
                  <Badge variant="cyan" className="text-[10px]">
                    {stats.contactedLeads} contactados
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Mensajes Enviados
                </CardTitle>
                <Send className="w-4 h-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLogs}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.failedLogs} fallidos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Plantillas
                </CardTitle>
                <Activity className="w-4 h-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
                <p className="text-xs text-gray-500 mt-1">
                  mensajes configurados
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-tiktok-cyan" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm">Campaña iniciada</span>
                    </div>
                    <span className="text-xs text-gray-500">En tiempo real vía agente</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-tiktok-cyan" />
                      <span className="text-sm">Cuentas y leads sincronizados</span>
                    </div>
                    <span className="text-xs text-gray-500">Browser {getAgentBaseUrl()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-tiktok-red" />
                      <span className="text-sm">Sin backend remoto obligatorio</span>
                    </div>
                    <span className="text-xs text-gray-500">UI lista para Vercel</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-tiktok-red" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.failedLogs > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-sm font-medium text-red-400">
                          {stats.failedLogs} mensajes fallidos
                        </p>
                        <p className="text-xs text-gray-500">
                          Revisa las cuentas bloqueadas
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.freeLeads === 0 && stats.totalLeads > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium text-yellow-400">
                          Sin leads libres
                        </p>
                        <p className="text-xs text-gray-500">
                          Agrega nuevos leads para continuar
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.totalAccounts === 0 && (
                    <div className="flex items-center gap-3 p-3 bg-tiktok-cyan/10 border border-tiktok-cyan/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-tiktok-cyan" />
                      <div>
                        <p className="text-sm font-medium text-tiktok-cyan">
                          Sin cuentas configuradas
                        </p>
                        <p className="text-xs text-gray-500">
                          Agrega tu primera cuenta de TikTok
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.failedLogs === 0 && stats.totalAccounts > 0 && stats.freeLeads > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-400">
                          Todo en orden
                        </p>
                        <p className="text-xs text-gray-500">
                          El sistema está funcionando correctamente
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
