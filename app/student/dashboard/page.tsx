"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, TrendingUp, Award, Clock, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

const upcomingAssignments = [
  { id: 1, title: "Анализ исторических событий", course: "Всемирная история", due: "2 дня", priority: "high" },
  { id: 2, title: "Лабораторный отчёт: Химические реакции", course: "Химия", due: "5 дней", priority: "medium" },
  { id: 3, title: "Эссе по литературе", course: "Русский язык", due: "1 неделя", priority: "low" },
]

const recentGrades = [
  { id: 1, title: "Эссе об изменении климата", course: "Экология", score: 92, max: 100 },
  { id: 2, title: "Контрольная по математике", course: "Алгебра", score: 45, max: 50 },
  { id: 3, title: "Научный проект", course: "Физика", score: 88, max: 100 },
]

export default function StudentDashboardPage() {
  const { user } = useAuth()

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Добро пожаловать{user?.username ? `, ${user.username}` : ""}!</h1>
          <p className="text-muted-foreground">Вот обзор вашего академического прогресса</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Активных курсов</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Ожидают сдачи</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">88%</div>
                <div className="text-sm text-muted-foreground">Средний балл</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <Award className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">Выполнено</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Предстоящие задания</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/assignments">
                  Все задания <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-sm text-muted-foreground">{assignment.course}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          assignment.priority === "high"
                            ? "destructive"
                            : assignment.priority === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        {assignment.due}
                      </Badge>
                      <Button size="sm" asChild>
                        <Link href={`/student/assignments/${assignment.id}`}>Начать</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Grades */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Последние оценки</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/feedback">
                  Все оценки <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{grade.title}</div>
                        <div className="text-sm text-muted-foreground">{grade.course}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {grade.score}/{grade.max}
                      </div>
                      <Progress value={(grade.score / grade.max) * 100} className="mt-1 h-1.5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Прогресс по курсам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Экология", progress: 75 },
                { name: "Всемирная история", progress: 60 },
                { name: "Химия", progress: 90 },
                { name: "Русская литература", progress: 45 },
              ].map((course) => (
                <div key={course.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{course.name}</span>
                    <span className="text-muted-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
