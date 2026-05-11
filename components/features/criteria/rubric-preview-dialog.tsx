"use client"

import { Brain, Copy, Check, Download } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import type { GradingCriteria } from "@/lib/types"

interface RubricPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  criteria: GradingCriteria[]
  assignmentTitle?: string
}

const difficultyColor: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200",
}

export function RubricPreviewDialog({
  open,
  onOpenChange,
  criteria,
  assignmentTitle,
}: RubricPreviewDialogProps) {
  const [copied, setCopied] = useState(false)
  const totalPoints = criteria.reduce((s, c) => s + c.max_score, 0)
  const aiCount = criteria.filter((c) => c.auto_checkable).length

  const handleCopyMarkdown = async () => {
    const header = `# Grading Rubric: ${assignmentTitle || "Assignment"}\n\nTotal Points: **${totalPoints}** | AI-Checked: **${aiCount}/${criteria.length}**\n\n| # | Criterion | Description | Points | Weight | AI |\n|---|-----------|-------------|--------|--------|----|\n`
    const rows = criteria
      .map(
        (c, i) =>
          `| ${i + 1} | **${c.name}** | ${c.description || "-"} | ${c.max_score} | ${c.weight}x | ${c.auto_checkable ? "✅" : "-"} |`,
      )
      .join("\n")
    await navigator.clipboard.writeText(header + rows)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(criteria, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rubric-${(assignmentTitle || "criteria").toLowerCase().replace(/\s+/g, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Rubric Preview</DialogTitle>
          <DialogDescription>
            {assignmentTitle && <span className="font-medium text-foreground">{assignmentTitle} · </span>}
            {totalPoints} total pts · {criteria.length} criteria · {aiCount} AI-checked
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {criteria.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No criteria to preview.</p>
          ) : (
            criteria.map((c, index) => {
              const pct = totalPoints > 0 ? (c.max_score / totalPoints) * 100 : 0
              return (
                <div
                  key={c.id}
                  className="rounded-xl border bg-card p-4 space-y-2 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{c.name}</p>
                          {c.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          {c.difficulty && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${difficultyColor[c.difficulty] || ""}`}
                            >
                              {c.difficulty}
                            </Badge>
                          )}
                          {c.auto_checkable && (
                            <Badge variant="secondary" className="gap-1 text-xs text-purple-600 bg-purple-100 border-purple-200">
                              <Brain className="h-3 w-3" /> AI
                            </Badge>
                          )}
                        </div>
                        {c.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-primary">{c.max_score}</p>
                      <p className="text-xs text-muted-foreground">pts · {c.weight}x</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-3 border-t flex items-center justify-between">
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalPoints} pts total</span>
            <span>{aiCount} AI-auto</span>
            <span>{criteria.filter((c) => c.required).length} required</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleExportJSON} className="gap-2">
            <Download className="h-4 w-4" /> Export JSON
          </Button>
          <Button variant="outline" onClick={handleCopyMarkdown} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Markdown"}
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
