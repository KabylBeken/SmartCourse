"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Pencil, Trash2, FileText, Users, GraduationCap } from "lucide-react"
import { getAllCourses } from "@/lib/api/courses"
import { getTeacherCourseAssignments } from "@/lib/api/assignments"
import { getAssignmentGrades, createGrade, updateGrade, deleteGrade, type Grade } from "@/lib/api/grades"
import { getAllStudents } from "@/lib/api/students"
import type { Course, Assignment } from "@/lib/types"

interface StudentItem {
  id: number
  fullName: string
}

export default function EvaluationsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("")
  
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [isLoadingGrades, setIsLoadingGrades] = useState(false)
  
  // Диалог оценки
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [gradeForm, setGradeForm] = useState({ student_id: "", score: "", feedback: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()

  // Загрузка курсов и студентов при монтировании
  useEffect(() => {
    loadCourses()
    loadStudents()
  }, [])

  // Загрузка заданий при выборе курса
  useEffect(() => {
    if (selectedCourseId) {
      loadAssignments(parseInt(selectedCourseId))
    } else {
      setAssignments([])
      setSelectedAssignmentId("")
    }
  }, [selectedCourseId])

  // Загрузка оценок при выборе задания
  useEffect(() => {
    if (selectedAssignmentId) {
      loadGrades(parseInt(selectedAssignmentId))
    } else {
      setGrades([])
    }
  }, [selectedAssignmentId])

  const loadCourses = async () => {
    try {
      setIsLoadingCourses(true)
      const data = await getAllCourses()
      setCourses(data)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить курсы",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const loadStudents = async () => {
    try {
      const data = await getAllStudents()
      setStudents(data)
    } catch (error) {
      console.error("Ошибка загрузки студентов:", error)
    }
  }

  const loadAssignments = async (courseId: number) => {
    try {
      setIsLoadingAssignments(true)
      const data = await getTeacherCourseAssignments(courseId)
      setAssignments(data)
      setSelectedAssignmentId("")
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

  const loadGrades = async (assignmentId: number) => {
    try {
      setIsLoadingGrades(true)
      const data = await getAssignmentGrades(assignmentId)
      setGrades(data)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить оценки",
        variant: "destructive",
      })
    } finally {
      setIsLoadingGrades(false)
    }
  }

  const getStudentName = (studentId: number): string => {
    const student = students.find(s => s.id === studentId)
    return student?.fullName || `Студент #${studentId}`
  }

  const openCreateDialog = () => {
    setEditingGrade(null)
    setGradeForm({ student_id: "", score: "", feedback: "" })
    setIsGradeDialogOpen(true)
  }

  const openEditDialog = (grade: Grade) => {
    setEditingGrade(grade)
    setGradeForm({
      student_id: grade.student_id.toString(),
      score: grade.score.toString(),
      feedback: grade.feedback || "",
    })
    setIsGradeDialogOpen(true)
  }

  const handleSubmitGrade = async () => {
    if (!selectedAssignmentId) return
    
    const score = parseFloat(gradeForm.score)
    if (isNaN(score) || score < 0 || score > 100) {
      toast({
        title: "Ошибка",
        description: "Введите корректную оценку (0-100)",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      if (editingGrade) {
        await updateGrade(editingGrade.id, {
          score,
          feedback: gradeForm.feedback,
        })
        toast({
          title: "Успешно",
          description: "Оценка обновлена",
        })
      } else {
        if (!gradeForm.student_id) {
          toast({
            title: "Ошибка",
            description: "Выберите студента",
            variant: "destructive",
          })
          return
        }
        await createGrade(parseInt(selectedAssignmentId), {
          student_id: parseInt(gradeForm.student_id),
          score,
          feedback: gradeForm.feedback,
        })
        toast({
          title: "Успешно",
          description: "Оценка создана",
        })
      }
      
      setIsGradeDialogOpen(false)
      loadGrades(parseInt(selectedAssignmentId))
    } catch (error) {
      toast({
        title: "Ошибка",
        description: editingGrade ? "Не удалось обновить оценку" : "Не удалось создать оценку",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGrade = async (gradeId: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту оценку?")) return
    
    try {
      await deleteGrade(gradeId)
      toast({
        title: "Успешно",
        description: "Оценка удалена",
      })
      if (selectedAssignmentId) {
        loadGrades(parseInt(selectedAssignmentId))
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить оценку",
        variant: "destructive",
      })
    }
  }

  const getGradeBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return "default"
    if (score >= 70) return "secondary"
    if (score >= 50) return "outline"
    return "destructive"
  }

  const selectedAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId)

  return (
    <DashboardLayout userRole="teacher">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Оценивание работ</h1>
        <p className="text-muted-foreground">Просмотр и выставление оценок студентам</p>
      </div>

      {/* Селекторы курса и задания */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Выберите курс
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={isLoadingCourses}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCourses ? "Загрузка..." : "Выберите курс"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Выберите задание
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedAssignmentId} 
              onValueChange={setSelectedAssignmentId} 
              disabled={!selectedCourseId || isLoadingAssignments}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedCourseId 
                    ? "Сначала выберите курс" 
                    : isLoadingAssignments 
                    ? "Загрузка..." 
                    : assignments.length === 0 
                    ? "Нет заданий" 
                    : "Выберите задание"
                } />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id.toString()}>
                    {assignment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Информация о выбранном задании */}
      {selectedAssignment && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{selectedAssignment.title}</CardTitle>
            <CardDescription>{selectedAssignment.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Срок сдачи: {new Date(selectedAssignment.due_date).toLocaleDateString("ru-RU")}</span>
              <span>•</span>
              <span>Оценок: {grades.length}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Таблица оценок */}
      {selectedAssignmentId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Оценки студентов
              </CardTitle>
              <CardDescription>
                Управление оценками по выбранному заданию
              </CardDescription>
            </div>
            <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить оценку
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingGrade ? "Редактировать оценку" : "Новая оценка"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingGrade 
                      ? "Измените оценку и комментарий" 
                      : "Выберите студента и выставьте оценку"
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {!editingGrade && (
                    <div className="grid gap-2">
                      <Label>Студент</Label>
                      <Select 
                        value={gradeForm.student_id} 
                        onValueChange={(value) => setGradeForm(prev => ({ ...prev, student_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите студента" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label>Оценка (0-100)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeForm.score}
                      onChange={(e) => setGradeForm(prev => ({ ...prev, score: e.target.value }))}
                      placeholder="Введите оценку"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Комментарий (необязательно)</Label>
                    <Textarea
                      value={gradeForm.feedback}
                      onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Добавьте комментарий к оценке..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSubmitGrade} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingGrade ? "Сохранить" : "Создать"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingGrades ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : grades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Оценок пока нет</p>
                <p className="text-sm">Нажмите «Добавить оценку» чтобы создать первую</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Студент</TableHead>
                    <TableHead>Оценка</TableHead>
                    <TableHead>Комментарий</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {getStudentName(grade.student_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getGradeBadgeVariant(grade.score)}>
                          {grade.score}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {grade.feedback || "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(grade.created_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(grade)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGrade(grade.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Пустое состояние */}
      {!selectedAssignmentId && !isLoadingCourses && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Выберите курс и задание</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Чтобы просмотреть и выставить оценки, сначала выберите курс и задание из списков выше
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
