"use client"

import { useState } from "react"
import { Brain, Save, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { SubmissionViewer } from "./submission-viewer"
import { CriterionEvaluator } from "./criterion-evaluator"
import type { Submission, Student, GradingCriteria, SubmissionEvaluation } from "@/lib/types"

interface EvaluationPanelProps {
  submission: Submission
  student: Student
  criteria: GradingCriteria[]
  evaluations: SubmissionEvaluation[]
  isLoading?: boolean
  isAutoEvaluating?: boolean
  onAutoEvaluate: () => Promise<void>
  onManualEvaluate: (criteriaId: number, score: number, feedback: string) => void
  onSaveDraft: () => Promise<void>
  onPublish: () => Promise<void>
}

export function EvaluationPanel({
  submission,
  student,
  criteria,
  evaluations,
  isLoading,
  isAutoEvaluating,
  onAutoEvaluate,
  onManualEvaluate,
  onSaveDraft,
  onPublish,
}: EvaluationPanelProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Calculate total score
  const totalMaxScore = criteria.reduce((sum, c) => sum + c.max_score * c.weight, 0)
  const totalScore = evaluations.reduce((sum, e) => {
    const criterion = criteria.find((c) => c.id === e.criteria_id)
    return sum + e.score * (criterion?.weight || 1)
  }, 0)
  const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0
  const grade = percentage >= 90 ? "A" : percentage >= 80 ? "B" : percentage >= 70 ? "C" : percentage >= 60 ? "D" : "F"

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      await onSaveDraft()
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await onPublish()
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid h-[calc(100vh-200px)] gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Skeleton className="h-full" />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-20" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col gap-4">
      <div className="grid flex-1 gap-6 lg:grid-cols-5">
        {/* Left Panel - Submission */}
        <div className="lg:col-span-3">
          <SubmissionViewer submission={submission} student={student} />
        </div>

        {/* Right Panel - Evaluation */}
        <div className="flex flex-col lg:col-span-2">
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{percentage.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {grade}
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full gap-2 bg-transparent"
              onClick={onAutoEvaluate}
              disabled={isAutoEvaluating}
            >
              {isAutoEvaluating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 text-[var(--ai-accent)]" />
              )}
              {isAutoEvaluating ? "Running AI Evaluation..." : "Run AI Evaluation"}
            </Button>
          </Card>

          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {criteria.map((criterion) => {
                const evaluation = evaluations.find((e) => e.criteria_id === criterion.id)
                return (
                  <CriterionEvaluator
                    key={criterion.id}
                    criterion={criterion}
                    evaluation={evaluation}
                    onEvaluate={(score, feedback) => onManualEvaluate(criterion.id, score, feedback)}
                  />
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Bottom Bar */}
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Score</div>
            <div className="text-2xl font-bold">
              {totalScore.toFixed(1)} / {totalMaxScore.toFixed(1)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving} className="gap-2 bg-transparent">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing} className="gap-2">
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish Feedback
          </Button>
        </div>
      </Card>
    </div>
  )
}
