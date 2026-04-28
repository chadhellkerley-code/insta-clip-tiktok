"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Play,
  Globe,
  Lock,
  Shield,
} from "lucide-react"
import { agentFetch } from "@/lib/local-agent"

interface Account {
  id: string
  username: string
  email: string | null
  password: string
  twoFaCode: string | null
  proxyIp: string | null
  proxyPort: string | null
  proxyUser: string | null
  proxyPass: string | null
  status: string
  lastLoginAt: string | null
  createdAt: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    twoFaCode: "",
    proxyIp: "",
    proxyPort: "",
    proxyUser: "",
    proxyPass: "",
  })

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await agentFetch<Account[]>("/api/accounts")
      setAccounts(data)
    } catch (error) {
      console.error("Error fetching accounts:", error)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await agentFetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify(formData),
      })
      setFormData({
        username: "",
        email: "",
        password: "",
        twoFaCode: "",
        proxyIp: "",
        proxyPort: "",
        proxyUser: "",
        proxyPass: "",
      })
      setOpenDialog(false)
      fetchAccounts()
    } catch (error) {
      console.error("Error creating account:", error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta?")) return
    try {
      await agentFetch(`/api/accounts/${id}`, { method: "DELETE" })
      fetchAccounts()
    } catch (error) {
      console.error("Error deleting account:", error)
    }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    for (const line of lines) {
      const [username, password, twoFaCode, proxyIp, proxyPort, proxyUser, proxyPass] =
        line.split(",").map((s) => s.trim())

      await agentFetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          twoFaCode: twoFaCode || null,
          proxyIp: proxyIp || null,
          proxyPort: proxyPort || null,
          proxyUser: proxyUser || null,
          proxyPass: proxyPass || null,
        }),
      })
    }
    fetchAccounts()
  }

  const toggleSelection = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleStartSelected = async () => {
    for (const accountId of selectedAccounts) {
      const account = accounts.find((a) => a.id === accountId)
      if (!account) continue

      // Llamar al agente local para iniciar sesión
      try {
        await agentFetch("/api/login", {
          method: "POST",
          body: JSON.stringify({
            accountId: account.id,
            username: account.username,
            password: account.password,
            twoFaCode: account.twoFaCode,
            proxy: account.proxyIp
              ? {
                  ip: account.proxyIp,
                  port: account.proxyPort,
                  username: account.proxyUser,
                  password: account.proxyPass,
                }
              : null,
          }),
        })
      } catch (error) {
        console.error(`Error starting account ${account.username}:`, error)
      }
    }
    setSelectedAccounts([])
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Activa</Badge>
      case "blocked":
        return <Badge variant="destructive">Bloqueada</Badge>
      case "error":
        return <Badge variant="warning">Error</Badge>
      default:
        return <Badge variant="secondary">Inactiva</Badge>
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
                Cuentas TikTok
              </h1>
              <p className="text-gray-400">Gestiona tus cuentas de TikTok</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button variant="tiktok" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar Cuenta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-tiktok-gray border-white/10 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Nueva Cuenta TikTok</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Usuario / Email</Label>
                        <Input
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                          }
                          placeholder="@usuario o email"
                          className="bg-white/5 border-white/10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email (opcional)</Label>
                        <Input
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="email@ejemplo.com"
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contraseña</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        className="bg-white/5 border-white/10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>2FA (opcional)</Label>
                      <Input
                        value={formData.twoFaCode}
                        onChange={(e) =>
                          setFormData({ ...formData, twoFaCode: e.target.value })
                        }
                        placeholder="Código 2FA"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Proxy (opcional)
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={formData.proxyIp}
                          onChange={(e) =>
                            setFormData({ ...formData, proxyIp: e.target.value })
                          }
                          placeholder="IP Proxy"
                          className="bg-white/5 border-white/10"
                        />
                        <Input
                          value={formData.proxyPort}
                          onChange={(e) =>
                            setFormData({ ...formData, proxyPort: e.target.value })
                          }
                          placeholder="Puerto"
                          className="bg-white/5 border-white/10"
                        />
                        <Input
                          value={formData.proxyUser}
                          onChange={(e) =>
                            setFormData({ ...formData, proxyUser: e.target.value })
                          }
                          placeholder="Usuario Proxy"
                          className="bg-white/5 border-white/10"
                        />
                        <Input
                          type="password"
                          value={formData.proxyPass}
                          onChange={(e) =>
                            setFormData({ ...formData, proxyPass: e.target.value })
                          }
                          placeholder="Pass Proxy"
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="tiktok"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Guardando..." : "Guardar Cuenta"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="gap-2 border-white/10">
                  <Upload className="w-4 h-4" />
                  Importar CSV
                </Button>
              </div>
            </div>
          </div>

          {selectedAccounts.length > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {selectedAccounts.length} seleccionadas
              </span>
              <Button
                variant="tiktokCyan"
                size="sm"
                onClick={handleStartSelected}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Iniciar Seleccionadas
              </Button>
            </div>
          )}

          <div className="bg-tiktok-gray border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-left">
                    <Checkbox
                      checked={
                        selectedAccounts.length === accounts.length && accounts.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAccounts(accounts.map((a) => a.id))
                        } else {
                          setSelectedAccounts([])
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Usuario</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Proxy</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">2FA</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Estado</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Último Login</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedAccounts.includes(account.id)}
                        onCheckedChange={() => toggleSelection(account.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tiktok-cyan to-tiktok-red flex items-center justify-center text-xs font-bold">
                          {account.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{account.username}</p>
                          {account.email && (
                            <p className="text-xs text-gray-500">{account.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {account.proxyIp ? (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-tiktok-cyan" />
                          <span className="text-sm">
                            {account.proxyIp}:{account.proxyPort}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sin proxy</span>
                      )}
                    </td>
                    <td className="p-4">
                      {account.twoFaCode ? (
                        <Shield className="w-4 h-4 text-green-400" />
                      ) : (
                        <span className="text-sm text-gray-500">No</span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(account.status)}</td>
                    <td className="p-4 text-sm text-gray-400">
                      {account.lastLoginAt
                        ? new Date(account.lastLoginAt).toLocaleDateString("es-ES")
                        : "Nunca"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            // Abrir cuenta individual
                            void agentFetch("/api/login", {
                              method: "POST",
                              body: JSON.stringify({
                                accountId: account.id,
                                username: account.username,
                                password: account.password,
                                twoFaCode: account.twoFaCode,
                                proxy: account.proxyIp
                                  ? {
                                      ip: account.proxyIp,
                                      port: account.proxyPort,
                                      username: account.proxyUser,
                                      password: account.proxyPass,
                                    }
                                  : null,
                              }),
                            })
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(account.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No hay cuentas registradas. Agrega tu primera cuenta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
