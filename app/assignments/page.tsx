"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Calendar, Target, FileText, BookOpen, ListChecks, Edit, Trash2, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { getAllCourses, type Course } from "@/lib/api/courses"
import { getTeacherCourseAssignments, deleteAssignment, type Assignment } from "@/lib/api/assignments"
import CreateAssignmentModal from "@/components/assignments/CreateAssignmentModal"

export default function AssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)

  // Загрузка всех заданий со всех курсов преподавателя
  useEffect(() => {
    async function loadData() {
      try {
        // Сначала загружаем курсы
        const coursesData = await getAllCourses()
        setCourses(coursesData)

        // Затем загружаем задания для каждого курса
        const allAssignments: Assignment[] = []
        for (const course of coursesData) {
          try {
            const courseAssignments = await getTeacherCourseAssignments(course.id)
            allAssignments.push(...courseAssignments)
          } catch (err) {
            console.error(`Ошибка загрузки заданий курса ${course.id}:`, err)
          }
        }
        setAssignments(allAssignments)
      } catch (err) {
        console.error("Ошибка загрузки данных:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Удаление задания
  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить это задание?")) return

    try {
      await deleteAssignment(id)
      setAssignments(assignments.filter((a) => a.id !== id))
    } catch (err) {
      console.error("Ошибка удаления:", err)
      alert("Ошибка удаления задания")
    }
  }

  // Получить название курса
  const getCourseName = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId)
    return course?.title || "Неизвестный курс"
  }

  const filteredAssignments = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getDueStatus = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diff = due.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) return { label: "Просрочено", variant: "destructive" as const }
    if (days <= 3) return { label: `${days} дн.`, variant: "secondary" as const }
    return { label: formatDate(dueDate), variant: "outline" as const }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Задания</h1>
            <p className="text-muted-foreground">Управление и отслеживание всех заданий</p>
          </div>
          <div className="flex gap-2 items-center">
            {courses.length > 0 && (
              <select
                className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={selectedCourseId ?? ""}
                onChange={e => setSelectedCourseId(Number(e.target.value))}
              >
                <option value="" disabled>Курс таңдаңыз</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
            <Button onClick={() => { if (!selectedCourseId) { alert("Алдымен курс таңдаңыз"); return; } setShowModal(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Создать задание
            </Button>
          </div>
        </div>

        {showModal && selectedCourseId && (
          <CreateAssignmentModal
            courseId={selectedCourseId}
            onClose={() => setShowModal(false)}
            onSuccess={() => { setShowModal(false); window.location.reload() }}
          />
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск заданий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>        {/* Assignments Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => {
            const dueStatus = getDueStatus(assignment.due_date)
            return (
              <Card key={assignment.id} className="flex flex-col p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {assignment.type === "test"
                        ? <ListChecks className="h-5 w-5 text-indigo-600" />
                        : <BookOpen className="h-5 w-5 text-primary" />}
                    </div>
                    <Badge variant="outline" className={assignment.type === "test" ? "text-indigo-600 border-indigo-300" : "text-emerald-600 border-emerald-300"}>
                      {assignment.type === "test" ? "Тест" : "Эссе"}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/assignments/${assignment.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотр
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/assignments/${assignment.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Редактировать
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/criteria?assignment=${assignment.id}`}>
                          <Target className="mr-2 h-4 w-4" />
                          Критерии
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="mb-1 font-semibold">{assignment.title}</h3>
                <p className="mb-2 text-xs text-muted-foreground">{getCourseName(assignment.course_id)}</p>
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{assignment.description}</p>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <Badge variant={dueStatus.variant}>{dueStatus.label}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/assignments/${assignment.id}`}>Просмотр</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/evaluations?assignment=${assignment.id}`}>Оценить</Link>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredAssignments.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Задания не найдены</h3>
            <p className="mb-6 text-muted-foreground">
              {searchQuery ? "Попробуйте другой поисковый запрос" : "Создайте своё первое задание"}
            </p>
            <Button asChild>
              <Link href="/assignments/new">
                <Plus className="mr-2 h-4 w-4" />
                Создать задание
              </Link>
            </Button>
          </Card>
        )}
        </>
        )}
      </div>
    </DashboardLayout>
  )
}
