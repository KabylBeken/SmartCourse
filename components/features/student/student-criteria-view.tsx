"use client"

import { FileText, Calendar, Brain, Award } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { Assignment, GradingCriteria } from "@/lib/types"

interface StudentCriteriaViewProps {
  assignment: Assignment
  criteria: GradingCriteria[]
}

export function StudentCriteriaView({ assignment, criteria }: StudentCriteriaViewProps) {
  const totalPoints = criteria.reduce((sum, c) => sum + c.max_score, 0)
  const aiCriteriaCount = criteria.filter((c) => c.auto_checkable).length
  const formattedDueDate = new Date(assignment.due_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <p className="mt-2 text-muted-foreground">{assignment.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              Due: {formattedDueDate}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Award className="h-3 w-3" />
              {totalPoints} points
            </Badge>
          </div>
        </div>
      </Card>

      {/* Summary Card */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          Grading Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{criteria.length}</div>
            <div className="text-sm text-muted-foreground">Criteria</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <div className="text-3xl font-bold text-[var(--criteria-success)]">{totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <div className="text-3xl font-bold text-[var(--ai-accent)]">{aiCriteriaCount}</div>
            <div className="text-sm text-muted-foreground">AI-Assisted</div>
          </div>
        </div>
        {aiCriteriaCount > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-[var(--ai-accent)]/10 p-3 text-sm">
            <Brain className="h-4 w-4 text-[var(--ai-accent)]" />
            <span>Some criteria will be evaluated with AI assistance for faster feedback.</span>
          </div>
        )}
      </Card>

      {/* Criteria List */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Grading Criteria</h2>
        <Accordion type="multiple" className="space-y-2">
          {criteria.map((criterion, index) => {
            const weightPercentage =
              criteria.reduce((sum, c) => sum + c.weight, 0) > 0
                ? (criterion.weight / criteria.reduce((sum, c) => sum + c.weight, 0)) * 100
                : 0

            return (
              <AccordionItem key={criterion.id} value={`criterion-${criterion.id}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex flex-1 items-center justify-between pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                        {index + 1}
                      </div>
                      <span className="font-medium">{criterion.name}</span>
                      {criterion.auto_checkable && <Brain className="h-4 w-4 text-[var(--ai-accent)]" />}
                    </div>
                    <Badge variant="secondary">{criterion.max_score} pts</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <div className="space-y-4 pl-11">
                    {criterion.description && <p className="text-muted-foreground">{criterion.description}</p>}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>Weight</span>
                          <span>{weightPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={weightPercentage} className="h-2" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{criterion.max_score} pts</div>
                        <div className="text-xs text-muted-foreground">{criterion.weight.toFixed(1)}x weight</div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </Card>
    </div>
  )
}
