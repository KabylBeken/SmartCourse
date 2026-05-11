"use client"

import { useState } from "react"
import { Sparkles, Send, CheckCircle2, AlertCircle } from "lucide-react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { enqueueJob, pollJob, type JobStatus } from "@/lib/api/jobs"

interface CriterionResult {
  name: string
  score: number
  max_score: number
  feedback: string
}
interface EvalResult {
  total: number
  max: number
  overall_feedback: string
  criteria: CriterionResult[]
}

const DEFAULT_CRITERIA = [
  { name: "Структура и связность", description: "Логика построения текста", max_score: 30, prompt: "" },
  { name: "Аргументация", description: "Качество доводов и примеров", max_score: 40, prompt: "" },
  { name: "Грамотность", description: "Орфография, пунктуация, стиль", max_score: 30, prompt: "" },
]

export default function AIDemoPage() {
  const [submission, setSubmission] = useState("")
  const [assignmentName, setAssignmentName] = useState("Эссе про AI в образовании")
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA)
  const [job, setJob] = useState<JobStatus | null>(null)
  const [result, setResult] = useState<EvalResult | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  const updateCriterion = (i: number, field: keyof typeof DEFAULT_CRITERIA[number], v: string | number) => {
    setCriteria((arr) => arr.map((c, idx) => (idx === i ? { ...c, [field]: v } : c)))
  }

  const handleRun = async () => {
    if (!submission.trim()) {
      toast({ title: "Введите текст работы", variant: "destructive" })
      return
    }
    setBusy(true)
    setJob(null)
    setResult(null)
    try {
      const { job_id } = await enqueueJob("ai_evaluate", {
        submission_text: submission,
        assignment_name: assignmentName,
        criteria: criteria.map((c) => ({
          name: c.name,
          description: c.description,
          max_score: c.max_score,
          prompt: c.prompt,
        })),
      })
      const final = await pollJob(job_id, {
        intervalMs: 1000,
        timeoutMs: 120_000,
        onUpdate: setJob,
      })
      if (final.status === "done" && final.result) {
        setResult(final.result as EvalResult)
        toast({ title: "AI оценил работу", description: `${(final.result as EvalResult).total} / ${(final.result as EvalResult).max}` })
      } else if (final.status === "failed") {
        toast({ title: "Ошибка AI", description: final.error, variant: "destructive" })
      }
    } catch (e) {
      toast({
        title: "Не удалось поставить задачу",
        description: e instanceof Error ? e.message : "unknown",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Sparkles className="h-7 w-7 text-primary" /> AI Demo: асинхронная оценка
          </h1>
          <p className="text-muted-foreground">
            Постановка задачи в Redis-очередь → воркер вызывает OpenRouter → результат через WebSocket / polling.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Название задания</Label>
              <Input value={assignmentName} onChange={(e) => setAssignmentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Текст работы студента</Label>
              <Textarea
                rows={10}
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="Вставьте сюда сданное эссе…"
              />
            </div>
            <div className="space-y-2">
              <Label>Критерии</Label>
              <div className="space-y-2">
                {criteria.map((c, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-6"
                      value={c.name}
                      onChange={(e) => updateCriterion(i, "name", e.target.value)}
                    />
                    <Input
                      className="col-span-4"
                      value={c.description}
                      onChange={(e) => updateCriterion(i, "description", e.target.value)}
                    />
                    <Input
                      type="number"
                      className="col-span-2"
                      value={c.max_score}
                      onChange={(e) => updateCriterion(i, "max_score", Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleRun} disabled={busy} className="w-full">
              {busy ? "Выполняется…" : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Запустить AI оценивание
                </>
              )}
            </Button>
          </Card>

          <Card className="space-y-4 p-5">
            <h3 className="font-semibold">Статус задачи</h3>
            {!job ? (
              <p className="text-sm text-muted-foreground">Запустите задачу слева.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      job.status === "done"
                        ? "bg-green-500"
                        : job.status === "failed"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }
                  >
                    {job.status}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{job.id.slice(0, 8)}</span>
                </div>
                <Progress value={job.progress} />
                {job.error && (
                  <p className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" /> {job.error}
                  </p>
                )}
              </>
            )}

            {result && (
              <div className="space-y-3 pt-3">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-sm text-muted-foreground">Итог</p>
                  <p className="text-2xl font-bold">
                    {result.total} <span className="text-muted-foreground">/ {result.max}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  {result.criteria.map((c, idx) => (
                    <div key={idx} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-medium">{c.name}</p>
                        <span className="text-sm font-bold">
                          {c.score} / {c.max_score}
                        </span>
                      </div>
                      <Progress value={(c.score / Math.max(c.max_score, 1)) * 100} />
                      <p className="mt-2 text-xs text-muted-foreground">{c.feedback}</p>
                    </div>
                  ))}
                </div>
                {result.overall_feedback && (
                  <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-sm">
                    <p className="mb-1 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Общий отзыв
                    </p>
                    {result.overall_feedback}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
