"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Settings,
  Save,
  Users,
  Globe,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { agentFetch } from "@/lib/local-agent"

interface CampaignSetting {
  id?: string
  workers: number
  browsersPerWorker: number
  minDelaySeconds: number
  maxDelaySeconds: number
  messagesPerAccount: number
  failureThreshold: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CampaignSetting>({
    workers: 1,
    browsersPerWorker: 1,
    minDelaySeconds: 30,
    maxDelaySeconds: 120,
    messagesPerAccount: 50,
    failureThreshold: 5,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const data = await agentFetch<CampaignSetting>("/api/settings")
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setLoading(true)
    try {
      await agentFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
    }
    setLoading(false)
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tiktok-gradient mb-2">
                Configuración
              </h1>
              <p className="text-gray-400">
                Configura los parámetros de envío de mensajes
              </p>
            </div>
            <Button
              variant="tiktok"
              className="gap-2"
              onClick={handleSave}
              disabled={loading}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Guardado
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {loading ? "Guardando..." : "Guardar"}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Workers */}
            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-tiktok-cyan" />
                  Workers y Browsers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Workers en simultáneo</Label>
                    <Badge variant="tiktok">{settings.workers}</Badge>
                  </div>
                  <Slider
                    value={[settings.workers]}
                    onValueChange={([v]) => setSettings({ ...settings, workers: v })}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Cantidad de workers que procesarán cuentas en paralelo
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Browsers por Worker</Label>
                    <Badge variant="tiktok">{settings.browsersPerWorker}</Badge>
                  </div>
                  <Slider
                    value={[settings.browsersPerWorker]}
                    onValueChange={([v]) =>
                      setSettings({ ...settings, browsersPerWorker: v })
                    }
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Cantidad de browsers que cada worker abrirá
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Delays */}
            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-tiktok-red" />
                  Tiempos de Espera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block">Delay mínimo (segundos)</Label>
                    <Input
                      type="number"
                      value={settings.minDelaySeconds}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          minDelaySeconds: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-white/5 border-white/10"
                      min={5}
                      max={300}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Delay máximo (segundos)</Label>
                    <Input
                      type="number"
                      value={settings.maxDelaySeconds}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maxDelaySeconds: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-white/5 border-white/10"
                      min={10}
                      max={600}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  El delay entre mensajes será aleatorio entre estos valores para simular comportamiento humano
                </p>
              </CardContent>
            </Card>

            {/* Limits */}
            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  Límites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Mensajes por cuenta</Label>
                    <Badge variant="success">{settings.messagesPerAccount}</Badge>
                  </div>
                  <Slider
                    value={[settings.messagesPerAccount]}
                    onValueChange={([v]) =>
                      setSettings({ ...settings, messagesPerAccount: v })
                    }
                    min={10}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Máximo de mensajes que cada cuenta enviará antes de rotar
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Umbral de fallos</Label>
                    <Badge variant="warning">{settings.failureThreshold}</Badge>
                  </div>
                  <Slider
                    value={[settings.failureThreshold]}
                    onValueChange={([v]) =>
                      setSettings({ ...settings, failureThreshold: v })
                    }
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Cantidad de fallos consecutivos antes de marcar una cuenta como bloqueada
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <div className="p-4 bg-tiktok-cyan/10 border border-tiktok-cyan/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-tiktok-cyan mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-tiktok-cyan">Importante</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Estos ajustes afectan directamente el comportamiento del agente local.
                    Asegúrate de que el agente esté corriendo para que los cambios surtan efecto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
