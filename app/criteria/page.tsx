"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { CriteriaBuilder } from "@/components/features/criteria/criteria-builder"
import { AITestDialog } from "@/components/features/criteria/ai-test-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, ArrowLeft, Target, BookOpen, Search, ChevronRight, Brain, FileText } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { getAssignment, getTeacherCourseAssignments, updateAssignmentCriteria, type Assignment } from "@/lib/api/assignments"
import { getAllCourses, type Course } from "@/lib/api/courses"
import type { EssayCriterion } from "@/lib/api/ai"
import type { GradingCriteria } from "@/lib/types"

function toBuilderCriteria(assignment: Assignment): GradingCriteria[] {
  return (assignment.criteria || []).map((criterion, index) => ({
    id: criterion.id || index + 1,
    assignment_id: assignment.id,
    name: criterion.name || "",
    description: criterion.description || "",
    max_score: criterion.max_score || criterion.maxPoints || 10,
    weight: criterion.weight || 1,
    auto_checkable: criterion.auto_checkable || false,
    check_prompt: criterion.check_prompt || "",
    order_index: criterion.order_index ?? index,
  }))
}

function toApiCriteria(criteria: GradingCriteria[]): EssayCriterion[] {
  return criteria.map((criterion, index) => ({
    id: criterion.id,
    name: criterion.name,
    description: criterion.description,
    maxPoints: Number(criterion.max_score),
    max_score: Number(criterion.max_score),
    weight: Number(criterion.weight),
    auto_checkable: criterion.auto_checkable,
    check_prompt: criterion.check_prompt,
    order_index: index,
  }))
}

// ─── Assignment Picker (shown when no ?assignment param) ───────────────────

interface CourseWithAssignments extends Course {
  assignments: Assignment[]
}

function AssignmentPicker() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithAssignments[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const allCourses = await getAllCourses()
        const withAssignments = await Promise.all(
          allCourses.map(async (course) => {
            try {
              const assignments = await getTeacherCourseAssignments(course.id)
              return { ...course, assignments: assignments.filter((a) => a.type === "essay" || !a.type) }
            } catch {
              return { ...course, assignments: [] }
            }
          }),
        )
        setCourses(withAssignments.filter((c) => c.assignments.length > 0))
      } catch {
        setCourses([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = courses
    .map((c) => ({
      ...c,
      assignments: c.assignments.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          c.title.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((c) => c.assignments.length > 0)

  const totalAssignments = courses.reduce((s, c) => s + c.assignments.length, 0)

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-8">
        {/* Hero header */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-purple-50 to-blue-50 border p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/15 p-3">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Критерии оценки</h1>
              <p className="mt-1.5 text-muted-foreground max-w-lg">
                Выберите задание, чтобы настроить критерии оценки, добавить AI-проверку или использовать шаблоны.
              </p>
              {!isLoading && (
                <div className="mt-3 flex gap-3">
                  <Badge variant="secondary" className="gap-1.5">
                    <BookOpen className="h-3 w-3" /> {courses.length} курсов
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5">
                    <FileText className="h-3 w-3" /> {totalAssignments} заданий
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по заданию или курсу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((j) => <Skeleton key={j} className="h-24 w-full rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {search ? "Задания не найдены" : "Нет заданий типа 'essay'"}
            </h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              {search
                ? "Попробуйте изменить поисковый запрос."
                : "Создайте задание типа Essay в разделе Задания, затем вернитесь сюда."}
            </p>
            <Button asChild variant="outline">
              <Link href="/assignments">Перейти к заданиям</Link>
            </Button>
          </Card>
        )}

        {/* Courses + assignments grouped */}
        {!isLoading && filtered.map((course) => (
          <div key={course.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">{course.title}</h2>
              <Badge variant="outline" className="text-xs">{course.assignments.length}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {course.assignments.map((assignment) => {
                const criteriaCount = assignment.criteria?.length ?? 0
                const aiCount = assignment.criteria?.filter((c) => c.auto_checkable).length ?? 0
                return (
                  <button
                    key={assignment.id}
                    onClick={() => router.push(`/criteria?assignment=${assignment.id}`)}
                    className="group text-left rounded-xl border-2 border-transparent bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">
                          {assignment.title}
                        </p>
                        {assignment.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {criteriaCount > 0 ? (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Target className="h-3 w-3" /> {criteriaCount} критериев
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Нет критериев</Badge>
                      )}
                      {aiCount > 0 && (
                        <Badge variant="outline" className="text-xs gap-1 text-purple-600 bg-purple-50 border-purple-200">
                          <Brain className="h-3 w-3" /> {aiCount} AI
                        </Badge>
                      )}
                      {assignment.max_score && (
                        <Badge variant="outline" className="text-xs text-green-700 bg-green-50 border-green-200">
                          {assignment.max_score} pts
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CriteriaPage() {
  const [assignmentId, setAssignmentId] = useState<number | null>(null)
  const [hasChecked, setHasChecked] = useState(false)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [criteria, setCriteria] = useState<GradingCriteria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testingCriterion, setTestingCriterion] = useState<GradingCriteria | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const id = Number(searchParams.get("assignment"))
    if (Number.isFinite(id) && id > 0) {
      setAssignmentId(id)
    } else {
      setIsLoading(false)
    }
    setHasChecked(true)
  }, [])

  useEffect(() => {
    async function loadAssignment() {
      if (!assignmentId) return

      try {
        const data = await getAssignment(assignmentId)
        setAssignment(data)
        setCriteria(toBuilderCriteria(data))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Критерии жүктелмеді")
      } finally {
        setIsLoading(false)
      }
    }

    loadAssignment()
  }, [assignmentId])

  const handleAddCriterion = () => {
    if (!assignment) return

    setCriteria((current) => [
      ...current,
      {
        id: Date.now(),
        assignment_id: assignment.id,
        name: "Жаңа критерий",
        description: "",
        max_score: 10,
        weight: 1,
        auto_checkable: false,
        check_prompt: "",
        order_index: current.length,
      },
    ])
  }

  const handleUpdateCriterion = (id: number, data: Partial<GradingCriteria>) => {
    setCriteria((current) => current.map((criterion) => (criterion.id === id ? { ...criterion, ...data } : criterion)))
  }

  const handleDeleteCriterion = (id: number) => {
    setCriteria((current) => current.filter((criterion) => criterion.id !== id))
  }

  const handleDuplicateCriterion = (id: number) => {
    setCriteria((current) => {
      const source = current.find((c) => c.id === id)
      if (!source) return current
      const clone: GradingCriteria = { ...source, id: Date.now(), name: `${source.name} (copy)`, order_index: current.length }
      return [...current, clone]
    })
  }

  const handleReorderCriteria = (ids: number[]) => {
    setCriteria((current) =>
      ids.map((id, index) => {
        const criterion = current.find((item) => item.id === id)!
        return { ...criterion, order_index: index }
      }),
    )
  }

  const handleApplyTemplate = (
    templateCriteria: Omit<GradingCriteria, "id" | "assignment_id" | "order_index">[]
  ) => {
    if (!assignment) return
    const newCriteria: GradingCriteria[] = templateCriteria.map((tc, index) => ({
      ...tc,
      id: Date.now() + index,
      assignment_id: assignment.id,
      order_index: index,
    }))
    setCriteria(newCriteria)
    toast({ title: "Шаблон қолданылды", description: `${newCriteria.length} критерий қосылды.` })
  }

  const handleAIGenerateCriteria = async () => {
    if (!assignment) return
    const res = await fetch("/api/ai/generate-criteria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        max_score: assignment.max_score || 100,
        count: 5,
      }),
    })
    const data = (await res.json()) as { criteria?: unknown[]; error?: string }
    if (!res.ok || !Array.isArray(data.criteria)) {
      toast({ title: "AI қате", description: data.error || "Критерий генерациясы сәтсіз.", variant: "destructive" })
      return
    }
    const generated: GradingCriteria[] = (data.criteria as Partial<GradingCriteria>[]).map((c, i) => ({
      id: Date.now() + i,
      assignment_id: assignment.id,
      name: c.name || `Criterion ${i + 1}`,
      description: c.description || "",
      max_score: typeof c.max_score === "number" ? c.max_score : 20,
      weight: typeof c.weight === "number" ? c.weight : 1,
      auto_checkable: !!c.auto_checkable,
      check_prompt: c.check_prompt || "",
      difficulty: (c.difficulty as GradingCriteria["difficulty"]) || "medium",
      order_index: i,
    }))
    setCriteria(generated)
    toast({ title: "AI генерация дайын", description: `${generated.length} критерий жасалды.` })
  }

  const handleSave = async () => {
    if (!assignment) return

    const updated = await updateAssignmentCriteria(assignment.id, toApiCriteria(criteria))
    setAssignment(updated)
    setCriteria(toBuilderCriteria(updated))
    toast({ title: "Критерии сақталды", description: "Бағалау критерийлері жаңартылды." })
  }

  const handleOpenAITest = (criterion: GradingCriteria) => {
    setTestingCriterion(criterion)
    setTestDialogOpen(true)
  }

  const handleTestAI = async (criteriaId: number, sampleText: string) => {
    const criterion = criteria.find((item) => item.id === criteriaId)
    const maxScore = criterion?.max_score || 10
    const score = Math.min(maxScore, Math.max(1, Math.round(sampleText.trim().length / 80)))

    return {
      score,
      feedback: "Тест режимі: нақты AI бағалау модулі evaluations бөлімінде қолданылады.",
    }
  }

  // No assignment ID → show picker
  if (hasChecked && !assignmentId) {
    return <AssignmentPicker />
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/criteria">
            <ArrowLeft className="h-4 w-4" />
            Все задания
          </Link>
        </Button>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && error && (
          <Card className="p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/criteria">← Назад к списку</Link>
            </Button>
          </Card>
        )}

        {!isLoading && assignment && (
          <>
            <CriteriaBuilder
              assignment={assignment}
              criteria={criteria}
              onAddCriterion={handleAddCriterion}
              onUpdateCriterion={handleUpdateCriterion}
              onDeleteCriterion={handleDeleteCriterion}
              onDuplicateCriterion={handleDuplicateCriterion}
              onReorderCriteria={handleReorderCriteria}
              onSave={handleSave}
              onTestAICriterion={handleOpenAITest}
              onApplyTemplate={handleApplyTemplate}
              onAIGenerateCriteria={handleAIGenerateCriteria}
            />

            <AITestDialog
              open={testDialogOpen}
              onOpenChange={setTestDialogOpen}
              criterion={testingCriterion}
              onTest={handleTestAI}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
