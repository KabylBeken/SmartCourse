"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Send,
  Sparkles,
  Target,
} from "lucide-react"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { StudentTestReviewQuestions } from "@/components/features/student/student-test-review-questions"
import { cn } from "@/lib/utils"
import { getStudentCourseById } from "@/lib/api/courses"
import {
  getStudentAssignment,
  getStudentAssignmentSubmission,
  saveStudentAssignmentDraft,
  submitStudentAssignment,
  type Assignment,
  type AssignmentSubmission,
  type TestAnswer,
} from "@/lib/api/assignments"

type AnswerMap = Record<number, number>

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  submitted: "Сдано",
  late: "Сдано поздно",
  graded: "Оценено",
}

const statusStyles: Record<string, string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  submitted: "border-sky-200 bg-sky-50 text-sky-700",
  late: "border-orange-200 bg-orange-50 text-orange-700",
  graded: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

export default function StudentAssignmentSubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const assignmentId = Number(id)
  const { toast } = useToast()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null)
  const [courseTitle, setCourseTitle] = useState("")
  const [content, setContent] = useState("")
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadAssignment()
  }, [assignmentId])

  const loadAssignment = async () => {
    if (!Number.isFinite(assignmentId)) {
      setError("Неверный ID задания")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const assignmentData = await getStudentAssignment(assignmentId)
      setAssignment(assignmentData)

      const [submissionData, courseData] = await Promise.all([
        getStudentAssignmentSubmission(assignmentId),
        getStudentCourseById(assignmentData.course_id).catch(() => null),
      ])

      setSubmission(submissionData)
      setCourseTitle(courseData?.title || `Курс #${assignmentData.course_id}`)
      setContent(submissionData.content || "")

      const answerMap: AnswerMap = {}
      ;(submissionData.answers || []).forEach((answer) => {
        answerMap[answer.question_id] = answer.selected_index
      })
      setAnswers(answerMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Тапсырманы жүктеу мүмкін болмады")
    } finally {
      setIsLoading(false)
    }
  }

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content])
  const minimumWords = assignment?.word_count || 0
  const questionCount = assignment?.questions?.length || 0
  const answeredCount =
    assignment?.questions?.filter((question, index) => answers[getQuestionId(question.id, index)] !== undefined).length || 0
  const isLocked = submission?.status === "submitted" || submission?.status === "late" || submission?.status === "graded"
  const grade = submission?.grade
  const status = submission?.status || "draft"
  const isEssay = assignment?.type !== "test"
  const showTestResults =
    !isEssay &&
    !!grade &&
    (submission?.test_review?.length ?? 0) > 0 &&
    (submission?.status === "submitted" || submission?.status === "late" || submission?.status === "graded")

  const canSubmit = useMemo(() => {
    if (!assignment || isLocked) return false
    if (assignment.type === "test") return questionCount > 0 && answeredCount === questionCount
    return content.trim().length > 0 && (minimumWords === 0 || wordCount >= minimumWords)
  }, [assignment, isLocked, questionCount, answeredCount, content, minimumWords, wordCount])

  const progress = minimumWords > 0 ? Math.min((wordCount / minimumWords) * 100, 100) : content.trim() ? 100 : 0

  const handleSaveDraft = async () => {
    if (!assignment || isLocked) return

    try {
      setIsSaving(true)
      const saved = await saveStudentAssignmentDraft(assignment.id, buildSubmissionPayload())
      setSubmission(saved)
      toast({ title: "Сақталды", description: "Черновик жаңартылды" })
    } catch (err) {
      toast({
        title: "Қате",
        description: err instanceof Error ? err.message : "Черновикті сақтау мүмкін болмады",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!assignment || !canSubmit) return

    try {
      setIsSubmitting(true)
      const submitted = await submitStudentAssignment(assignment.id, buildSubmissionPayload())
      setSubmission(submitted)
      toast({
        title: submitted.grade ? "Автоматты бағаланды" : "Жіберілді",
        description: submitted.grade
          ? `Нәтиже: ${submitted.grade.score} / ${assignment.max_score}`
          : "Жауабыңыз оқытушы бағалауына жіберілді",
      })
    } catch (err) {
      toast({
        title: "Қате",
        description: err instanceof Error ? err.message : "Тапсырманы жіберу мүмкін болмады",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildSubmissionPayload = () => ({
    content,
    answers: buildAnswers(assignment, answers),
  })

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/student/assignments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-normal">{assignment?.title || "Тапсырма"}</h1>
              {assignment && <Badge variant="outline">{assignment.type === "test" ? "Тест" : "Эссе"}</Badge>}
              {submission && (
                <Badge variant="outline" className={cn("border", statusStyles[status] || statusStyles.draft)}>
                  {statusLabels[status] || "Черновик"}
                </Badge>
              )}
              {assignment && (
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href={`/student/tutor/${assignment.id}`}>
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    AI Репетитор
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-muted-foreground">{courseTitle || "Просмотр и выполнение задания"}</p>
          </div>
        </div>

        {isLoading && (
          <Card className="flex items-center justify-center border-0 py-16 shadow-sm ring-1 ring-border">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        )}

        {!isLoading && error && (
          <Card className="border-0 p-6 shadow-sm ring-1 ring-border">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {!isLoading && assignment && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              {grade && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                  <Award className="h-4 w-4" />
                  <AlertTitle>Нәтиже: {grade.score} / {assignment.max_score}</AlertTitle>
                  {grade.feedback && <AlertDescription>{grade.feedback}</AlertDescription>}
                </Alert>
              )}

              {isLocked && !grade && (
                <Alert className="border-sky-200 bg-sky-50 text-sky-900">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Тапсырма жіберілді</AlertTitle>
                  <AlertDescription>Жауап бұдан кейін өзгертілмейді. Оқытушы бағалауын күтіңіз.</AlertDescription>
                </Alert>
              )}

              <Card className="border-0 shadow-sm ring-1 ring-border">
                <CardHeader>
                  <CardTitle>{isEssay ? "Жауап мәтіні" : "Тест сұрақтары"}</CardTitle>
                  <CardDescription>
                    {isEssay
                      ? "Эссе мәтінін жазыңыз немесе дайын жауабыңызды қойыңыз"
                      : showTestResults
                        ? "Тест жауаптары — дұрыс пен қателер көрсетілген"
                        : `${answeredCount} / ${questionCount} сұраққа жауап берілді`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {isEssay ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="essay-content">Жауап</Label>
                          <span
                            className={cn(
                              "text-sm",
                              minimumWords > 0 && wordCount < minimumWords ? "text-amber-600" : "text-muted-foreground"
                            )}
                          >
                            {minimumWords > 0 ? `${wordCount} / ${minimumWords} сөз` : `${wordCount} сөз`}
                          </span>
                        </div>
                        <Textarea
                          id="essay-content"
                          value={content}
                          onChange={(event) => setContent(event.target.value)}
                          disabled={isLocked}
                          placeholder="Жауабыңызды осы жерге жазыңыз..."
                          className="min-h-[420px] resize-y text-base leading-7"
                        />
                        <Progress value={progress} className="h-2" />
                      </div>
                    </>
                  ) : (
                    <StudentTestReviewQuestions
                      assignment={assignment}
                      answers={answers}
                      submission={submission}
                      locked={isLocked}
                      showResults={showTestResults}
                      onAnswerChange={(questionId, optionIndex) =>
                        setAnswers((current) => ({ ...current, [questionId]: optionIndex }))
                      }
                    />
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                  <Link href="/student/assignments">Назад</Link>
                </Button>
                {!isLocked && (
                  <>
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSubmitting}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Сақтау
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting || isSaving}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Жіберу
                    </Button>
                  </>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <Card className="border-0 shadow-sm ring-1 ring-border">
                <CardHeader>
                  <CardTitle className="text-base">Тапсырма ақпараты</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <InfoRow icon={BookOpen} label="Курс" value={courseTitle || `Курс #${assignment.course_id}`} />
                  <InfoRow icon={Calendar} label="Срок" value={formatDate(assignment.due_date)} />
                  <InfoRow icon={Target} label="Максимум" value={`${assignment.max_score} балл`} />
                  <InfoRow icon={FileText} label="Түрі" value={assignment.type === "test" ? "Тест" : "Эссе"} />
                  <Separator />
                  <div>
                    <div className="mb-1 font-medium">Сипаттама</div>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {assignment.description || "Сипаттама берілмеген"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm ring-1 ring-border">
                <CardHeader>
                  <CardTitle className="text-base">Бағалау критерийлері</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(assignment.criteria || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Бұл тапсырмаға критерий қосылмаған.</p>
                  ) : (
                    assignment.criteria?.map((criterion, index) => (
                      <div key={`${criterion.name}-${index}`} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{criterion.name}</div>
                            <div className="text-xs text-muted-foreground">{criterion.description}</div>
                          </div>
                          <Badge variant="secondary">{criterion.maxPoints || criterion.max_score || 0}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function buildAnswers(assignment: Assignment | null, answers: AnswerMap): TestAnswer[] {
  if (!assignment?.questions) return []

  return assignment.questions
    .filter((question, index) => answers[getQuestionId(question.id, index)] !== undefined)
    .map((question, index) => ({
      question_id: getQuestionId(question.id, index),
      selected_index: answers[getQuestionId(question.id, index)],
    }))
}

function getQuestionId(id: number, index: number) {
  return id || index + 1
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  )
}
