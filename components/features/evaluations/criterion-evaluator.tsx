"use client"

import { useState } from "react"
import { Check, Brain, Edit2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { GradingCriteria, SubmissionEvaluation } from "@/lib/types"

interface CriterionEvaluatorProps {
  criterion: GradingCriteria
  evaluation?: SubmissionEvaluation
  onEvaluate: (score: number, feedback: string) => void
}

export function CriterionEvaluator({ criterion, evaluation, onEvaluate }: CriterionEvaluatorProps) {
  const [score, setScore] = useState(evaluation?.score ?? 0)
  const [feedback, setFeedback] = useState(evaluation?.feedback ?? "")
  const [isEditing, setIsEditing] = useState(!evaluation)

  const handleAcceptAI = () => {
    if (evaluation?.is_ai_generated) {
      setScore(evaluation.score)
      setFeedback(evaluation.feedback)
      onEvaluate(evaluation.score, evaluation.feedback)
      setIsEditing(false)
    }
  }

  const handleSave = () => {
    onEvaluate(score, feedback)
    setIsEditing(false)
  }

  const percentage = criterion.max_score > 0 ? (score / criterion.max_score) * 100 : 0
  const scoreColor = percentage >= 80 ? "text-green-600" : percentage >= 60 ? "text-yellow-600" : "text-red-600"

  return (
    <Card className="border-l-4 border-l-[var(--criteria-success)] p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{criterion.name}</h4>
          {criterion.description && <p className="mt-1 text-sm text-muted-foreground">{criterion.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {evaluation?.is_ai_generated && (
            <Badge variant="secondary" className="bg-[var(--ai-accent)]/10 text-[var(--ai-accent)]">
              <Brain className="mr-1 h-3 w-3" />
              AI
            </Badge>
          )}
          <div className={`text-lg font-bold ${scoreColor}`}>
            {score}/{criterion.max_score}
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-sm">Score</Label>
            <Slider
              value={[score]}
              onValueChange={([value]) => setScore(value)}
              max={criterion.max_score}
              step={1}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{criterion.max_score}</span>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm">Feedback</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback for this criterion..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <div className="flex gap-2">
            {evaluation?.is_ai_generated && (
              <Button variant="outline" size="sm" onClick={handleAcceptAI} className="gap-1 bg-transparent">
                <Brain className="h-3 w-3" />
                Accept AI
              </Button>
            )}
            <Button size="sm" onClick={handleSave} className="gap-1">
              <Check className="h-3 w-3" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            {feedback || <span className="text-muted-foreground">No feedback provided.</span>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1">
            <Edit2 className="h-3 w-3" />
            Edit
          </Button>
        </div>
      )}
    </Card>
  )
}
