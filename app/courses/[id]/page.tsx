"use client"

import { use, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, BookOpen, CalendarDays, Edit, Loader2, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteCourse, getCourseById, type Course } from "@/lib/api/courses"
import { useToast } from "@/components/ui/use-toast"

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const courseId = Number(id)
  const router = useRouter()
  const { toast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await getCourseById(courseId)
        setCourse(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Курс не найден")
      } finally {
        setIsLoading(false)
      }
    }

    if (Number.isFinite(courseId)) {
      loadCourse()
    } else {
      setError("Неверный ID курса")
      setIsLoading(false)
    }
  }, [courseId])

  const handleDelete = async () => {
    if (!course) return
    if (!confirm(`Удалить курс "${course.title}"?`)) return

    try {
      await deleteCourse(course.id)
      toast({ title: "Курс удален", description: course.title })
      router.push("/courses")
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось удалить курс",
        variant: "destructive",
      })
    }
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/courses">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{course?.title || "Подробнее о курсе"}</h1>
              <p className="text-muted-foreground">{course?.description || "Данные курса"}</p>
            </div>
          </div>
          {course && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/assignments?course=${course.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Задания
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </Button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && error && (
          <Card className="p-6">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {!isLoading && course && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Курс ID</div>
                    <div className="text-2xl font-bold">{course.id}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Студенты</div>
                <div className="text-2xl font-bold">{course.student_count || course.students?.length || 0}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Задания</div>
                <div className="text-2xl font-bold">{course.assignments_count || course.assignments?.length || 0}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Создан</div>
                <div className="font-semibold">{formatDate(course.created_at)}</div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Задания курса</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(course.assignments?.length || 0) === 0 ? (
                    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                      Задания пока не созданы.
                    </div>
                  ) : (
                    course.assignments?.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(assignment.due_date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{assignment.type === "test" ? "Тест" : "Эссе"}</Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/assignments/${assignment.id}`}>Открыть</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Студенты</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Заполнение</span>
                      <span>{course.student_count || course.students?.length || 0} чел.</span>
                    </div>
                    <Progress value={Math.min(100, (course.student_count || course.students?.length || 0) * 12)} />
                  </div>

                  {(course.students?.length || 0) === 0 ? (
                    <div className="rounded-lg border border-dashed py-8 text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Студентов пока нет.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {course.students?.map((student) => (
                        <div key={student.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{student.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.username}</div>
                            <div className="text-xs text-muted-foreground">ID: {student.id}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
