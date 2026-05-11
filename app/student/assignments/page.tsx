"use client"

import type { ElementType } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  Send,
} from "lucide-react"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { getStudentCourses, type Course } from "@/lib/api/courses"
import {
  getStudentAssignmentSubmission,
  getStudentCourseAssignments,
  type Assignment,
  type AssignmentSubmission,
} from "@/lib/api/assignments"
import { getStudentGrades, type Grade } from "@/lib/api/grades"

type AssignmentProgressStatus = "graded" | "submitted" | "late" | "draft" | "overdue" | "not_started"

interface AssignmentWithProgress extends Assignment {
  grade?: Grade
  submission?: AssignmentSubmission
  status: AssignmentProgressStatus
}

const statusLabels: Record<AssignmentProgressStatus, string> = {
  graded: "Оценено",
  submitted: "Сдано",
  late: "Сдано поздно",
  draft: "Черновик",
  overdue: "Просрочено",
  not_started: "Не начато",
}

const statusStyles: Record<AssignmentProgressStatus, string> = {
  graded: "border-emerald-200 bg-emerald-50 text-emerald-700",
  submitted: "border-sky-200 bg-sky-50 text-sky-700",
  late: "border-orange-200 bg-orange-50 text-orange-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
  not_started: "border-zinc-200 bg-zinc-100 text-zinc-700",
}

export default function StudentAssignmentsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithProgress[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoadingCourses(true)
      const [coursesData, gradesData] = await Promise.all([getStudentCourses(), getStudentGrades()])
      setCourses(coursesData)
      setGrades(gradesData)
      await loadAssignments("all", coursesData, gradesData)
    } catch (error) {
      toast({
        title: "Қате",
        description: error instanceof Error ? error.message : "Деректерді жүктеу мүмкін болмады",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const loadAssignments = async (courseId: string, courseList = courses, gradeList = grades) => {
    try {
      setIsLoadingAssignments(true)

      const sourceAssignments =
        courseId === "all"
          ? (
              await Promise.all(
                courseList.map(async (course) => {
                  try {
                    return await getStudentCourseAssignments(course.id)
                  } catch {
                    return []
                  }
                })
              )
            ).flat()
          : await getStudentCourseAssignments(Number(courseId))

      const withProgress = await Promise.all(sourceAssignments.map((assignment) => enrichAssignment(assignment, gradeList)))
      withProgress.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      setAssignments(withProgress)
    } catch (error) {
      toast({
        title: "Қате",
        description: error instanceof Error ? error.message : "Тапсырмаларды жүктеу мүмкін болмады",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const enrichAssignment = async (assignment: Assignment, gradeList: Grade[]): Promise<AssignmentWithProgress> => {
    let submission: AssignmentSubmission | undefined
    try {
      submission = await getStudentAssignmentSubmission(assignment.id)
    } catch {
      submission = undefined
    }

    const grade = gradeList.find((item) => item.assignment_id === assignment.id) || submission?.grade
    const hasDraft =
      Boolean(submission?.id) &&
      (Boolean(submission?.content?.trim()) || Boolean(submission?.answers && submission.answers.length > 0))

    let status: AssignmentProgressStatus = "not_started"
    if (grade) {
      status = "graded"
    } else if (submission?.status === "submitted") {
      status = "submitted"
    } else if (submission?.status === "late") {
      status = "late"
    } else if (hasDraft) {
      status = "draft"
    } else if (isOverdue(assignment.due_date)) {
      status = "overdue"
    }

    return { ...assignment, grade, submission, status }
  }

  const handleCourseChange = async (value: string) => {
    setSelectedCourseId(value)
    await loadAssignments(value)
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  const isOverdue = (dueDate: string) => new Date(dueDate).getTime() < Date.now()

  const getCourseName = (courseId: number) => {
    const course = courses.find((item) => item.id === courseId)
    return course?.title || `Курс #${courseId}`
  }

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return assignments.filter((assignment) => {
      const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
      const matchesSearch =
        !query ||
        assignment.title.toLowerCase().includes(query) ||
        assignment.description.toLowerCase().includes(query) ||
        getCourseName(assignment.course_id).toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [assignments, searchQuery, statusFilter, courses])

  const totalAssignments = assignments.length
  const waitingCount = assignments.filter((item) => ["not_started", "draft", "overdue"].includes(item.status)).length
  const submittedCount = assignments.filter((item) => ["submitted", "late"].includes(item.status)).length
  const gradedAssignments = assignments.filter((item) => item.grade)
  const averageScore =
    gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((sum, item) => sum + (item.grade?.score || 0), 0) / gradedAssignments.length)
      : 0

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">Мои задания</h1>
            <p className="text-muted-foreground">Просмотр, черновик сақтау және тапсырмаларды курстар бойынша орындау</p>
          </div>
          <Button onClick={() => loadAssignments(selectedCourseId)} variant="outline" disabled={isLoadingAssignments}>
            {isLoadingAssignments ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
            Обновить
          </Button>
        </div>

        <Card className="border-0 p-4 shadow-sm ring-1 ring-border">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Іздеу: тапсырма, курс, сипаттама"
                className="pl-9"
              />
            </div>
            <Select value={selectedCourseId} onValueChange={handleCourseChange} disabled={isLoadingCourses}>
              <SelectTrigger>
                <SelectValue placeholder="Курс таңдаңыз" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все курсы</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="not_started">Не начато</SelectItem>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="submitted">Сдано</SelectItem>
                <SelectItem value="late">Сдано поздно</SelectItem>
                <SelectItem value="overdue">Просрочено</SelectItem>
                <SelectItem value="graded">Оценено</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={FileText} label="Всего заданий" value={totalAssignments} tone="blue" />
          <MetricCard icon={Clock} label="Ожидают работы" value={waitingCount} tone="amber" />
          <MetricCard icon={Send} label="Сданы" value={submittedCount} tone="sky" />
          <MetricCard icon={CheckCircle2} label="Средний балл" value={`${averageScore}%`} tone="emerald" />
        </div>

        {isLoadingAssignments ? (
          <Card className="flex items-center justify-center border-0 py-16 shadow-sm ring-1 ring-border">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        ) : filteredAssignments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center border-0 py-16 text-center shadow-sm ring-1 ring-border">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">Тапсырмалар табылмады</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Таңдалған курс, статус немесе іздеу бойынша нәтиже жоқ. Фильтрді өзгертіп көріңіз.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-0 p-4 shadow-sm ring-1 ring-border transition hover:shadow-md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                        assignment.type === "test" ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"
                      )}
                    >
                      {assignment.type === "test" ? <AlertCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold leading-tight">{assignment.title}</h3>
                        <Badge variant="outline" className={cn("border", statusStyles[assignment.status])}>
                          {statusLabels[assignment.status]}
                        </Badge>
                        <Badge variant="outline">{assignment.type === "test" ? "Тест" : "Эссе"}</Badge>
                      </div>
                      {assignment.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{assignment.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {getCourseName(assignment.course_id)}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            assignment.status === "overdue" && "font-medium text-destructive"
                          )}
                        >
                          <Calendar className="h-4 w-4" />
                          Срок: {formatDate(assignment.due_date)}
                        </span>
                        <span>{assignment.max_score} балл</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:justify-end">
                    {assignment.grade && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">{assignment.grade.score}</div>
                        <div className="text-xs text-muted-foreground">балл</div>
                      </div>
                    )}
                    <Button asChild>
                      <Link href={`/student/assignments/${assignment.id}`}>
                        {assignment.status === "not_started" ? "Начать" : assignment.status === "graded" ? "Результат" : "Открыть"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ElementType
  label: string
  value: number | string
  tone: "blue" | "amber" | "sky" | "emerald"
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }[tone]

  return (
    <Card className="border-0 p-4 shadow-sm ring-1 ring-border">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  )
}
