"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  CalendarDays,
  Eye,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import {
  addStudentToCourse,
  createCourse,
  deleteCourse,
  getAllCourses,
  removeStudentFromCourse,
  type Course,
} from "@/lib/api/courses"
import { getAllStudents, type Student } from "@/lib/api/students"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/components/ui/use-toast"

function getStudentName(student: Student) {
  return student.fullName || student.username || `Student #${student.id}`
}

function CoursesContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isStudentsOpen, setIsStudentsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  const [error, setError] = useState("")
  const [newCourse, setNewCourse] = useState({ title: "", description: "" })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [coursesData, studentsData] = await Promise.all([
        getAllCourses(),
        getAllStudents().catch(() => [] as Student[]),
      ])
      setCourses(coursesData)
      setStudents(studentsData)
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось загрузить курсы",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totals = useMemo(() => {
    const studentIds = new Set<number>()
    courses.forEach((course) => course.students?.forEach((student) => studentIds.add(student.id)))

    return {
      courses: courses.length,
      students: studentIds.size,
      availableStudents: students.length,
      assignments: courses.reduce((sum, course) => sum + (course.assignments_count || course.assignments?.length || 0), 0),
    }
  }, [courses, students])

  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.toLowerCase()
    return course.title.toLowerCase().includes(query) || (course.description || "").toLowerCase().includes(query)
  })

  const availableStudents = useMemo(() => {
    if (!selectedCourse) return students
    const enrolledIds = new Set((selectedCourse.students || []).map((student) => student.id))
    return students.filter((student) => !enrolledIds.has(student.id))
  }, [selectedCourse, students])

  const syncCourse = (updated: Course) => {
    setCourses((current) => current.map((course) => (course.id === updated.id ? updated : course)))
    setSelectedCourse(updated)
  }

  const openStudentsDialog = (course: Course) => {
    setSelectedCourse(course)
    setSelectedStudentId("")
    setIsStudentsOpen(true)
  }

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      setError("Введите название курса")
      return
    }

    setError("")
    setIsCreating(true)
    try {
      const created = await createCourse({
        title: newCourse.title.trim(),
        description: newCourse.description.trim(),
        teacher_id: user?.id,
      })
      setCourses((current) => [created, ...current])
      setNewCourse({ title: "", description: "" })
      setIsCreateOpen(false)
      toast({ title: "Курс создан", description: "Новый курс добавлен в список." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания курса")
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddStudent = async () => {
    if (!selectedCourse || !selectedStudentId) return

    setIsSavingStudent(true)
    try {
      const updated = await addStudentToCourse(selectedCourse.id, Number(selectedStudentId))
      syncCourse(updated)
      setSelectedStudentId("")
      toast({ title: "Студент добавлен", description: `${updated.title}: список обновлен.` })
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось добавить студента",
        variant: "destructive",
      })
    } finally {
      setIsSavingStudent(false)
    }
  }

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedCourse) return
    if (!confirm("Удалить студента с курса?")) return

    setIsSavingStudent(true)
    try {
      const updated = await removeStudentFromCourse(selectedCourse.id, studentId)
      syncCourse(updated)
      toast({ title: "Студент удален", description: `${updated.title}: список обновлен.` })
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось удалить студента",
        variant: "destructive",
      })
    } finally {
      setIsSavingStudent(false)
    }
  }

  const handleDeleteCourse = async (course: Course) => {
    const studentsCount = course.student_count || course.students?.length || 0
    const assignmentsCount = course.assignments_count || course.assignments?.length || 0
    const message = `Удалить курс "${course.title}"? Студентов: ${studentsCount}, заданий: ${assignmentsCount}.`
    if (!confirm(message)) return

    try {
      await deleteCourse(course.id)
      setCourses((current) => current.filter((item) => item.id !== course.id))
      if (selectedCourse?.id === course.id) {
        setSelectedCourse(null)
        setIsStudentsOpen(false)
      }
      toast({ title: "Курс удален", description: course.title })
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось удалить курс",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Курсы</h1>
            <p className="text-muted-foreground">Управление курсами и списками студентов</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Создать курс
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать курс</DialogTitle>
                <DialogDescription>Добавьте название и короткое описание для студентов.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="course-title">Название</Label>
                  <Input
                    id="course-title"
                    placeholder="Например, Full Stack Developer"
                    value={newCourse.title}
                    onChange={(event) => setNewCourse({ ...newCourse, title: event.target.value })}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-description">Описание</Label>
                  <Textarea
                    id="course-description"
                    placeholder="Кратко опишите цель курса"
                    value={newCourse.description}
                    onChange={(event) => setNewCourse({ ...newCourse, description: event.target.value })}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                  Отмена
                </Button>
                <Button onClick={handleCreateCourse} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totals.courses}</div>
                <div className="text-sm text-muted-foreground">Курсов</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totals.students}</div>
                <div className="text-sm text-muted-foreground">На курсах</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                <GraduationCap className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totals.availableStudents}</div>
                <div className="text-sm text-muted-foreground">Доступно</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <CalendarDays className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totals.assignments}</div>
                <div className="text-sm text-muted-foreground">Заданий</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const studentCount = course.student_count || course.students?.length || 0
                const assignmentCount = course.assignments_count || course.assignments?.length || 0
                const fill = Math.min(100, studentCount * 12)

                return (
                  <Card key={course.id} className="flex min-h-[230px] flex-col transition-colors hover:border-primary/40">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openStudentsDialog(course)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Управление студентами
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/courses/${course.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Подробнее
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCourse(course)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить курс
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      <div>
                        <CardTitle className="mb-1 line-clamp-1">{course.title}</CardTitle>
                        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                          {course.description || "Описание не указано"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-md border px-3 py-2">
                          <div className="text-muted-foreground">Студенты</div>
                          <div className="font-semibold">{studentCount}</div>
                        </div>
                        <div className="rounded-md border px-3 py-2">
                          <div className="text-muted-foreground">Задания</div>
                          <div className="font-semibold">{assignmentCount}</div>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Заполнение группы</span>
                          <span>{studentCount} чел.</span>
                        </div>
                        <Progress value={fill} className="h-2" />
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => openStudentsDialog(course)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Студенты
                        </Button>
                        <Button size="sm" className="flex-1" asChild>
                          <Link href={`/courses/${course.id}`}>Подробнее</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredCourses.length === 0 && (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Курсы не найдены</h3>
                <p className="mb-6 text-muted-foreground">
                  {searchQuery ? "Попробуйте другой поисковый запрос" : "Создайте первый курс"}
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать курс
                </Button>
              </Card>
            )}
          </>
        )}

        <Dialog open={isStudentsOpen} onOpenChange={setIsStudentsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Управление студентами</DialogTitle>
              <DialogDescription>{selectedCourse?.title}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Добавить студента</div>
                    <div className="text-sm text-muted-foreground">В списке показаны только студенты, которых еще нет на курсе.</div>
                  </div>
                  <Badge variant="outline">{availableStudents.length} доступно</Badge>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите студента" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {getStudentName(student)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddStudent} disabled={!selectedStudentId || isSavingStudent}>
                    {isSavingStudent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Добавить
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">Студенты курса</h4>
                  <Badge>{selectedCourse?.students?.length || 0}</Badge>
                </div>

                {(selectedCourse?.students?.length || 0) === 0 ? (
                  <div className="rounded-lg border border-dashed py-10 text-center">
                    <Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">На курсе пока нет студентов.</p>
                  </div>
                ) : (
                  <div className="max-h-[330px] space-y-2 overflow-y-auto pr-1">
                    {selectedCourse?.students?.map((student) => (
                      <div key={student.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{student.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.username}</div>
                            <div className="text-xs text-muted-foreground">ID: {student.id}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStudent(student.id)}
                          disabled={isSavingStudent}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStudentsOpen(false)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default function CoursesPage() {
  return (
    <Suspense fallback={null}>
      <CoursesContent />
    </Suspense>
  )
}
