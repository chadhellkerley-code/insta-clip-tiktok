"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Plus,
  Trash2,
  GripVertical,
  MessageSquare,
  ArrowUpDown,
} from "lucide-react"

interface Message {
  id: string
  content: string
  order: number
  active: boolean
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({ content: "" })

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages")
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      setFormData({ content: "" })
      setOpenDialog(false)
      fetchMessages()
    } catch (error) {
      console.error("Error creating message:", error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este mensaje?")) return
    try {
      await fetch(`/api/messages/${id}`, { method: "DELETE" })
      fetchMessages()
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      })
      fetchMessages()
    } catch (error) {
      console.error("Error updating message:", error)
    }
  }

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = messages.findIndex((m) => m.id === id)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === messages.length - 1) return

    const newOrder = direction === "up" ? index - 1 : index + 1
    const targetMessage = messages[newOrder]

    try {
      await fetch(`/api/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: targetMessage.order }),
      })
      await fetch(`/api/messages/${targetMessage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: messages[index].order }),
      })
      fetchMessages()
    } catch (error) {
      console.error("Error reordering:", error)
    }
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tiktok-gradient mb-2">
                Mensajes
              </h1>
              <p className="text-gray-400">
                Configura los mensajes que se enviarán a los leads
              </p>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button variant="tiktok" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar Mensaje
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-tiktok-gray border-white/10 text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl">Nuevo Mensaje</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Contenido del mensaje</Label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Escribe el mensaje aquí..."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tiktok-cyan"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Los mensajes se rotarán automáticamente entre los leads
                    </p>
                  </div>
                  <Button
                    type="submit"
                    variant="tiktok"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Guardar Mensaje"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {messages.map((message, index) => (
              <Card
                key={message.id}
                className={cn(
                  "bg-tiktok-gray border-white/10 transition-all",
                  !message.active && "opacity-50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 pt-2">
                      <span className="text-xs font-bold text-tiktok-cyan">
                        #{message.order + 1}
                      </span>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleReorder(message.id, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUpDown className="w-3 h-3 rotate-180" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleReorder(message.id, "down")}
                          disabled={index === messages.length - 1}
                        >
                          <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={message.active}
                          onCheckedChange={() =>
                            handleToggleActive(message.id, message.active)
                          }
                        />
                        <span className="text-xs text-gray-400">
                          {message.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(message.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-12 bg-tiktok-gray border border-white/10 rounded-lg">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">
                  No hay mensajes configurados. Agrega tu primer mensaje.
                </p>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="mt-6 p-4 bg-tiktok-cyan/10 border border-tiktok-cyan/20 rounded-lg">
              <p className="text-sm text-tiktok-cyan">
                <strong>Rotación:</strong> Los mensajes se enviarán en orden rotativo.
                Cada lead recibirá el siguiente mensaje en la lista.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
