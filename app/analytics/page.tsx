"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users, BookOpen, GraduationCap, TrendingUp, AlertTriangle,
  BarChart3, Activity, CheckCircle2,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import {
  getAnalyticsOverview, getGradesOverTime, getHeatmap, getAtRisk,
  type AnalyticsOverview, type GradeBucket, type HeatmapResponse, type AtRiskStudent,
} from "@/lib/api/analytics"
import { getAllCourses, type Course } from "@/lib/api/courses"
import { motion } from "framer-motion"

// ─── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number, max: number): string {
  if (max === 0) return "bg-muted"
  const pct = score / max
  if (pct >= 0.85) return "bg-emerald-500"
  if (pct >= 0.70) return "bg-blue-400"
  if (pct >= 0.55) return "bg-yellow-400"
  if (pct > 0) return "bg-orange-400"
  return "bg-red-400"
}

function statusStyle(status: string): string {
  switch (status) {
    case "graded": return ""
    case "submitted": case "late": return "bg-yellow-200"
    default: return "bg-gray-100"
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, color, bgColor, index, loading }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; bgColor: string; index: number; loading: boolean
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
      <Card className="p-5 hover:shadow-md transition-shadow">
        <div className={`inline-flex rounded-xl p-2.5 ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="mt-3">
          {loading ? <Skeleton className="h-8 w-20 mb-1" /> : (
            <div className="text-3xl font-bold tabular-nums">{value}</div>
          )}
          <div className="text-sm text-muted-foreground">{label}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | undefined>()
  const [days, setDays] = useState(30)

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [trend, setTrend] = useState<GradeBucket[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null)
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([])

  const [loadingOv, setLoadingOv] = useState(true)
  const [loadingTrend, setLoadingTrend] = useState(true)
  const [loadingHeat, setLoadingHeat] = useState(true)
  const [loadingRisk, setLoadingRisk] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getAllCourses().then(setCourses).catch(() => {})
    getAnalyticsOverview()
      .then(setOverview).catch(() => setError("Статистика жүктелмеді"))
      .finally(() => setLoadingOv(false))
  }, [])

  const loadByFilter = useCallback(() => {
    setLoadingTrend(true)
    setLoadingHeat(true)
    setLoadingRisk(true)

    getGradesOverTime({ courseId: selectedCourse, days })
      .then(setTrend).catch(() => setTrend([]))
      .finally(() => setLoadingTrend(false))
    getHeatmap(selectedCourse)
      .then(setHeatmap).catch(() => setHeatmap(null))
      .finally(() => setLoadingHeat(false))
    getAtRisk({ courseId: selectedCourse })
      .then(setAtRisk).catch(() => setAtRisk([]))
      .finally(() => setLoadingRisk(false))
  }, [selectedCourse, days])

  useEffect(() => { loadByFilter() }, [loadByFilter])

  const kpis = [
    { label: "Студенттер", value: overview?.students_total ?? 0, icon: Users, color: "text-blue-600", bgColor: "bg-blue-50", sub: undefined },
    { label: "Курстар", value: overview?.courses_total ?? 0, icon: BookOpen, color: "text-violet-600", bgColor: "bg-violet-50", sub: undefined },
    { label: "Тапсырмалар", value: overview?.assignments_total ?? 0, icon: GraduationCap, color: "text-emerald-600", bgColor: "bg-emerald-50", sub: undefined },
    {
      label: "Орташа балл", value: overview ? `${overview.avg_score.toFixed(1)}` : "—",
      icon: TrendingUp, color: "text-orange-600", bgColor: "bg-orange-50",
      sub: overview ? `Аяқталуы: ${(overview.completion_rate * 100).toFixed(0)}%` : undefined
    },
  ]

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Аналитика
            </h1>
            <p className="text-muted-foreground">Оқытудың барысы мен студенттер прогресі</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCourse?.toString() ?? "all"} onValueChange={v => setSelectedCourse(v === "all" ? undefined : Number(v))}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Барлық курстар" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Барлық курстар</SelectItem>
                {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 күн</SelectItem>
                <SelectItem value="14">14 күн</SelectItem>
                <SelectItem value="30">30 күн</SelectItem>
                <SelectItem value="90">90 күн</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <KPICard key={k.label} {...k} index={i} loading={loadingOv} />
          ))}
        </div>

        {/* Grades over time chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Баллдардың динамикасы ({days} күн)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrend ? (
              <Skeleton className="h-56 w-full" />
            ) : trend.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                Деректер жоқ — тапсырмалар бағаланғаннан кейін пайда болады
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}`, "Орташа балл"]}
                    labelFormatter={l => `Күн: ${l}`}
                  />
                  <ReferenceLine y={60} stroke="#f97316" strokeDasharray="4 4" label={{ value: "60", position: "insideRight", fontSize: 10 }} />
                  <Line type="monotone" dataKey="avg_score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Студент × Тапсырма матрицасы
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHeat ? (
              <Skeleton className="h-48 w-full" />
            ) : !heatmap || heatmap.rows.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Деректер жоқ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-muted-foreground py-2 pr-4 whitespace-nowrap min-w-[130px]">Студент</th>
                      {heatmap.assignments.map(a => (
                        <th key={a.id} className="font-medium text-muted-foreground px-1 py-2 whitespace-nowrap max-w-[80px] truncate" title={a.title}>
                          {a.title.length > 12 ? a.title.slice(0, 12) + "…" : a.title}
                        </th>
                      ))}
                      <th className="text-right font-medium text-muted-foreground py-2 pl-4">Орт.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.rows.map(row => (
                      <tr key={row.student_id} className="border-t border-muted/30">
                        <td className="py-1.5 pr-4 font-medium whitespace-nowrap">{row.student_name}</td>
                        {row.cells.map((cell, ci) => (
                          <td key={ci} className="px-1 py-1.5 text-center">
                            {cell.status === "graded" ? (
                              <div
                                className={`mx-auto h-7 w-14 rounded flex items-center justify-center text-white text-[10px] font-bold ${scoreColor(cell.score, cell.max_score)}`}
                                title={`${cell.score}/${cell.max_score}`}
                              >
                                {cell.score.toFixed(0)}
                              </div>
                            ) : (
                              <div
                                className={`mx-auto h-7 w-14 rounded flex items-center justify-center text-[10px] text-muted-foreground ${statusStyle(cell.status)}`}
                                title={cell.status}
                              >
                                {cell.status === "missing" ? "—" : cell.status === "submitted" ? "↑" : cell.status === "late" ? "⏱" : "—"}
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="py-1.5 pl-4 text-right font-semibold tabular-nums">
                          {row.avg_score > 0 ? row.avg_score.toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded bg-emerald-500" /> 85%+</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded bg-blue-400" /> 70-84%</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded bg-yellow-400" /> 55-69%</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded bg-orange-400" /> 1-54%</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded bg-red-400" /> 0</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded bg-gray-100 border" /> тапсырылмаған</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* At-risk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Тәуекел тобындағы студенттер
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRisk ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : atRisk.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Барлық студенттер жақсы нәтиже көрсетуде
              </div>
            ) : (
              <div className="space-y-3">
                {atRisk.map(s => (
                  <motion.div
                    key={s.student_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                        {s.student_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{s.student_name}</div>
                        <div className="text-xs text-muted-foreground">{s.reason}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-bold text-orange-700">{s.avg_score > 0 ? `${s.avg_score.toFixed(1)}` : "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.missing_count}/{s.total_assignments} өткізді
                      </div>
                    </div>
                    <Badge variant="destructive" className="ml-2 shrink-0 text-[10px]">Тәуекел</Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
