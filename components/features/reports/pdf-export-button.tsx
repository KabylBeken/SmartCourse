"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getApiBaseUrl } from "@/lib/auth/api-client"

interface PdfExportButtonProps {
  /** Относительный путь, например "/api/teacher/courses/12/report.pdf" */
  endpoint: string
  filename?: string
  label?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
}

export function PdfExportButton({
  endpoint,
  filename = "report.pdf",
  label = "Экспорт PDF",
  variant = "outline",
}: PdfExportButtonProps) {
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setBusy(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ title: "PDF загружен", description: filename })
    } catch (e) {
      toast({
        title: "Ошибка экспорта",
        description: e instanceof Error ? e.message : "unknown",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant={variant} disabled={busy} onClick={handleClick}>
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  )
}
