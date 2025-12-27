"use client"

import { useState, useMemo } from "react"
import { Plus, Brain, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PromptCard } from "./prompt-card"
import { PromptFilters } from "./prompt-filters"
import { PromptEditorDialog } from "./prompt-editor-dialog"
import type { Prompt, CreatePromptRequest } from "@/lib/types"

interface PromptLibraryProps {
  prompts: Prompt[]
  isLoading?: boolean
  onCreatePrompt: (data: CreatePromptRequest) => Promise<void>
  onUpdatePrompt: (id: number, data: CreatePromptRequest) => Promise<void>
  onDeletePrompt: (id: number) => Promise<void>
  onUsePrompt: (prompt: Prompt) => void
}

export function PromptLibrary({
  prompts,
  isLoading,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onUsePrompt,
}: PromptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [visibility, setVisibility] = useState<"all" | "mine" | "public">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const matchesSearch =
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = category === "all" || prompt.category === category
      const matchesVisibility =
        visibility === "all" ||
        (visibility === "public" && prompt.is_public) ||
        (visibility === "mine" && !prompt.is_public)
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
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Prompt
        </Button>
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
              onDelete={() => onDeletePrompt(prompt.id)}
              onUse={onUsePrompt}
            />
          ))}
        </div>
      )}

      <PromptEditorDialog open={dialogOpen} onOpenChange={setDialogOpen} prompt={editingPrompt} onSave={handleSave} />
    </div>
  )
}
