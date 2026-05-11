"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Brain, Target, FileCheck, BookOpen, Users, TrendingUp,
  Clock, ArrowRight, Plus, Sparkles, CalendarClock, GraduationCap,
  AlertTriangle, CheckCircle2, BarChart3, FolderOpen,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { getTeacherDashboard, type DashboardData } from "@/lib/api/dashboard"
import { PdfExportButton } from "@/components/features/reports/pdf-export-button"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—"
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  return `${Math.floor(h / 24)} д назад`
}

function deadlineColor(days: number) {
  if (days <= 0) return "text-red-600 bg-red-50 border-red-200"
  if (days <= 1) return "text-red-500 bg-red-50 border-red-200"
  if (days <= 3) return "text-orange-500 bg-orange-50 border-orange-200"
  return "text-yellow-600 bg-yellow-50 border-yellow-200"
}

function deadlineLabel(days: number) {
  if (days <= 0) return "Сегодня!"
  if (days === 1) return "Завтра"
  return `${days} дней`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  bgColor: string
  index: number
  isLoading: boolean
}
function StatCard({ label, value, icon: Icon, color, bgColor, index, isLoading }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className={`rounded-xl p-2.5 ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-9 w-20 mb-1" />
          ) : (
            <div className="text-3xl font-bold tabular-nums">{value}</div>
          )}
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getTeacherDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false))
  }, [])

  const stats = data?.stats
  const pending = data?.recent_submissions.filter((s) => s.status === "submitted") ?? []
  const allRecent = data?.recent_submissions ?? []

  const maxDist = Math.max(...(data?.grade_distribution.map((b) => b.count) ?? [1]), 1)

  const distColors: Record<string, string> = {
    "0-59": "bg-red-400",
    "60-74": "bg-orange-400",
    "75-89": "bg-blue-400",
    "90-100": "bg-green-500",
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
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
                <Brain className="mr-2 h-4 w-4" /> Промпты
              </Link>
            </Button>
            <Button asChild>
              <Link href="/assignments/new">
                <Plus className="mr-2 h-4 w-4" /> Новое задание
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Курсов" value={stats?.courses_count ?? 0} icon={FolderOpen} color="text-blue-600" bgColor="bg-blue-100" index={0} isLoading={isLoading} />
          <StatCard label="Студентов" value={stats?.students_count ?? 0} icon={Users} color="text-green-600" bgColor="bg-green-100" index={1} isLoading={isLoading} />
          <StatCard label="Заданий" value={stats?.assignments_count ?? 0} icon={BookOpen} color="text-purple-600" bgColor="bg-purple-100" index={2} isLoading={isLoading} />
          <StatCard label="На проверке" value={stats?.pending_submissions ?? 0} icon={FileCheck} color="text-orange-600" bgColor="bg-orange-100" index={3} isLoading={isLoading} />
          <StatCard label="Средний балл" value={stats ? `${stats.average_score.toFixed(1)}%` : "—"} icon={TrendingUp} color="text-teal-600" bgColor="bg-teal-100" index={4} isLoading={isLoading} />
          <StatCard label="Промптов" value={stats?.prompt_count ?? 0} icon={Brain} color="text-violet-600" bgColor="bg-violet-100" index={5} isLoading={isLoading} />
        </div>

        {/* ── Row 2: Pending + Grade Distribution ────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Pending submissions */}
          <Card className="lg:col-span-2 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Ожидают проверки</h2>
                {!isLoading && pending.length > 0 && (
                  <Badge className="bg-orange-500 text-white">{pending.length}</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/evaluations">Все <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="mb-2 h-10 w-10 text-green-500" />
                <p className="font-medium">Всё проверено!</p>
                <p className="text-sm text-muted-foreground">Нет работ, ожидающих оценки.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 5).map((s) => (
                  <div key={s.submission_id} className="flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-muted/50 hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {s.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.student_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.assignment_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden text-xs text-muted-foreground sm:flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(s.submitted_at)}
                      </span>
                      <Button size="sm" asChild>
                        <Link href="/evaluations">
                          <Sparkles className="mr-1 h-3 w-3" /> Оценить
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Grade Distribution */}
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Распределение оценок</h2>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {(data?.grade_distribution ?? []).map((bucket) => (
                  <div key={bucket.range}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{bucket.range}%</span>
                      <span className="text-muted-foreground">{bucket.count} студ.</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${distColors[bucket.range] ?? "bg-primary"}`}
                        style={{ width: `${maxDist > 0 ? (bucket.count / maxDist) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  По всем выставленным оценкам
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* ── Row 3: Upcoming Deadlines + Recent Activity ─────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Upcoming deadlines */}
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Ближайшие дедлайны</h2>
              <Badge variant="outline" className="text-xs">7 дней</Badge>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (data?.upcoming_deadlines ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarClock className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Нет дедлайнов в ближайшие 7 дней.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data!.upcoming_deadlines.map((d) => (
                  <div key={d.assignment_id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{d.assignment_title}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.course_title} · {d.max_score} pts</p>
                    </div>
                    <Badge variant="outline" className={`ml-3 shrink-0 text-xs font-semibold ${deadlineColor(d.days_left)}`}>
                      {d.days_left <= 0 && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {deadlineLabel(d.days_left)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent submissions activity */}
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Последняя активность</h2>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : allRecent.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Нет активности пока.</p>
            ) : (
              <div className="space-y-3">
                {allRecent.slice(0, 6).map((s) => (
                  <div key={s.submission_id} className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${s.status === "graded" ? "bg-green-100" : "bg-blue-100"}`}>
                      {s.status === "graded"
                        ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                        : <FileCheck className="h-4 w-4 text-blue-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{s.student_name}</span>
                        <span className="text-muted-foreground"> {s.status === "graded" ? "оценён по" : "сдал(а)"} </span>
                        <span className="font-medium truncate">{s.assignment_title}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{s.course_title} · {timeAgo(s.submitted_at)}</p>
                    </div>
                    <Badge variant={s.status === "graded" ? "secondary" : "outline"} className="shrink-0 text-xs">
                      {s.status === "graded" ? "Оценён" : "На проверке"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Row 4: Course Overviews ─────────────────────────────────────── */}
        {(isLoading || (data?.course_overviews ?? []).length > 0) && (
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Мои курсы</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/courses">Все курсы <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data!.course_overviews.map((course) => (
                  <div key={course.id} className="rounded-xl border p-4 transition-all hover:border-primary/40 hover:shadow-sm">
                    <Link href={`/courses/${course.id}`} className="group block">
                      <p className="font-semibold group-hover:text-primary transition-colors">{course.title}</p>
                      <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.student_count}</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course.assignment_count}</span>
                        {course.avg_score > 0 && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <TrendingUp className="h-3.5 w-3.5" /> {course.avg_score.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="mt-3">
                      <PdfExportButton
                        endpoint={`/api/teacher/courses/${course.id}/report.pdf`}
                        filename={`course_${course.id}_report.pdf`}
                        label="PDF отчёт"
                        variant="ghost"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Quick Actions ───────────────────────────────────────────────── */}
        <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold">Быстрые действия</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/prompts", icon: Brain, color: "text-purple-500 bg-purple-50", label: "Создать промпт" },
              { href: "/criteria", icon: Target, color: "text-teal-500 bg-teal-50", label: "Критерии оценки" },
              { href: "/evaluations", icon: FileCheck, color: "text-orange-500 bg-orange-50", label: "Проверить работы" },
              { href: "/students", icon: Users, color: "text-green-500 bg-green-50", label: "Студенты" },
            ].map(({ href, icon: Icon, color, label }) => (
              <Button key={href} variant="outline" className="h-auto flex-col gap-3 p-6 bg-transparent hover:bg-muted/50 transition-all" asChild>
                <Link href={href}>
                  <div className={`rounded-xl p-3 ${color.split(" ")[1]}`}>
                    <Icon className={`h-6 w-6 ${color.split(" ")[0]}`} />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  )
}
