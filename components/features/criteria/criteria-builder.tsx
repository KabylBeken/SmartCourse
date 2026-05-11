"use client"

import { useState } from "react"
import { Plus, Save, AlertTriangle, Sparkles, LayoutTemplate, Eye, FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CriterionCard } from "./criterion-card"
import { WeightVisualizer } from "./weight-visualizer"
import { RubricPreviewDialog } from "./rubric-preview-dialog"
import { CriteriaTemplatesDialog } from "./criteria-templates-dialog"
import type { GradingCriteria } from "@/lib/types"
import type { Assignment } from "@/lib/api/assignments"

interface CriteriaBuilderProps {
  assignment: Assignment
  criteria: GradingCriteria[]
  isLoading?: boolean
  onAddCriterion: () => void
  onUpdateCriterion: (id: number, data: Partial<GradingCriteria>) => void
  onDeleteCriterion: (id: number) => void
  onDuplicateCriterion: (id: number) => void
  onReorderCriteria: (ids: number[]) => void
  onSave: () => Promise<void>
  onTestAICriterion?: (criterion: GradingCriteria) => void
  onApplyTemplate: (templateCriteria: Omit<GradingCriteria, "id" | "assignment_id" | "order_index">[]) => void
  onAIGenerateCriteria: () => Promise<void>
}

export function CriteriaBuilder({
  assignment,
  criteria,
  isLoading,
  onAddCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
  onDuplicateCriterion,
  onSave,
  onTestAICriterion,
  onApplyTemplate,
  onAIGenerateCriteria,
}: CriteriaBuilderProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const totalPoints = criteria.reduce((sum, c) => sum + c.max_score, 0)
  const aiCriteriaCount = criteria.filter((c) => c.auto_checkable).length
  const requiredCount = criteria.filter((c) => c.required).length
  const invalidCriteria = criteria.filter((c) => c.auto_checkable && !c.check_prompt)

  const handleSave = async () => {
    setIsSaving(true)
    try { await onSave() } finally { setIsSaving(false) }
  }

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    try { await onAIGenerateCriteria() } finally { setIsGenerating(false) }
  }

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(criteria, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `criteria-${assignment.title.replace(/\s+/g, "-").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Badge variant="secondary">{criteria.length} criteria</Badge>
            <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">{totalPoints} pts</Badge>
            {aiCriteriaCount > 0 && (
              <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200">
                {aiCriteriaCount} AI-checked
              </Badge>
            )}
            {requiredCount > 0 && (
              <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">
                {requiredCount} required
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="gap-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Generate
          </Button>

          <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)} className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>

          <Button variant="outline" size="sm" onClick={onAddCriterion} className="gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>

          {criteria.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-2">
                <FileDown className="h-4 w-4" />
                Export
              </Button>
            </>
          )}

          <Button onClick={handleSave} size="sm" disabled={isSaving || invalidCriteria.length > 0} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {invalidCriteria.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {invalidCriteria.length} criterion has AI checking enabled but no evaluation prompt defined.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {criteria.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
              <div className="mb-4 rounded-full bg-muted p-4">
                <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-semibold">No criteria yet</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Add criteria manually, pick a template, or let AI generate them for you.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => setTemplatesOpen(true)} className="gap-2">
                  <LayoutTemplate className="h-4 w-4" /> Templates
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  className="gap-2 text-purple-700"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Generate
                </Button>
                <Button onClick={onAddCriterion} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Manual
                </Button>
              </div>
            </Card>
          ) : (
            criteria.map((criterion) => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                onUpdate={(data) => onUpdateCriterion(criterion.id, data)}
                onDelete={() => onDeleteCriterion(criterion.id)}
                onDuplicate={() => onDuplicateCriterion(criterion.id)}
                onTestAI={onTestAICriterion ? () => onTestAICriterion(criterion) : undefined}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <WeightVisualizer criteria={criteria} />
        </div>
      </div>

      <RubricPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        criteria={criteria}
        assignmentTitle={assignment.title}
      />

      <CriteriaTemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onApply={onApplyTemplate}
        assignmentId={assignment.id}
      />
    </div>
  )
}
