"use client"

import { useState } from "react"
import { Plus, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CriterionCard } from "./criterion-card"
import { WeightVisualizer } from "./weight-visualizer"
import type { GradingCriteria, Assignment } from "@/lib/types"

interface CriteriaBuilderProps {
  assignment: Assignment
  criteria: GradingCriteria[]
  isLoading?: boolean
  onAddCriterion: () => void
  onUpdateCriterion: (id: number, data: Partial<GradingCriteria>) => void
  onDeleteCriterion: (id: number) => void
  onReorderCriteria: (ids: number[]) => void
  onSave: () => Promise<void>
  onTestAICriterion?: (criterion: GradingCriteria) => void
}

export function CriteriaBuilder({
  assignment,
  criteria,
  isLoading,
  onAddCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
  onSave,
  onTestAICriterion,
}: CriteriaBuilderProps) {
  const [isSaving, setIsSaving] = useState(false)

  const totalPoints = criteria.reduce((sum, c) => sum + c.max_score, 0)
  const aiCriteriaCount = criteria.filter((c) => c.auto_checkable).length
  const invalidCriteria = criteria.filter((c) => c.auto_checkable && !c.check_prompt)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
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
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">
            {criteria.length} criteria | {totalPoints} total points | {aiCriteriaCount} AI-checked
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onAddCriterion} className="gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            Add Criterion
          </Button>
          <Button onClick={handleSave} disabled={isSaving || invalidCriteria.length > 0} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {invalidCriteria.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {invalidCriteria.length} criterion has AI checking enabled but no check prompt defined.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {criteria.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <p className="mb-4 text-muted-foreground">No criteria defined yet.</p>
              <Button onClick={onAddCriterion} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Criterion
              </Button>
            </Card>
          ) : (
            criteria.map((criterion) => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                onUpdate={(data) => onUpdateCriterion(criterion.id, data)}
                onDelete={() => onDeleteCriterion(criterion.id)}
                onTestAI={onTestAICriterion ? () => onTestAICriterion(criterion) : undefined}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <WeightVisualizer criteria={criteria} />
        </div>
      </div>
    </div>
  )
}
