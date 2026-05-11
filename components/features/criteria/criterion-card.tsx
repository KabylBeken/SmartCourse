"use client"

import { useState } from "react"
import { GripVertical, Trash2, Brain, ChevronDown, ChevronUp, FlaskConical, Copy, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { GradingCriteria } from "@/lib/types"

interface CriterionCardProps {
  criterion: GradingCriteria
  onUpdate: (data: Partial<GradingCriteria>) => void
  onDelete: () => void
  onDuplicate?: () => void
  onTestAI?: () => void
  dragHandleProps?: Record<string, unknown>
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200",
}

export function CriterionCard({ criterion, onUpdate, onDelete, onDuplicate, onTestAI, dragHandleProps }: CriterionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className={`border-2 transition-all hover:shadow-sm ${criterion.required ? "border-l-4 border-l-red-400" : ""}`}>
      <div className="flex items-start gap-3 p-4">
        <div {...dragHandleProps} className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Input
                value={criterion.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Criterion name"
                className="font-medium"
              />
              <div className="flex flex-wrap gap-1.5">
                {criterion.difficulty && (
                  <Badge variant="outline" className={`text-xs ${difficultyColors[criterion.difficulty]}`}>
                    {criterion.difficulty}
                  </Badge>
                )}
                {criterion.required && (
                  <Badge variant="outline" className="text-xs text-red-600 bg-red-50 border-red-200">
                    <Star className="mr-1 h-3 w-3" /> Required
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200 px-3 py-1.5">
                <Input
                  type="number"
                  value={criterion.max_score}
                  onChange={(e) => onUpdate({ max_score: Number(e.target.value) })}
                  className="h-7 w-16 text-center border-0 bg-transparent focus-visible:ring-0 p-0"
                  min={1}
                  max={200}
                />
                <span className="text-sm text-green-700 font-medium">pts</span>
              </div>

              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDuplicate}
                  className="text-muted-foreground hover:text-primary"
                  title="Duplicate criterion"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}

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

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[160px]">
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

            <div className="flex items-center gap-3">
              <Select
                value={criterion.difficulty || "medium"}
                onValueChange={(v) => onUpdate({ difficulty: v as GradingCriteria["difficulty"] })}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5">
                <Switch
                  id={`req-${criterion.id}`}
                  checked={!!criterion.required}
                  onCheckedChange={(v) => onUpdate({ required: v })}
                />
                <Label htmlFor={`req-${criterion.id}`} className="text-xs">Required</Label>
              </div>

              <div className="flex items-center gap-1.5">
                <Switch
                  id={`ai-${criterion.id}`}
                  checked={criterion.auto_checkable}
                  onCheckedChange={(checked) => onUpdate({ auto_checkable: checked })}
                />
                <Label htmlFor={`ai-${criterion.id}`} className="flex items-center gap-1 text-sm">
                  <Brain className="h-4 w-4 text-purple-500" />
                  AI
                </Label>
              </div>
            </div>
          </div>

          {criterion.auto_checkable && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-purple-600">
                  <span className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Evaluation Prompt
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-3">
                <Textarea
                  value={criterion.check_prompt || ""}
                  onChange={(e) => onUpdate({ check_prompt: e.target.value })}
                  placeholder="Enter the AI prompt for evaluating this criterion automatically. E.g. 'Rate the clarity and structure from 0 to 20 pts.'"
                  className="min-h-[100px] font-mono text-sm"
                />
                {criterion.check_prompt && onTestAI && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTestAI}
                    className="gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
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
