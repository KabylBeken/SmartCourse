"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Star,
  MessageSquare,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react"
import { getStudentGrades, type Grade } from "@/lib/api/grades"
import { getStudentCourses, type Course } from "@/lib/api/courses"
import { generateAIFeedback, type AIFeedbackResponse } from "@/lib/api/ai"

interface GradeWithDetails extends Grade {
  assignment_title?: string
  course_title?: string
  aiFeedback?: AIFeedbackResponse
  isLoadingAI?: boolean
}

function getGradeColor(score: number): string {
  if (score >= 90) return "text-green-600"
  if (score >= 75) return "text-blue-600"
  if (score >= 60) return "text-yellow-600"
  return "text-red-600"
}

function getGradeBadge(score: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (score >= 90) return { label: "Отлично", variant: "default" }
  if (score >= 75) return { label: "Хорошо", variant: "secondary" }
  if (score >= 60) return { label: "Удовлетворительно", variant: "outline" }
  return { label: "Нужно улучшить", variant: "destructive" }
}

function getTrendIcon(current: number, previous: number) {
  if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-gray-500" />
}

export default function StudentFeedbackPage() {
  const [grades, setGrades] = useState<GradeWithDetails[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Загрузка данных
  useEffect(() => {
    async function loadData() {
      try {
        const gradesData = await getStudentGrades()
        setGrades(gradesData)
      } catch (err) {
        console.error("Ошибка загрузки оценок:", err)
      }
      
      try {
        const coursesData = await getStudentCourses()
        setCourses(coursesData)
      } catch (err) {
        console.error("Ошибка загрузки курсов:", err)
      }
      
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Генерация AI фидбэка для оценки
  const handleGenerateAIFeedback = async (gradeId: number) => {
    const grade = grades.find(g => g.id === gradeId)
    if (!grade) return

    setGrades(prev => prev.map(g => 
      g.id === gradeId ? { ...g, isLoadingAI: true } : g
    ))

    try {
      const aiFeedback = await generateAIFeedback({
        assignmentTitle: grade.assignment_title || `Задание #${grade.assignment_id}`,
        score: grade.score,
        maxScore: 100,
        existingFeedback: grade.feedback
      })

      setGrades(prev => prev.map(g => 
        g.id === gradeId ? { ...g, aiFeedback, isLoadingAI: false } : g
      ))
    } catch (err) {
      console.error("Ошибка AI:", err)
      setGrades(prev => prev.map(g => 
        g.id === gradeId ? { ...g, isLoadingAI: false } : g
      ))
    }
  }

  // Статистика
  const stats = {
    totalGrades: grades.length,
    averageScore: grades.length > 0 
      ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) 
      : 0,
    bestScore: grades.length > 0 ? Math.max(...grades.map(g => g.score)) : 0,
    completedAssignments: grades.filter(g => g.score > 0).length
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мои результаты</h1>
          <p className="text-muted-foreground">
            Оценки и обратная связь по вашим заданиям
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getGradeColor(stats.averageScore)}`}>
                {stats.averageScore}%
              </div>
              <Progress value={stats.averageScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Лучший результат</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.bestScore}%</div>
              <p className="text-xs text-muted-foreground">Максимальная оценка</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Выполнено заданий</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAssignments}</div>
              <p className="text-xs text-muted-foreground">Всего оценок: {stats.totalGrades}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активных курсов</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground">Записаны на курсы</p>
            </CardContent>
          </Card>
        </div>

        {/* Список оценок */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Оценки и фидбэк
            </CardTitle>
            <CardDescription>
              Детальная информация по каждому заданию с AI-анализом
            </CardDescription>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Пока нет оценок</h3>
                <p className="text-muted-foreground">
                  Ваши оценки появятся здесь после проверки заданий
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {grades.map((grade, index) => {
                  const badgeInfo = getGradeBadge(grade.score)
                  const prevGrade = grades[index + 1]
                  
                  return (
                    <Card key={grade.id} className="border-l-4" style={{ 
                      borderLeftColor: grade.score >= 75 ? '#22c55e' : grade.score >= 60 ? '#eab308' : '#ef4444' 
                    }}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                Задание #{grade.assignment_id}
                              </h4>
                              <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                              {prevGrade && getTrendIcon(grade.score, prevGrade.score)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(grade.created_at).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${getGradeColor(grade.score)}`}>
                              {grade.score}
                            </div>
                            <p className="text-sm text-muted-foreground">из 100</p>
                          </div>
                        </div>

                        {/* Фидбэк преподавателя */}
                        {grade.feedback && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Комментарий преподавателя:</p>
                            <p className="text-sm text-muted-foreground">{grade.feedback}</p>
                          </div>
                        )}

                        {/* AI Фидбэк */}
                        {grade.aiFeedback ? (
                          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                AI-анализ результата
                              </span>
                            </div>
                            <p className="text-sm mb-3">{grade.aiFeedback.feedback}</p>
                            
                            {grade.aiFeedback.suggestions.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Рекомендации:</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {grade.aiFeedback.suggestions.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <p className="text-sm italic text-purple-600 dark:text-purple-400">
                              {grade.aiFeedback.encouragement}
                            </p>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => handleGenerateAIFeedback(grade.id)}
                            disabled={grade.isLoadingAI}
                          >
                            {grade.isLoadingAI ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Генерация...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Получить AI-анализ
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
