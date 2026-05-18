"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, FileText, Users, GraduationCap, Eye, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react"
import { getAllCourses } from "@/lib/api/courses"
import { getTeacherCourseAssignments } from "@/lib/api/assignments"
import {
  getAssignmentSubmissions, createGrade, updateGrade, reviewEssayWithAI,
  type AssignmentSubmission,
} from "@/lib/api/grades"
import type { Course, Assignment } from "@/lib/types"

// ── status helpers ────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  draft:     "Черновик",
  submitted: "Жіберілді",
  late:      "Кешіктірілді",
  graded:    "Бағаланды",
}

function StatusBadge({ status, score }: { status: string; score: number | null }) {
  if (score !== null) {
    const variant = score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"
    return <Badge variant={variant}>{score} / 100</Badge>
  }
  const map: Record<string, "outline" | "secondary" | "destructive"> = {
    draft: "outline", submitted: "secondary", late: "destructive",
  }
  return (
    <Badge variant={map[status] ?? "outline"} className="gap-1">
      {status === "submitted" && <Clock className="h-3 w-3" />}
      {status === "late" && <AlertCircle className="h-3 w-3" />}
      {status === "graded" && <CheckCircle2 className="h-3 w-3" />}
      {STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function EvaluationsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("")
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  // Sheet (side panel) for viewing submission + grading
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeSubmission, setActiveSubmission] = useState<AssignmentSubmission | null>(null)
  const [scoreInput, setScoreInput] = useState("")
  const [feedbackInput, setFeedbackInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ score: number; feedback: string } | null>(null)

  const { toast } = useToast()

  // Load courses
  useEffect(() => {
    getAllCourses()
      .then(setCourses)
      .catch(() => toast({ title: "Ошибка", description: "Курстар жүктелмеді", variant: "destructive" }))
      .finally(() => setLoadingCourses(false))
  }, [])

  // Load assignments on course select
  useEffect(() => {
    if (!selectedCourseId) { setAssignments([]); setSelectedAssignmentId(""); return }
    setLoadingAssignments(true)
    getTeacherCourseAssignments(parseInt(selectedCourseId))
      .then(data => { setAssignments(data); setSelectedAssignmentId("") })
      .catch(() => toast({ title: "Ошибка", description: "Тапсырмалар жүктелмеді", variant: "destructive" }))
      .finally(() => setLoadingAssignments(false))
  }, [selectedCourseId])

  // Load submissions on assignment select
  useEffect(() => {
    if (!selectedAssignmentId) { setSubmissions([]); return }
    setLoadingSubmissions(true)
    getAssignmentSubmissions(parseInt(selectedAssignmentId))
      .then(data => setSubmissions(data ?? []))
      .catch(() => toast({ title: "Ошибка", description: "Жұмыстар жүктелмеді", variant: "destructive" }))
      .finally(() => setLoadingSubmissions(false))
  }, [selectedAssignmentId])

  const openSheet = (sub: AssignmentSubmission) => {
    setActiveSubmission(sub)
    setScoreInput(sub.score !== null ? String(sub.score) : "")
    setFeedbackInput(sub.feedback ?? "")
    setAiResult(null)
    setSheetOpen(true)
  }

  const handleAIReview = async () => {
    if (!activeSubmission?.content || !selectedAssignmentId) return
    setAiLoading(true)
    setAiResult(null)
    try {
      const result = await reviewEssayWithAI(parseInt(selectedAssignmentId), activeSubmission.content)
      setAiResult({ score: result.suggested_score, feedback: result.feedback })
      // Auto-fill form fields
      if (result.suggested_score >= 0) setScoreInput(String(Math.round(result.suggested_score)))
      if (result.feedback) setFeedbackInput(result.feedback)
      toast({ title: "AI тексеруі аяқталды", description: "Балл мен пікір толтырылды" })
    } catch (e: unknown) {
      toast({ title: "AI қатесі", description: (e as Error).message, variant: "destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSaveGrade = async () => {
    if (!activeSubmission || !selectedAssignmentId) return
    const score = parseFloat(scoreInput)
    if (isNaN(score) || score < 0 || score > 100) {
      toast({ title: "Қате", description: "0–100 арасында баға еңгізіңіз", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      if (activeSubmission.grade_id) {
        await updateGrade(activeSubmission.grade_id, { score, feedback: feedbackInput })
      } else {
        await createGrade(parseInt(selectedAssignmentId), {
          student_id: activeSubmission.student_id,
          score,
          feedback: feedbackInput,
        })
      }
      toast({ title: "Сақталды", description: `${activeSubmission.username}: ${score} балл` })
      // refresh submissions list
      const updated = await getAssignmentSubmissions(parseInt(selectedAssignmentId))
      setSubmissions(updated ?? [])
      setSheetOpen(false)
    } catch (e: unknown) {
      toast({ title: "Қате", description: (e as Error).message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const selectedAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId)
  const gradedCount = submissions.filter(s => s.score !== null).length
  const pendingCount = submissions.filter(s => s.score === null && (s.status === "submitted" || s.status === "late")).length

  return (
    <DashboardLayout userRole="teacher">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Оценивание работ</h1>
        <p className="text-muted-foreground">Просмотр и выставление оценок студентам</p>
      </div>

      {/* Selectors */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />Выберите курс
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={loadingCourses}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCourses ? "Загрузка..." : "Выберите курс"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />Выберите задание
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}
              disabled={!selectedCourseId || loadingAssignments}>
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedCourseId ? "Сначала выберите курс"
                    : loadingAssignments ? "Загрузка..."
                    : assignments.length === 0 ? "Заданий нет"
                    : "Выберите задание"
                } />
              </SelectTrigger>
              <SelectContent>
                {assignments.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Assignment info */}
      {selectedAssignment && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{selectedAssignment.title}</CardTitle>
            <CardDescription>{selectedAssignment.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Срок: {new Date(selectedAssignment.due_date).toLocaleDateString("ru-RU")}</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">✓ Бағаланды: {gradedCount}</span>
              <span>•</span>
              <span className="text-amber-600 font-medium">⏳ Күтеді: {pendingCount}</span>
              <span>•</span>
              <span>Барлығы: {submissions.length}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions list */}
      {selectedAssignmentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />Студент жұмыстары
            </CardTitle>
            <CardDescription>Жұмысты ашу үшін жолды басыңыз</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSubmissions ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <FileText className="mb-3 h-12 w-12 opacity-30" />
                <p className="font-medium">Жіберілген жұмыс жоқ</p>
                <p className="text-sm">Студенттер әлі жұмыс тапсырмаған</p>
              </div>
            ) : (
              <div className="divide-y">
                {submissions.map(sub => (
                  <div
                    key={sub.id}
                    className="flex cursor-pointer items-center justify-between gap-4 px-2 py-3 hover:bg-muted/50 rounded-md transition-colors"
                    onClick={() => openSheet(sub)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{sub.username}</p>
                      {sub.content ? (
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                          {sub.content.slice(0, 120)}{sub.content.length > 120 ? "…" : ""}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic mt-0.5">Мазмұн жоқ</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {sub.word_count > 0 && (
                        <span className="text-xs text-muted-foreground">{sub.word_count} сөз</span>
                      )}
                      <StatusBadge status={sub.status} score={sub.score} />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!selectedAssignmentId && !loadingCourses && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Курс пен тапсырма таңдаңыз</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Студент жұмыстарын көру үшін жоғарыдан курс пен тапсырма таңдаңыз
            </p>
          </CardContent>
        </Card>
      )}

      {/* Side sheet — full essay + grade form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {activeSubmission?.username}
            </SheetTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {activeSubmission && (
                <StatusBadge status={activeSubmission.status} score={activeSubmission.score} />
              )}
              {activeSubmission?.word_count ? (
                <span className="text-xs text-muted-foreground">{activeSubmission.word_count} сөз</span>
              ) : null}
              {activeSubmission?.submitted_at && (
                <span className="text-xs text-muted-foreground">
                  Жіберілді: {new Date(activeSubmission.submitted_at).toLocaleString("ru-RU")}
                </span>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {activeSubmission?.content ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {activeSubmission.content}
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">Мазмұн жіберілмеген</p>
              )}
            </div>

            {/* AI Review section — inside ScrollArea so it scrolls with essay */}
            <div className="px-6 pb-4 pt-3 border-t bg-violet-50/50 dark:bg-violet-950/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium flex items-center gap-1.5 text-violet-700 dark:text-violet-400">
                  <Sparkles className="h-4 w-4" />
                  AI тексеру
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-400"
                  onClick={handleAIReview}
                  disabled={aiLoading || !activeSubmission?.content}
                >
                  {aiLoading
                    ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Тексерілуде…</>
                    : <><Sparkles className="mr-1.5 h-3.5 w-3.5" />AI тексеру</>
                  }
                </Button>
              </div>
              {aiLoading && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  AI эссені критерийлер бойынша тексеруде…
                </p>
              )}
              {aiResult && !aiLoading && (
                <div className="rounded-md border border-violet-200 dark:border-violet-800 bg-white dark:bg-background p-3 text-xs space-y-1">
                  {aiResult.score >= 0 && (
                    <p className="font-semibold text-violet-700 dark:text-violet-400">
                      Ұсынылатын балл: <span className="text-base">{Math.round(aiResult.score)}</span> / 100
                    </p>
                  )}
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {aiResult.feedback}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t px-6 py-4 space-y-3">
            <p className="text-sm font-semibold">Баға қою</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Балл (0–100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scoreInput}
                  onChange={e => setScoreInput(e.target.value)}
                  placeholder="85"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Пікір (міндетті емес)</Label>
              <Textarea
                rows={3}
                value={feedbackInput}
                onChange={e => setFeedbackInput(e.target.value)}
                placeholder="Жұмыс бойынша пікір..."
              />
            </div>
            <Button onClick={handleSaveGrade} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {activeSubmission?.grade_id ? "Бағаны жаңарту" : "Баға қою"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
