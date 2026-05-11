import { apiClient } from "@/lib/auth/api-client"

export interface AnalyticsOverview {
  students_total: number
  courses_total: number
  assignments_total: number
  submissions_total: number
  grades_total: number
  avg_score: number
  completion_rate: number
}

export interface GradeBucket {
  date: string
  avg_score: number
  count: number
}

export interface HeatmapCell {
  assignment_id: number
  assignment_title: string
  score: number
  max_score: number
  status: "graded" | "submitted" | "late" | "missing" | string
}

export interface HeatmapRow {
  student_id: number
  student_name: string
  cells: HeatmapCell[]
  avg_score: number
}

export interface HeatmapAssignment {
  id: number
  title: string
  max_score: number
}

export interface HeatmapResponse {
  assignments: HeatmapAssignment[]
  rows: HeatmapRow[]
}

export interface AtRiskStudent {
  student_id: number
  student_name: string
  avg_score: number
  graded_count: number
  missing_count: number
  total_assignments: number
  reason: string
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiClient.get("/api/teacher/analytics/overview")
}

export async function getGradesOverTime(params?: {
  courseId?: number
  days?: number
}): Promise<GradeBucket[]> {
  const qs = new URLSearchParams()
  if (params?.courseId) qs.set("course_id", String(params.courseId))
  if (params?.days) qs.set("days", String(params.days))
  const q = qs.toString()
  return apiClient.get(`/api/teacher/analytics/grades-over-time${q ? `?${q}` : ""}`)
}

export async function getHeatmap(courseId?: number): Promise<HeatmapResponse> {
  const q = courseId ? `?course_id=${courseId}` : ""
  return apiClient.get(`/api/teacher/analytics/heatmap${q}`)
}

export async function getAtRisk(params?: {
  courseId?: number
  threshold?: number
}): Promise<AtRiskStudent[]> {
  const qs = new URLSearchParams()
  if (params?.courseId) qs.set("course_id", String(params.courseId))
  if (params?.threshold) qs.set("threshold", String(params.threshold))
  const q = qs.toString()
  return apiClient.get(`/api/teacher/analytics/at-risk${q ? `?${q}` : ""}`)
}
