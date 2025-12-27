"use client"

import { useState } from "react"
import { GripVertical, Trash2, Brain, ChevronDown, ChevronUp, FlaskConical } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { GradingCriteria } from "@/lib/types"

interface CriterionCardProps {
  criterion: GradingCriteria
  onUpdate: (data: Partial<GradingCriteria>) => void
  onDelete: () => void
  onTestAI?: () => void
  dragHandleProps?: Record<string, unknown>
}

export function CriterionCard({ criterion, onUpdate, onDelete, onTestAI, dragHandleProps }: CriterionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 transition-colors hover:border-muted-foreground/20">
      <div className="flex items-start gap-3 p-4">
        <div {...dragHandleProps} className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Input
                value={criterion.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Criterion name"
                className="font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-md bg-[var(--criteria-success)]/10 px-3 py-1.5">
                <Input
                  type="number"
                  value={criterion.max_score}
                  onChange={(e) => onUpdate({ max_score: Number(e.target.value) })}
                  className="h-7 w-16 text-center"
                  min={1}
                  max={100}
                />
                <span className="text-sm text-muted-foreground">pts</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Textarea
            value={criterion.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe what this criterion evaluates..."
            className="min-h-[60px] resize-none text-sm"
          />

          <div className="flex items-center gap-6">
            <div className="flex-1">
              <Label className="mb-2 block text-xs text-muted-foreground">Weight: {criterion.weight.toFixed(1)}x</Label>
              <Slider
                value={[criterion.weight]}
                onValueChange={([value]) => onUpdate({ weight: value })}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id={`ai-${criterion.id}`}
                checked={criterion.auto_checkable}
                onCheckedChange={(checked) => onUpdate({ auto_checkable: checked })}
              />
              <Label htmlFor={`ai-${criterion.id}`} className="flex items-center gap-1.5 text-sm">
                <Brain className="h-4 w-4 text-[var(--ai-accent)]" />
                AI Check
              </Label>
            </div>
          </div>

          {criterion.auto_checkable && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-[var(--ai-accent)]">
                  <span className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Check Prompt
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-3">
                <Textarea
                  value={criterion.check_prompt || ""}
                  onChange={(e) => onUpdate({ check_prompt: e.target.value })}
                  placeholder="Enter the AI prompt that will be used to evaluate this criterion automatically..."
                  className="min-h-[100px] font-mono text-sm"
                />
                {criterion.check_prompt && onTestAI && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTestAI}
                    className="gap-2 bg-[var(--ai-accent)]/10 text-[var(--ai-accent)] hover:bg-[var(--ai-accent)]/20"
                  >
                    <FlaskConical className="h-4 w-4" />
                    Test AI Evaluation
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </Card>
  )
}
