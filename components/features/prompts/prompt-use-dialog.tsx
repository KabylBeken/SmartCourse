"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Prompt } from "@/lib/types"

interface PromptUseDialogProps {
  open: boolean
  prompt: Prompt | null
  onOpenChange: (open: boolean) => void
  onConfirm: (values: Record<string, string>) => void
}

export function PromptUseDialog({ open, prompt, onOpenChange, onConfirm }: PromptUseDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  const variables = useMemo(() => {
    if (!prompt) return [] as string[]
    const regex = /\{\{(\w+)\}\}/g
    const matches = (prompt.prompt_text || "").matchAll(regex)
    return [...new Set([...matches].map((m) => m[1]))]
  }, [prompt])

  useEffect(() => {
    if (!open) return
    setValues({})
  }, [open, prompt])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fill variables</DialogTitle>
          <DialogDescription>Provide values for variables to compile this prompt.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {variables.length === 0 && <p className="text-sm text-muted-foreground">No variables detected.</p>}
          {variables.map((v) => (
            <div key={v} className="space-y-1">
              <Label htmlFor={`var-${v}`} className="text-xs font-mono">{`{{${v}}}`}</Label>
              <Input id={`var-${v}`} value={values[v] || ""} onChange={(e) => setValues((prev) => ({ ...prev, [v]: e.target.value }))} />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirm(values); onOpenChange(false) }}>Use</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
