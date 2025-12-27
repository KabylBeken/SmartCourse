"use client"

import { Suspense, useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Users, BookOpen, MoreHorizontal, Settings, Loader2, UserPlus, Trash2, GraduationCap } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getAllCourses, createCourse, addStudentToCourse, removeStudentFromCourse, deleteCourse, type Course } from "@/lib/api/courses"
import { getAllStudents, type Student } from "@/lib/api/students"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface CourseWithStudents extends Course {
  students?: Array<{ id: number; username: string }>
}

function CoursesContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<CourseWithStudents[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
  })
  
  // Диалог управления студентами
  const [selectedCourse, setSelectedCourse] = useState<CourseWithStudents | null>(null)
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [isAddingStudent, setIsAddingStudent] = useState(false)

  // Загрузка курсов и студентов
  useEffect(() => {
    async function loadData() {
      try {
        // Загружаем курсы
        const coursesData = await getAllCourses()
        setCourses(coursesData)
      } catch (err) {
        console.error("Ошибка загрузки курсов:", err)
      }
      
      try {
        // Загружаем студентов (может не работать, если таблица не создана)
        const studentsData = await getAllStudents()
        setStudents(studentsData)
      } catch (err) {
        console.error("Ошибка загрузки студентов:", err)
        // Не блокируем работу со курсами если студенты не загрузились
      }
      
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Создание курса
  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      setError("Введите название курса")
      return
    }

    if (!user?.id) {
      setError("Пользователь не авторизован")
      return
    }

    setError("")
    setIsCreating(true)

    try {
      const created = await createCourse({
        title: newCourse.title,
        description: newCourse.description,
        teacher_id: user.id,
      })
      setCourses([...courses, created])
      setNewCourse({ title: "", description: "" })
      setIsCreateOpen(false)
      toast({
        title: "Успешно",
        description: "Курс создан",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания курса")
    } finally {
      setIsCreating(false)
    }
  }

  // Добавление студента на курс
  const handleAddStudent = async () => {
    if (!selectedCourse || !selectedStudentId) return
    
    try {
      setIsAddingStudent(true)
      await addStudentToCourse(selectedCourse.id, parseInt(selectedStudentId))
      
      // Обновляем список студентов курса локально
      const student = students.find(s => s.id === parseInt(selectedStudentId))
      if (student) {
        const updatedCourses = courses.map(c => {
          if (c.id === selectedCourse.id) {
            return {
              ...c,
              students: [...(c.students || []), { id: student.id, username: student.fullName }],
              student_count: (c.student_count || 0) + 1
            }
          }
          return c
        })
        setCourses(updatedCourses)
        setSelectedCourse(updatedCourses.find(c => c.id === selectedCourse.id) || null)
      }
      
      setSelectedStudentId("")
      toast({
        title: "Успешно",
        description: "Студент добавлен на курс",
      })
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось добавить студента",
        variant: "destructive",
      })
    } finally {
      setIsAddingStudent(false)
    }
  }

  // Удаление студента с курса
  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedCourse) return
    if (!confirm("Удалить студента с курса?")) return
    
    try {
      await removeStudentFromCourse(selectedCourse.id, studentId)
      
      // Обновляем локально
      const updatedCourses = courses.map(c => {
        if (c.id === selectedCourse.id) {
          return {
            ...c,
            students: (c.students || []).filter(s => s.id !== studentId),
            student_count: Math.max((c.student_count || 1) - 1, 0)
          }
        }
        return c
      })
      setCourses(updatedCourses)
      setSelectedCourse(updatedCourses.find(c => c.id === selectedCourse.id) || null)
      
      toast({
        title: "Успешно",
        description: "Студент удалён с курса",
      })
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить студента",
        variant: "destructive",
      })
    }
  }

  // Удаление курса
  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот курс?")) return
    
    try {
      await deleteCourse(courseId)
      setCourses(courses.filter(c => c.id !== courseId))
      toast({
        title: "Успешно",
        description: "Курс удалён",
      })
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить курс",
        variant: "destructive",
      })
    }
  }

  // Открыть диалог управления студентами
  const openStudentsDialog = (course: CourseWithStudents) => {
    setSelectedCourse(course)
    setIsStudentsDialogOpen(true)
    setSelectedStudentId("")
  }

  // Получить студентов, которых ещё нет на курсе
  const getAvailableStudents = () => {
    if (!selectedCourse) return students
    const courseStudentIds = (selectedCourse.students || []).map(s => s.id)
    return students.filter(s => !courseStudentIds.includes(s.id))
  }

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header */}
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
                <DialogTitle>Создать новый курс</DialogTitle>
                <DialogDescription>Добавьте новый курс в вашу программу</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="course-title">Название курса</Label>
                  <Input
                    id="course-title"
                    placeholder="например, Введение в биологию"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-desc">Описание</Label>
                  <Textarea
                    id="course-desc"
                    placeholder="Краткое описание курса..."
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                  Отмена
                </Button>
                <Button onClick={handleCreateCourse} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    "Создать курс"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{courses.length}</div>
                <div className="text-sm text-muted-foreground">Всего курсов</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {courses.reduce((sum, c) => sum + (c.student_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Всего студентов</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <GraduationCap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{students.length}</div>
                <div className="text-sm text-muted-foreground">Доступно студентов</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск курсов..."
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
          <>
            {/* Courses Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
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
                          <Link href={`/courses/${course.id}`}>Подробнее</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить курс
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <CardTitle className="mb-2">{course.title}</CardTitle>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {course.student_count || 0} студентов
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openStudentsDialog(course)}>
                        <UserPlus className="mr-1 h-3 w-3" />
                        Добавить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Курсы не найдены</h3>
                <p className="mb-6 text-muted-foreground">
                  {searchQuery ? "Попробуйте другой поисковый запрос" : "Создайте свой первый курс"}
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать курс
                </Button>
              </Card>
            )}
          </>
        )}

        {/* Диалог управления студентами */}
        <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Управление студентами</DialogTitle>
              <DialogDescription>
                Курс: {selectedCourse?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Добавление студента */}
              <Card className="p-4">
                <div className="flex gap-2">
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите студента для добавления" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStudents().map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddStudent} 
                    disabled={!selectedStudentId || isAddingStudent}
                  >
                    {isAddingStudent ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Добавить
                      </>
                    )}
                  </Button>
                </div>
                {getAvailableStudents().length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Все студенты уже добавлены на курс
                  </p>
                )}
              </Card>

              {/* Список студентов на курсе */}
              <div>
                <h4 className="mb-2 font-medium">Студенты на курсе ({selectedCourse?.students?.length || 0})</h4>
                {(selectedCourse?.students?.length || 0) === 0 ? (
                  <Card className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">На курсе пока нет студентов</p>
                  </Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Студент</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCourse?.students?.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {student.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{student.username}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveStudent(student.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStudentsDialogOpen(false)}>
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
