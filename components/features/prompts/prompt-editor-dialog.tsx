"use client"

import { useState, useEffect, useMemo } from "react"
import { Brain, Sparkles, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import type { Prompt, CreatePromptRequest } from "@/lib/types"

interface PromptEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt?: Prompt | null
  onSave: (data: CreatePromptRequest) => Promise<void>
}

const categories = [
  { value: "essay", label: "Essay" },
  { value: "quiz", label: "Quiz" },
  { value: "project", label: "Project" },
  { value: "discussion", label: "Discussion" },
  { value: "coding", label: "Coding" },
  { value: "research", label: "Research" },
]

export function PromptEditorDialog({ open, onOpenChange, prompt, onSave }: PromptEditorDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [promptText, setPromptText] = useState("")
  const [category, setCategory] = useState("essay")
  const [isPublic, setIsPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({})
  const [tags, setTags] = useState<string[]>([])
  const [collection, setCollection] = useState<string>("")
  const [isImproving, setIsImproving] = useState(false)

  // Extract variables from prompt text
  const variables = useMemo(() => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = promptText.matchAll(regex)
    return [...new Set([...matches].map((m) => m[1]))]
  }, [promptText])

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title)
      setDescription(prompt.description || "")
      setPromptText(prompt.prompt_text)
      setCategory(prompt.category)
      setIsPublic(prompt.is_public)
      setTags(prompt.tags || [])
      setCollection(prompt.collection || "")
    } else {
      setTitle("")
      setDescription("")
      setPromptText("")
      setCategory("essay")
      setIsPublic(false)
      setTags([])
      setCollection("")
    }
    setSampleValues({})
  }, [prompt, open])

  // Generate preview text
  const previewText = useMemo(() => {
    let text = promptText
    variables.forEach((variable) => {
      const value = sampleValues[variable] || `[${variable}]`
      text = text.replace(new RegExp(`\\{\\{${variable}\\}\\}`, "g"), value)
    })
    return text
  }, [promptText, variables, sampleValues])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        title,
        description: description || undefined,
        prompt_text: promptText,
        category,
        is_public: isPublic,
        tags: tags.length ? tags : undefined,
        collection: collection || undefined,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = title.length >= 3 && title.length <= 100 && promptText.length >= 20

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--ai-accent)]" />
            {prompt ? "Edit Prompt" : "Create New Prompt"}
          </DialogTitle>
          <DialogDescription>
            Create an AI prompt template with variable support for generating assignments.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="edit" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">
              <Sparkles className="mr-2 h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="max-h-[50vh] space-y-4 overflow-y-auto pr-2 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Essay Topic Generator"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
              </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags.join(", ")}
                  onChange={(e) =>
                    setTags(
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="e.g., grade7, critical-thinking"
                />
                <p className="text-xs text-muted-foreground">Через запятую. Будет сохранено как список.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <Input
                  id="collection"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  placeholder="e.g., Semester 1"
                  maxLength={100}
                />
              </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this prompt does"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptText">
                Prompt Text *
                <span className="ml-2 text-xs text-muted-foreground">Use {"{{variable}}"} for dynamic content</span>
              </Label>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isImproving || promptText.length < 20}
                  onClick={async () => {
                    setIsImproving(true)
                    try {
                      const res = await fetch("/api/ai/prompt-improve", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title, description, prompt_text: promptText }),
                      })
                      const data = (await res.json().catch(() => ({}))) as { content?: string }
                      if (res.ok && typeof data.content === "string" && data.content.trim()) {
                        setPromptText(data.content.trim())
                      }
                    } finally {
                      setIsImproving(false)
                    }
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" /> {isImproving ? "Improving..." : "Improve with AI"}
                </Button>
              </div>
              <Textarea
                id="promptText"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Generate a {{topic}} essay question for {{grade_level}} students that focuses on {{skill}}..."
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{promptText.length} characters (min 20)</p>
            </div>

            {variables.length > 0 && (
              <div className="space-y-2">
                <Label>Detected Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {variables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="font-mono">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="public" className="font-medium">
                  Make Public
                </Label>
                <p className="text-sm text-muted-foreground">Allow other teachers to use this prompt</p>
              </div>
              <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="max-h-[50vh] space-y-4 overflow-y-auto pr-2 mt-4">
            {variables.length > 0 && (
              <Card className="p-4">
                <Label className="mb-3 block">Sample Variable Values</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {variables.map((variable) => (
                    <div key={variable} className="space-y-1">
                      <Label htmlFor={variable} className="text-xs font-mono text-muted-foreground">
                        {variable}
                      </Label>
                      <Input
                        id={variable}
                        value={sampleValues[variable] || ""}
                        onChange={(e) => setSampleValues((prev) => ({ ...prev, [variable]: e.target.value }))}
                        placeholder={`Enter ${variable}...`}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <Label className="mb-3 block">Generated Prompt Preview</Label>
              <div className="rounded-md bg-muted/50 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {previewText || <span className="text-muted-foreground">Enter prompt text to see preview...</span>}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? "Saving..." : prompt ? "Save Changes" : "Create Prompt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
