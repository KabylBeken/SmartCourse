"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowLeft, CalendarIcon, Save, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { createAssignment } from "@/lib/api/assignments"
import { getAllCourses, type Course } from "@/lib/api/courses"

export default function NewAssignmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [dueDate, setDueDate] = useState<Date>()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_id: "",
  })

  // Загрузка курсов при монтировании
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getAllCourses()
        setCourses(data)
      } catch (err) {
        console.error("Ошибка загрузки курсов:", err)
      } finally {
        setIsLoadingCourses(false)
      }
    }
    loadCourses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.course_id) {
      setError("Выберите курс")
      return
    }

    if (!dueDate) {
      setError("Укажите дату сдачи")
      return
    }

    setIsLoading(true)

    try {
      await createAssignment(parseInt(formData.course_id), {
        title: formData.title,
        description: formData.description,
        due_date: dueDate.toISOString(),
      })

      router.push("/assignments")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания задания")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/assignments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Создать задание</h1>
            <p className="text-muted-foreground">Настройте новое задание для студентов</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Введите данные задания</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  placeholder="например, Эссе об изменении климата"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Краткое описание задания..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Курс</Label>
                  <Select 
                    value={formData.course_id} 
                    onValueChange={(v) => setFormData({ ...formData, course_id: v })}
                    disabled={isLoading || isLoadingCourses}
                  >
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
                </div>

                <div className="space-y-2">
                  <Label>Срок сдачи</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isLoading}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "d MMM yyyy") : "Выберите дату"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Инструкции</CardTitle>
              <CardDescription>Детальные инструкции для студентов (добавляются в описание)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Введите детальные инструкции для студентов..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                disabled={isLoading}
              />
              <Button type="button" variant="outline" className="mt-4 bg-transparent" size="sm" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Генерировать с AI
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" asChild disabled={isLoading}>
              <Link href="/assignments">Отмена</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Создать задание
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
