"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  Plus,
  Trash2,
  ExternalLink,
  Filter,
  UserCheck,
  UserX,
  User,
} from "lucide-react"

interface Lead {
  id: string
  tiktokUrl: string
  username: string
  displayName: string | null
  status: string
  accountId: string | null
  notes: string | null
  createdAt: string
  account?: { username: string } | null
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    tiktokUrl: "",
    username: "",
    displayName: "",
    notes: "",
  })

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads")
      const data = await res.json()
      setLeads(data)
    } catch (error) {
      console.error("Error fetching leads:", error)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      setFormData({ tiktokUrl: "", username: "", displayName: "", notes: "" })
      setOpenDialog(false)
      fetchLeads()
    } catch (error) {
      console.error("Error creating lead:", error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este lead?")) return
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" })
      fetchLeads()
    } catch (error) {
      console.error("Error deleting lead:", error)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      fetchLeads()
    } catch (error) {
      console.error("Error updating lead:", error)
    }
  }

  const filteredLeads = leads.filter((lead) => {
    if (filter === "all") return true
    return lead.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "contacted":
        return <Badge variant="cyan">Contactado</Badge>
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>
      default:
        return <Badge variant="success">Libre</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "contacted":
        return <UserCheck className="w-4 h-4 text-tiktok-cyan" />
      case "rejected":
        return <UserX className="w-4 h-4 text-red-400" />
      default:
        return <User className="w-4 h-4 text-green-400" />
    }
  }

  const stats = {
    total: leads.length,
    free: leads.filter((l) => l.status === "free").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    rejected: leads.filter((l) => l.status === "rejected").length,
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tiktok-gradient mb-2">
                Leads
              </h1>
              <p className="text-gray-400">Gestiona tus leads de TikTok</p>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button variant="tiktok" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-tiktok-gray border-white/10 text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl">Nuevo Lead</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>URL de TikTok</Label>
                    <Input
                      value={formData.tiktokUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, tiktokUrl: e.target.value })
                      }
                      placeholder="https://tiktok.com/@usuario"
                      className="bg-white/5 border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="@usuario"
                      className="bg-white/5 border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre Display (opcional)</Label>
                    <Input
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({ ...formData, displayName: e.target.value })
                      }
                      placeholder="Nombre visible"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Notas sobre este lead..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="tiktok"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Guardar Lead"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all",
                filter === "all"
                  ? "bg-white/10 border-tiktok-cyan"
                  : "bg-tiktok-gray border-white/10 hover:bg-white/5"
              )}
              onClick={() => setFilter("all")}
            >
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
            <div
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all",
                filter === "free"
                  ? "bg-green-500/10 border-green-500"
                  : "bg-tiktok-gray border-white/10 hover:bg-white/5"
              )}
              onClick={() => setFilter("free")}
            >
              <p className="text-2xl font-bold text-green-400">{stats.free}</p>
              <p className="text-sm text-gray-400">Libres</p>
            </div>
            <div
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all",
                filter === "contacted"
                  ? "bg-tiktok-cyan/10 border-tiktok-cyan"
                  : "bg-tiktok-gray border-white/10 hover:bg-white/5"
              )}
              onClick={() => setFilter("contacted")}
            >
              <p className="text-2xl font-bold text-tiktok-cyan">{stats.contacted}</p>
              <p className="text-sm text-gray-400">Contactados</p>
            </div>
            <div
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all",
                filter === "rejected"
                  ? "bg-red-500/10 border-red-500"
                  : "bg-tiktok-gray border-white/10 hover:bg-white/5"
              )}
              onClick={() => setFilter("rejected")}
            >
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              <p className="text-sm text-gray-400">Rechazados</p>
            </div>
          </div>

          <div className="bg-tiktok-gray border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Estado</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Usuario</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">URL</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Notas</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Cuenta</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(lead.status)}
                        {getStatusBadge(lead.status)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{lead.username}</p>
                        {lead.displayName && (
                          <p className="text-xs text-gray-500">{lead.displayName}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <a
                        href={lead.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-tiktok-cyan hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver perfil
                      </a>
                    </td>
                    <td className="p-4 text-sm text-gray-400 max-w-xs truncate">
                      {lead.notes || "-"}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {lead.account?.username || "Sin asignar"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={lead.status}
                          onValueChange={(value) => handleStatusChange(lead.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8 bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-tiktok-gray border-white/10">
                            <SelectItem value="free">Libre</SelectItem>
                            <SelectItem value="contacted">Contactado</SelectItem>
                            <SelectItem value="rejected">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(lead.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No hay leads en esta categoría.
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
