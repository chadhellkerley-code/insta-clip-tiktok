"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Download,
  Calendar,
  TrendingUp,
  MessageSquare,
  Users,
  AlertTriangle,
} from "lucide-react"

interface MetricData {
  date: string
  sent: number
  failed: number
  contacted: number
  rejected: number
}

type TimeRange = "24h" | "7d" | "15d" | "30d"

const timeRanges: { value: TimeRange; label: string; days: number }[] = [
  { value: "24h", label: "Últimas 24h", days: 1 },
  { value: "7d", label: "Últimos 7 días", days: 7 },
  { value: "15d", label: "Últimos 15 días", days: 15 },
  { value: "30d", label: "Últimos 30 días", days: 30 },
]

const COLORS = ["#25F4EE", "#FE2C55", "#4ade80", "#f87171"]

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricData[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>("7d")
  const [loading, setLoading] = useState(false)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const days = timeRanges.find((t) => t.value === timeRange)?.days || 7
      const res = await fetch(`/api/metrics?days=${days}`)
      const data = await res.json()
      setMetrics(data)
    } catch (error) {
      console.error("Error fetching metrics:", error)
    }
    setLoading(false)
  }, [timeRange])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const totals = metrics.reduce(
    (acc, curr) => ({
      sent: acc.sent + curr.sent,
      failed: acc.failed + curr.failed,
      contacted: acc.contacted + curr.contacted,
      rejected: acc.rejected + curr.rejected,
    }),
    { sent: 0, failed: 0, contacted: 0, rejected: 0 }
  )

  const successRate = totals.sent + totals.failed > 0
    ? ((totals.sent / (totals.sent + totals.failed)) * 100).toFixed(1)
    : "0"

  const pieData = [
    { name: "Enviados", value: totals.sent, color: COLORS[0] },
    { name: "Fallidos", value: totals.failed, color: COLORS[1] },
    { name: "Contactados", value: totals.contacted, color: COLORS[2] },
    { name: "Rechazados", value: totals.rejected, color: COLORS[3] },
  ].filter((d) => d.value > 0)

  const handleDownloadCSV = () => {
    const headers = ["Fecha", "Enviados", "Fallidos", "Contactados", "Rechazados"]
    const rows = metrics.map((m) => [m.date, m.sent, m.failed, m.contacted, m.rejected])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `metrics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tiktok-gradient mb-2">
                Métricas
              </h1>
              <p className="text-gray-400">Análisis de rendimiento</p>
            </div>
            <Button
              variant="tiktok"
              className="gap-2"
              onClick={handleDownloadCSV}
            >
              <Download className="w-4 h-4" />
              Descargar CSV
            </Button>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 mb-6">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "tiktok" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range.value)}
                className={cn(
                  "border-white/10",
                  timeRange !== range.value && "text-gray-400"
                )}
              >
                <Calendar className="w-3 h-3 mr-1" />
                {range.label}
              </Button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-tiktok-gray border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tiktok-cyan/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-tiktok-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totals.sent}</p>
                    <p className="text-xs text-gray-400">Enviados</p>
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
                    <p className="text-2xl font-bold">{totals.failed}</p>
                    <p className="text-xs text-gray-400">Fallidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totals.contacted}</p>
                    <p className="text-xs text-gray-400">Contactados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tiktok-gray border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tiktok-red/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-tiktok-red" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{successRate}%</p>
                    <p className="text-xs text-gray-400">Tasa de éxito</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart */}
            <Card className="bg-tiktok-gray border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Actividad por Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="date"
                        stroke="#666"
                        tick={{ fill: "#666", fontSize: 12 }}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                          })
                        }
                      />
                      <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#161823",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="sent" fill="#25F4EE" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" fill="#FE2C55" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="bg-tiktok-gray border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Distribución</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#161823",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-400">{entry.name}</span>
                      </div>
                      <span className="text-sm font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart */}
          <Card className="bg-tiktok-gray border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-base">Tendencia de Contactos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="date"
                      stroke="#666"
                      tick={{ fill: "#666", fontSize: 12 }}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })
                      }
                    />
                    <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161823",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="contacted"
                      stroke="#4ade80"
                      strokeWidth={2}
                      dot={{ fill: "#4ade80" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rejected"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={{ fill: "#f87171" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
