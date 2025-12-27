"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, ArrowRight, Loader2, GraduationCap, BookOpen } from "lucide-react"
import Link from "next/link"
import { getStudentCourses, type Course } from "@/lib/api/courses"
import { getStudentCourseAssignments, type Assignment } from "@/lib/api/assignments"
import { getStudentGrades, type Grade } from "@/lib/api/grades"

interface AssignmentWithGrade extends Assignment {
  grade?: Grade
  status: "graded" | "pending" | "not_started"
}

export default function StudentAssignmentsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithGrade[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedCourseId && selectedCourseId !== "all") {
      loadCourseAssignments(parseInt(selectedCourseId))
    } else if (selectedCourseId === "all" && courses.length > 0) {
      loadAllAssignments()
    }
  }, [selectedCourseId, courses])

  const loadInitialData = async () => {
    try {
      setIsLoadingCourses(true)
      const [coursesData, gradesData] = await Promise.all([
        getStudentCourses(),
        getStudentGrades()
      ])
      setCourses(coursesData)
      setGrades(gradesData)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const loadAllAssignments = async () => {
    try {
      setIsLoadingAssignments(true)
      const allAssignments: AssignmentWithGrade[] = []
      
      for (const course of courses) {
        try {
          const courseAssignments = await getStudentCourseAssignments(course.id)
          const assignmentsWithStatus = courseAssignments.map(a => enrichAssignment(a))
          allAssignments.push(...assignmentsWithStatus)
        } catch (error) {
          console.error(`Ошибка загрузки заданий курса ${course.id}:`, error)
        }
      }
      
      // Сортируем по дате сдачи
      allAssignments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      setAssignments(allAssignments)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить задания",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const loadCourseAssignments = async (courseId: number) => {
    try {
      setIsLoadingAssignments(true)
      const data = await getStudentCourseAssignments(courseId)
      const assignmentsWithStatus = data.map(a => enrichAssignment(a))
      setAssignments(assignmentsWithStatus)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить задания курса",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const enrichAssignment = (assignment: Assignment): AssignmentWithGrade => {
    const grade = grades.find(g => g.assignment_id === assignment.id)
    let status: "graded" | "pending" | "not_started" = "not_started"
    
    if (grade) {
      status = "graded"
    } else if (new Date(assignment.due_date) < new Date()) {
      status = "pending" // Просрочено, но не сдано
    }
    
    return { ...assignment, grade, status }
  }

  const getCourseName = (courseId: number): string => {
    const course = courses.find(c => c.id === courseId)
    return course?.title || `Курс #${courseId}`
  }

  const getStatusBadge = (assignment: AssignmentWithGrade) => {
    switch (assignment.status) {
      case "graded":
        return <Badge className="bg-green-500">Оценено</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Просрочено</Badge>
      default:
        return <Badge variant="secondary">Не начато</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  // Статистика
  const totalAssignments = assignments.length
  const gradedCount = assignments.filter(a => a.status === "graded").length
  const pendingCount = assignments.filter(a => a.status === "pending" || a.status === "not_started").length
  const avgScore = gradedCount > 0 
    ? Math.round(assignments.filter(a => a.grade).reduce((sum, a) => sum + (a.grade?.score || 0), 0) / gradedCount)
    : 0

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Мои задания</h1>
          <p className="text-muted-foreground">Просмотр и выполнение заданий по курсам</p>
        </div>

        {/* Выбор курса */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Фильтр по курсу
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={isLoadingCourses}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder={isLoadingCourses ? "Загрузка..." : "Выберите курс"} />
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
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalAssignments}</div>
                <div className="text-sm text-muted-foreground">Всего заданий</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Ожидают сдачи</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{gradedCount}</div>
                <div className="text-sm text-muted-foreground">Оценено</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <AlertCircle className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{avgScore}%</div>
                <div className="text-sm text-muted-foreground">Средний балл</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Assignments List */}
        {isLoadingAssignments ? (
          <Card className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        ) : assignments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Заданий пока нет</h3>
            <p className="text-muted-foreground">
              {selectedCourseId === "all" 
                ? "У вас пока нет заданий по курсам" 
                : "В этом курсе пока нет заданий"
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="font-semibold">{assignment.title}</h3>
                      {getStatusBadge(assignment)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {assignment.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        {getCourseName(assignment.course_id)}
                      </span>
                      <span className={`flex items-center gap-1 ${isOverdue(assignment.due_date) && assignment.status !== "graded" ? "text-destructive" : ""}`}>
                        <Calendar className="h-4 w-4" />
                        Срок: {formatDate(assignment.due_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {assignment.grade && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {assignment.grade.score}
                        </div>
                        <div className="text-sm text-muted-foreground">баллов</div>
                      </div>
                    )}
                    <Button asChild>
                      {assignment.status === "graded" ? (
                        <Link href={`/student/feedback?assignment=${assignment.id}`}>
                          Отзыв <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      ) : (
                        <Link href={`/student/assignments/${assignment.id}`}>
                          {assignment.status === "not_started" ? "Начать" : "Продолжить"}
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      )}
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
