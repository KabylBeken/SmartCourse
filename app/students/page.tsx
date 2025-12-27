"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Search, MoreHorizontal, Plus, Pencil, Trash2, Users, Loader2, GraduationCap, Calendar } from "lucide-react"
import { getAllStudents, createStudent, updateStudent, deleteStudent } from "@/lib/api/students"

interface Student {
  id: number
  fullName: string
  birthdate: string
  age: number
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // Диалог создания/редактирования
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({ full_name: "", birthdate: "", age: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setIsLoading(true)
      const data = await getAllStudents()
      setStudents(data)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список студентов",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreateDialog = () => {
    setEditingStudent(null)
    setFormData({ full_name: "", birthdate: "", age: "" })
    setIsDialogOpen(true)
  }

  const openEditDialog = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      full_name: student.fullName,
      birthdate: student.birthdate || "",
      age: student.age?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ФИО студента",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const data = {
        full_name: formData.full_name.trim(),
        birthdate: formData.birthdate || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
      }

      if (editingStudent) {
        await updateStudent(editingStudent.id, data)
        toast({
          title: "Успешно",
          description: "Данные студента обновлены",
        })
      } else {
        await createStudent(data)
        toast({
          title: "Успешно",
          description: "Студент добавлен",
        })
      }
      
      setIsDialogOpen(false)
      loadStudents()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: editingStudent ? "Не удалось обновить студента" : "Не удалось создать студента",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (student: Student) => {
    if (!confirm(`Вы уверены, что хотите удалить студента "${student.fullName}"?`)) return
    
    try {
      await deleteStudent(student.id)
      toast({
        title: "Успешно",
        description: "Студент удалён",
      })
      loadStudents()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить студента",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Студенты</h1>
            <p className="text-muted-foreground">Управление списком студентов</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить студента
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? "Редактировать студента" : "Новый студент"}
                </DialogTitle>
                <DialogDescription>
                  {editingStudent 
                    ? "Измените данные студента" 
                    : "Заполните информацию о новом студенте"
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">ФИО *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="birthdate">Дата рождения</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthdate: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="age">Возраст</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="18"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStudent ? "Сохранить" : "Создать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{students.length}</div>
                <div className="text-sm text-muted-foreground">Всего студентов</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <GraduationCap className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {students.filter(s => s.age && s.age < 25).length}
                </div>
                <div className="text-sm text-muted-foreground">До 25 лет</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {students.filter(s => s.birthdate).length}
                </div>
                <div className="text-sm text-muted-foreground">С датой рождения</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск студентов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список студентов</CardTitle>
            <CardDescription>
              {filteredStudents.length} из {students.length} студентов
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Студентов пока нет</h3>
                <p className="text-muted-foreground mb-4">Добавьте первого студента</p>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить студента
                </Button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Ничего не найдено</h3>
                <p className="text-muted-foreground">Попробуйте изменить запрос</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Студент</TableHead>
                    <TableHead>Дата рождения</TableHead>
                    <TableHead>Возраст</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.fullName}</div>
                            <div className="text-sm text-muted-foreground">ID: {student.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.birthdate 
                          ? new Date(student.birthdate).toLocaleDateString("ru-RU")
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell>
                        {student.age 
                          ? <Badge variant="secondary">{student.age} лет</Badge>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(student)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(student)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
