"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PromptLibrary } from "@/components/features/prompts/prompt-library"
import { useToast } from "@/components/ui/use-toast"
import type { Prompt, CreatePromptRequest, UpdatePromptRequest } from "@/lib/types"
import {
  listPrompts,
  createPrompt as apiCreatePrompt,
  updatePrompt as apiUpdatePrompt,
  deletePrompt as apiDeletePrompt,
  clonePrompt as apiClonePrompt,
  toggleFavorite as apiToggleFavorite,
  incrementUseCount,
} from "@/lib/api/prompts"

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    ;(async () => {
      try {
        const data = await listPrompts({ visibility: "all" })
        setPrompts(data)
      } catch (e) {
        console.error(e)
        toast({ title: "Failed to load prompts", description: String(e), variant: "destructive" })
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  const handleCreatePrompt = async (data: CreatePromptRequest) => {
    const created = await apiCreatePrompt(data)
    setPrompts((prev) => [created, ...prev])
    toast({ title: "Prompt created", description: created.title })
  }

  const handleUpdatePrompt = async (id: number, data: UpdatePromptRequest) => {
    const updated = await apiUpdatePrompt(id, data)
    setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    toast({ title: "Prompt updated", description: updated.title })
  }

  const handleDeletePrompt = async (id: number) => {
    await apiDeletePrompt(id)
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    toast({ title: "Prompt deleted" })
  }

  const handleClonePrompt = async (prompt: Prompt) => {
    const cloned = await apiClonePrompt(prompt.id)
    setPrompts((prev) => [cloned, ...prev])
    toast({ title: "Cloned", description: cloned.title })
  }

  const handleToggleFavorite = async (prompt: Prompt) => {
    const next = !prompt.is_favorite
    await apiToggleFavorite(prompt.id, next)
    setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? { ...p, is_favorite: next } : p)))
  }

  const handleUsePrompt = async (prompt: Prompt, variables?: Record<string, string>) => {
    const compiled = await incrementUseCount(prompt.id, variables || {})
    toast({ title: "Prompt ready", description: compiled.compiled || prompt.title })
  }

  return (
    <DashboardLayout userRole="teacher">
      <PromptLibrary
        prompts={prompts}
        isLoading={loading}
        onCreatePrompt={handleCreatePrompt}
        onUpdatePrompt={handleUpdatePrompt}
        onDeletePrompt={handleDeletePrompt}
        onUsePrompt={handleUsePrompt}
        onClonePrompt={handleClonePrompt}
        onToggleFavorite={handleToggleFavorite}
      />
    </DashboardLayout>
  )
}
