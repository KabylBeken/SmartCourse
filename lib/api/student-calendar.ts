import { apiClient } from "@/lib/auth/api-client"

export interface StudentCalendarEvent {
  id: number
  title: string
  start: string
  all_day: boolean
  assignment_id: number
  course_title: string
  color: string
  type: string
}

export async function getStudentCalendar(params?: {
  start?: string
  end?: string
}): Promise<StudentCalendarEvent[]> {
  const qs = new URLSearchParams()
  if (params?.start) qs.set("start", params.start)
  if (params?.end)   qs.set("end", params.end)
  const q = qs.toString()
  return apiClient.get(`/api/student/calendar${q ? `?${q}` : ""}`)
}
