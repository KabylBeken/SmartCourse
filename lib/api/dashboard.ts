import { apiClient } from "@/lib/auth/api-client"

export interface DashboardStats {
  courses_count: number
  students_count: number
  assignments_count: number
  pending_submissions: number
  average_score: number
  prompt_count: number
}

export interface UpcomingDeadline {
  assignment_id: number
  assignment_title: string
  course_title: string
  due_date: string
  days_left: number
  max_score: number
}

export interface RecentSubmission {
  submission_id: number
  student_name: string
  assignment_title: string
  course_title: string
  status: "submitted" | "graded"
  submitted_at: string | null
}

export interface DashCourseOverview {
  id: number
  title: string
  student_count: number
  assignment_count: number
  avg_score: number
}

export interface GradeBucket {
  range: string
  count: number
}

export interface DashboardData {
  stats: DashboardStats
  upcoming_deadlines: UpcomingDeadline[]
  recent_submissions: RecentSubmission[]
  course_overviews: DashCourseOverview[]
  grade_distribution: GradeBucket[]
}

export async function getTeacherDashboard(): Promise<DashboardData> {
  return apiClient.get<DashboardData>("/api/teacher/dashboard")
}
