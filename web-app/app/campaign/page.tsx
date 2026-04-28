"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Play,
  Square,
  Activity,
  Send,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from "lucide-react"
import { agentFetch } from "@/lib/local-agent"

interface Campaign {
  id: string
  status: string
  startedAt: string | null
  stoppedAt: string | null
  totalSent: number
  totalFailed: number
  activeAccounts: number
  blockedAccounts: number
}

interface CampaignSetting {
  workers: number
  browsersPerWorker: number
  minDelaySeconds: number
  maxDelaySeconds: number
  messagesPerAccount: number
  failureThreshold: number
}

interface LogEntry {
  id: string
  timestamp: string
  account: string
  lead: string
  message: string
  status: string
}

export default function CampaignPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [settings, setSettings] = useState<CampaignSetting | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [stats, setStats] = useState({
    sent: 0,
    failed: 0,
    active: 0,
    blocked: 0,
  })

  const fetchCampaign = useCallback(async () => {
    try {
      const data = await agentFetch<Campaign[]>("/api/campaigns")
      if (data.length > 0) {
        setCampaign(data[0])
        setIsRunning(data[0].status === "running")
      }
    } catch (error) {
      console.error("Error fetching campaign:", error)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const data = await agentFetch<CampaignSetting>("/api/settings")
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }, [])

  useEffect(() => {
    fetchCampaign()
    fetchSettings()

    const interval = setInterval(() => {
      fetchCampaign()
      // Simular logs en tiempo real
      setLogs((prev) => {
        if (prev.length > 50) return prev.slice(-50)
        return prev
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchCampaign, fetchSettings])

  const handleStart = async () => {
    try {
      await agentFetch("/api/campaign/start", {
        method: "POST",
      })

      setIsRunning(true)
      fetchCampaign()
    } catch (error) {
      console.error("Error starting campaign:", error)
    }
  }

  const handleStop = async () => {
    try {
      await agentFetch("/api/campaign/stop", {
        method: "POST",
      })
      setIsRunning(false)
      fetchCampaign()
    } catch (error) {
      console.error("Error stopping campaign:", error)
    }
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tiktok-gradient mb-2">
                Campaña
              </h1>
              <p className="text-gray-400">Gestiona el envío masivo de mensajes</p>
            </div>
            <div className="flex gap-3">
              {!isRunning ? (
                <Button
                  variant="tiktok"
                  className="gap-2"
                  onClick={handleStart}
                >
                  <Play className="w-4 h-4" />
                  Activar Campaña
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={handleStop}
                >
                  <Square className="w-4 h-4" />
                  Frenar Campaña
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-tiktok-gray border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Send className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaign?.totalSent || 0}</p>
                    <p className="text-xs text-gray-400">Enviados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaign?.totalFailed || 0}</p>
                    <p className="text-xs text-gray-400">Fallidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tiktok-cyan/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-tiktok-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaign?.activeAccounts || 0}</p>
                    <p className="text-xs text-gray-400">Cuentas Activas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaign?.blockedAccounts || 0}</p>
                    <p className="text-xs text-gray-400">Bloqueadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Panel */}
            <div className="lg:col-span-2">
              <Card className="bg-tiktok-gray border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-tiktok-cyan" />
                    Actividad en Tiempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isRunning ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {logs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <RotateCcw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                          <p>Iniciando workers...</p>
                        </div>
                      )}
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg",
                            log.status === "sent"
                              ? "bg-green-500/10 border border-green-500/20"
                              : "bg-red-500/10 border border-red-500/20"
                          )}
                        >
                          {log.status === "sent" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium text-tiktok-cyan">
                                {log.account}
                              </span>{" "}
                              →{" "}
                              <span className="text-white">{log.lead}</span>
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {log.message}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500">
                        La campaña está detenida. Activa para ver la actividad.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Panel */}
            <div>
              <Card className="bg-tiktok-gray border-white/10">
                <CardHeader>
                  <CardTitle className="text-sm">Configuración Activa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Workers</p>
                    <p className="text-lg font-bold">{settings?.workers || 1}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Browsers por Worker</p>
                    <p className="text-lg font-bold">{settings?.browsersPerWorker || 1}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Delay entre mensajes</p>
                    <p className="text-lg font-bold">
                      {settings?.minDelaySeconds || 30}s - {settings?.maxDelaySeconds || 120}s
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Mensajes por cuenta</p>
                    <p className="text-lg font-bold">{settings?.messagesPerAccount || 50}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Umbral de fallos</p>
                    <p className="text-lg font-bold">{settings?.failureThreshold || 5}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-white/10"
                    onClick={() => window.location.href = "/settings"}
                  >
                    Editar Configuración
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
