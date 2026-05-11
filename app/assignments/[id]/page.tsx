"use client"

import { use, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Edit, Target, FileText, Loader2, BookOpen, ListChecks } from "lucide-react"
import Link from "next/link"
import { getCourseById } from "@/lib/api/courses"
import { getAssignment, type Assignment } from "@/lib/api/assignments"

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const assignmentId = Number(id)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [courseTitle, setCourseTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadAssignment() {
      try {
        const data = await getAssignment(assignmentId)
        setAssignment(data)

        try {
          const course = await getCourseById(data.course_id)
          setCourseTitle(course.title)
        } catch {
          setCourseTitle(`Курс #${data.course_id}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Задание не найдено")
      } finally {
        setIsLoading(false)
      }
    }

    if (Number.isFinite(assignmentId)) {
      loadAssignment()
    } else {
      setError("Неверный ID задания")
      setIsLoading(false)
    }
  }, [assignmentId])

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/assignments">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{assignment?.title || "Просмотр задания"}</h1>
              <p className="text-muted-foreground">{courseTitle || "Данные задания"}</p>
            </div>
          </div>

          {assignment && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/criteria?assignment=${assignment.id}`}>
                  <Target className="mr-2 h-4 w-4" />
                  Критерии
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/assignments/${assignment.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/evaluations?assignment=${assignment.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Оценить
                </Link>
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

        {!isLoading && assignment && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {assignment.type === "test" ? (
                      <ListChecks className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Тип</div>
                    <div className="font-semibold">{assignment.type === "test" ? "Тест" : "Эссе"}</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Максимальный балл</div>
                <div className="text-2xl font-bold">{assignment.max_score}</div>
              </Card>

              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Критерии</div>
                <div className="text-2xl font-bold">{assignment.criteria?.length || 0}</div>
              </Card>

              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Вопросы</div>
                <div className="text-2xl font-bold">{assignment.questions?.length || 0}</div>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="criteria">Критерии</TabsTrigger>
                <TabsTrigger value="questions">Тест</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Детали задания</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-medium">Описание</h4>
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {assignment.description || "Описание не указано"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Срок: {formatDate(assignment.due_date)}</span>
                      </div>
                      <Badge variant="outline">{courseTitle || `Курс #${assignment.course_id}`}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="criteria">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Критерии оценивания</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/criteria?assignment=${assignment.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Изменить
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(assignment.criteria || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Критерии пока не добавлены.</p>
                    ) : (
                      assignment.criteria?.map((criterion, index) => (
                        <div key={`${criterion.name}-${index}`} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-medium">{criterion.name}</div>
                              <div className="text-sm text-muted-foreground">{criterion.description}</div>
                            </div>
                            <Badge variant="secondary">{criterion.maxPoints || criterion.max_score || 0} балл</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="questions">
                <Card>
                  <CardHeader>
                    <CardTitle>Вопросы теста</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(assignment.questions || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Для этого задания вопросы не добавлены.</p>
                    ) : (
                      assignment.questions?.map((question, index) => (
                        <div key={question.id || index} className="space-y-3 rounded-lg border p-4">
                          <div className="font-medium">
                            {index + 1}. {question.question}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`rounded-md border px-3 py-2 text-sm ${
                                  question.correctIndex === optionIndex ? "border-green-400 bg-green-50" : ""
                                }`}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
