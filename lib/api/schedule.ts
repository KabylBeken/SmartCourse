import { apiClient } from "@/lib/auth/api-client"

export type EventType = "lesson" | "deadline" | "exam" | "holiday" | "meeting" | "other"

export interface ScheduleEvent {
  id: number
  teacher_id: number
  course_id?: number
  assignment_id?: number
  title: string
  description: string
  start: string       // ISO 8601
  end?: string        // ISO 8601
  all_day: boolean
  type: EventType
  color: string
  created_at: string
  updated_at: string
}

export interface CreateEventRequest {
  title: string
  description?: string
  start: string
  end?: string
  all_day?: boolean
  type?: EventType
  color?: string
  course_id?: number
  assignment_id?: number
}

export interface UpdateEventRequest {
  title?: string
  description?: string
  start?: string
  end?: string
  all_day?: boolean
  type?: EventType
  color?: string
  course_id?: number
}

export async function listEvents(params?: {
  start?: string
  end?: string
  courseId?: number
}): Promise<ScheduleEvent[]> {
  const qs = new URLSearchParams()
  if (params?.start)    qs.set("start", params.start)
  if (params?.end)      qs.set("end", params.end)
  if (params?.courseId) qs.set("course_id", String(params.courseId))
  const q = qs.toString()
  return apiClient.get(`/api/teacher/schedule${q ? `?${q}` : ""}`)
}

export async function createEvent(data: CreateEventRequest): Promise<ScheduleEvent> {
  return apiClient.post("/api/teacher/schedule", data)
}

export async function updateEvent(id: number, data: UpdateEventRequest): Promise<ScheduleEvent> {
  return apiClient.put(`/api/teacher/schedule/${id}`, data)
}

export async function deleteEvent(id: number): Promise<void> {
  return apiClient.delete(`/api/teacher/schedule/${id}`)
}

export async function syncDeadlines(): Promise<{ created: number }> {
  return apiClient.post("/api/teacher/schedule/sync", {})
}

// ── FullCalendar event color palette ────────────────────────────────────────

export const EVENT_COLORS: Record<EventType, string> = {
  lesson:   "#6366f1",
  deadline: "#ef4444",
  exam:     "#f97316",
  holiday:  "#22c55e",
  meeting:  "#3b82f6",
  other:    "#8b5cf6",
}

export const EVENT_LABELS: Record<EventType, string> = {
  lesson:   "Сабақ",
  deadline: "Deadline",
  exam:     "Емтихан",
  holiday:  "Демалыс",
  meeting:  "Кездесу",
  other:    "Басқа",
}
