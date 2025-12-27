"use client"

import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Target, FileCheck, BookOpen, Users, TrendingUp, Clock, ArrowRight, Plus, Sparkles } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

const stats = [
  { label: "Активных промптов", value: "12", icon: Brain, change: "+3 за неделю", color: "text-purple-500" },
  { label: "Заданий", value: "24", icon: BookOpen, change: "+5 за месяц", color: "text-blue-500" },
  { label: "Ожидают проверки", value: "18", icon: FileCheck, change: "8 срочных", color: "text-orange-500" },
  { label: "Студентов", value: "156", icon: Users, change: "+12 новых", color: "text-green-500" },
]

const recentActivity = [
  { type: "submission", student: "Алексей Иванов", assignment: "Эссе по экологии", time: "2 часа назад" },
  { type: "graded", student: "Мария Петрова", assignment: "Исследовательская работа", time: "4 часа назад" },
  { type: "submission", student: "Дмитрий Смирнов", assignment: "Лабораторный отчёт", time: "5 часов назад" },
  { type: "created", item: "Новый шаблон промпта", time: "Вчера" },
]

const pendingSubmissions = [
  { id: 1, student: "Алексей Иванов", assignment: "Эссе по экологии", submitted: "2ч назад", score: null },
  { id: 2, student: "Светлана Козлова", assignment: "Анализ истории", submitted: "4ч назад", score: null },
  { id: 3, student: "Михаил Сидоров", assignment: "Задачи по математике", submitted: "6ч назад", score: 85 },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Панель управления</h1>
            <p className="text-muted-foreground">
              Добро пожаловать{user?.username ? `, ${user.username}` : ""}! Вот обзор ваших курсов.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/prompts">
                <Brain className="mr-2 h-4 w-4" />
                Промпты
              </Link>
            </Button>
            <Button asChild>
              <Link href="/assignments/new">
                <Plus className="mr-2 h-4 w-4" />
                Новое задание
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending Submissions */}
          <Card className="lg:col-span-2 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ожидают проверки</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/evaluations">
                  Все работы <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {submission.student.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{submission.student}</div>
                      <div className="text-sm text-muted-foreground">{submission.assignment}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {submission.submitted}
                    </div>
                    {submission.score ? (
                      <Badge variant="secondary">{submission.score}%</Badge>
                    ) : (
                      <Button size="sm">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Оценить
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="mb-6 text-xl font-semibold">Последняя активность</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {activity.type === "submission" && <FileCheck className="h-4 w-4 text-blue-500" />}
                    {activity.type === "graded" && <Target className="h-4 w-4 text-green-500" />}
                    {activity.type === "created" && <Plus className="h-4 w-4 text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      {activity.student ? (
                        <>
                          <span className="font-medium">{activity.student}</span>
                          {activity.type === "submission" ? " сдал(а) " : " оценено "}
                          <span className="text-muted-foreground">{activity.assignment}</span>
                        </>
                      ) : (
                        <span className="font-medium">{activity.item}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold">Быстрые действия</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 p-6 bg-transparent" asChild>
              <Link href="/prompts">
                <Brain className="h-8 w-8 text-purple-500" />
                <span>Создать промпт</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-6 bg-transparent" asChild>
              <Link href="/criteria">
                <Target className="h-8 w-8 text-teal-500" />
                <span>Настроить критерии</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-6 bg-transparent" asChild>
              <Link href="/evaluations">
                <FileCheck className="h-8 w-8 text-orange-500" />
                <span>Проверить работы</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-6 bg-transparent" asChild>
              <Link href="/students">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <span>Аналитика</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
