"use client"

import { useState, useMemo } from "react"
import { Plus, Brain, FileQuestion, Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PromptCard } from "./prompt-card"
import { PromptFilters } from "./prompt-filters"
import { PromptEditorDialog } from "./prompt-editor-dialog"
import { PromptUseDialog } from "./prompt-use-dialog"
import type { Prompt, CreatePromptRequest, UpdatePromptRequest } from "@/lib/types"
import { exportPrompts, importPrompts, listPrompts } from "@/lib/api/prompts"
import { useRef } from "react"

interface PromptLibraryProps {
  prompts: Prompt[]
  isLoading?: boolean
  onCreatePrompt: (data: CreatePromptRequest) => Promise<void>
  onUpdatePrompt: (id: number, data: UpdatePromptRequest) => Promise<void>
  onDeletePrompt: (id: number) => Promise<void>
  onUsePrompt: (prompt: Prompt, variables?: Record<string, string>) => void
  onClonePrompt?: (prompt: Prompt) => void
  onToggleFavorite?: (prompt: Prompt) => void
}

export function PromptLibrary({
  prompts,
  isLoading,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onUsePrompt,
  onClonePrompt,
  onToggleFavorite,
}: PromptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [visibility, setVisibility] = useState<"all" | "mine" | "public" | "favorites" | "templates">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [useOpen, setUseOpen] = useState(false)
  const [usingPrompt, setUsingPrompt] = useState<Prompt | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleExport = async () => {
    try {
      const items = await exportPrompts()
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `prompts-export-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Export failed")
    }
  }

  const onImportFilePicked = async (file?: File | null) => {
    if (!file) return
    try {
      const text = await file.text()
      const arr = JSON.parse(text) as any[]
      const items: CreatePromptRequest[] = arr.map((p) => ({
        title: p.title || p.name || "Untitled",
        description: p.description || undefined,
        prompt_text: p.prompt_text || p.content || "",
        category: p.category || "essay",
        is_public: !!p.is_public,
        tags: Array.isArray(p.tags) ? p.tags : undefined,
        collection: p.collection || undefined,
        is_template: !!p.is_template,
      }))
      const res = await importPrompts(items)
      // опционально перезагрузим список
      // const refreshed = await listPrompts({ visibility: "all" })
      // setPrompts(refreshed)
      alert(`Imported ${res.created} prompts`)
    } catch (e) {
      console.error(e)
      alert("Import failed: invalid JSON")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        prompt.title.toLowerCase().includes(q) ||
        (prompt.description?.toLowerCase() || "").includes(q)
      const matchesCategory = category === "all" || prompt.category === category
      const matchesVisibility =
        visibility === "all" ||
        (visibility === "public" && prompt.is_public) ||
        (visibility === "mine" && !prompt.is_public) ||
        (visibility === "favorites" && !!prompt.is_favorite) ||
        (visibility === "templates" && !!prompt.is_template)
      return matchesSearch && matchesCategory && matchesVisibility
    })
  }, [prompts, searchQuery, category, visibility])

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingPrompt(null)
    setDialogOpen(true)
  }

  const handleSave = async (data: CreatePromptRequest) => {
    if (editingPrompt) {
      await onUpdatePrompt(editingPrompt.id, data)
    } else {
      await onCreatePrompt(data)
    }
  }

  const requestUse = (prompt: Prompt) => {
    // detect variables and open modal if any
    const vars = (prompt.variables && prompt.variables.length)
      ? prompt.variables
      : Array.from((prompt.prompt_text || "").matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1])
    if (vars.length > 0) {
      setUsingPrompt(prompt)
      setUseOpen(true)
    } else {
      onUsePrompt(prompt)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="mt-4 h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/4" />
              <Skeleton className="mt-3 h-12 w-full" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prompt Library</h1>
          <p className="text-muted-foreground">Create and manage AI prompts for generating assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFilePicked(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Prompt
          </Button>
        </div>
      </div>

      <PromptFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        visibility={visibility}
        onVisibilityChange={setVisibility}
      />

      {filteredPrompts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No prompts found</h3>
          <p className="mb-6 max-w-sm text-muted-foreground">
            {prompts.length === 0
              ? "Get started by creating your first AI prompt template."
              : "Try adjusting your filters or search query."}
          </p>
          {prompts.length === 0 && (
            <Button onClick={handleCreate} className="gap-2">
              <Brain className="h-4 w-4" />
              Create Your First Prompt
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={handleEdit}
              onDelete={(p) => onDeletePrompt(p.id)}
              onUse={requestUse}
              onClone={onClonePrompt}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

      <PromptEditorDialog open={dialogOpen} onOpenChange={setDialogOpen} prompt={editingPrompt} onSave={handleSave} />
      <PromptUseDialog
        open={useOpen}
        prompt={usingPrompt}
        onOpenChange={setUseOpen}
        onConfirm={(values) => { if (usingPrompt) onUsePrompt(usingPrompt, values); }}
      />
    </div>
  )
}
