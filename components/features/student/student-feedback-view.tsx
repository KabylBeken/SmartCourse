"use client"

import { Download, TrendingUp, TrendingDown, Brain, CheckCircle, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { GradingCriteria, SubmissionEvaluation, Submission } from "@/lib/types"

interface StudentFeedbackViewProps {
  submission: Submission
  criteria: GradingCriteria[]
  evaluations: SubmissionEvaluation[]
  strengths?: string[]
  weaknesses?: string[]
}

export function StudentFeedbackView({
  submission,
  criteria,
  evaluations,
  strengths = [],
  weaknesses = [],
}: StudentFeedbackViewProps) {
  // Calculate scores
  const totalMaxScore = criteria.reduce((sum, c) => sum + c.max_score * c.weight, 0)
  const totalScore = evaluations.reduce((sum, e) => {
    const criterion = criteria.find((c) => c.id === e.criteria_id)
    return sum + e.score * (criterion?.weight || 1)
  }, 0)
  const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0
  const grade = percentage >= 90 ? "A" : percentage >= 80 ? "B" : percentage >= 70 ? "C" : percentage >= 60 ? "D" : "F"

  const gradeColors: Record<string, string> = {
    A: "from-green-500 to-emerald-600",
    B: "from-blue-500 to-cyan-600",
    C: "from-yellow-500 to-amber-600",
    D: "from-orange-500 to-red-500",
    F: "from-red-500 to-rose-600",
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className={`relative overflow-hidden bg-gradient-to-br ${gradeColors[grade]} p-8 text-white`}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">Your Results</h1>
            <p className="mt-2 opacity-90">Assignment feedback and scores</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold">{percentage.toFixed(0)}%</div>
              <div className="text-sm opacity-80">Overall Score</div>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl font-bold backdrop-blur-sm">
              {grade}
            </div>
          </div>
        </div>
        <Progress value={percentage} className="mt-6 h-3 bg-white/20" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </Card>

      {/* Strengths & Weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {strengths.length > 0 && (
            <Card className="border-l-4 border-l-green-500 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-green-600">
                <TrendingUp className="h-5 w-5" />
                Strengths
              </h2>
              <ul className="space-y-2">
                {strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {weaknesses.length > 0 && (
            <Card className="border-l-4 border-l-orange-500 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-orange-600">
                <TrendingDown className="h-5 w-5" />
                Areas for Improvement
              </h2>
              <ul className="space-y-2">
                {weaknesses.map((weakness, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Criterion Breakdown */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Detailed Feedback</h2>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <div className="space-y-4">
          {criteria.map((criterion) => {
            const evaluation = evaluations.find((e) => e.criteria_id === criterion.id)
            const score = evaluation?.score || 0
            const scorePct = criterion.max_score > 0 ? (score / criterion.max_score) * 100 : 0
            const scoreColor = scorePct >= 80 ? "bg-green-500" : scorePct >= 60 ? "bg-yellow-500" : "bg-red-500"

            return (
              <Card key={criterion.id} className="border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-medium">{criterion.name}</h3>
                      {evaluation?.is_ai_generated && (
                        <Badge variant="secondary" className="bg-[var(--ai-accent)]/10 text-[var(--ai-accent)]">
                          <Brain className="mr-1 h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="mb-3 flex items-center gap-3">
                      <Progress value={scorePct} className="h-2 flex-1" />
                      <span className="text-sm font-medium">
                        {score}/{criterion.max_score}
                      </span>
                    </div>
                    {evaluation?.feedback && (
                      <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{evaluation.feedback}</p>
                    )}
                  </div>
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${scoreColor} text-lg font-bold text-white`}
                  >
                    {score}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
