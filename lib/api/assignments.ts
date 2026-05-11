/**
 * Тапсырмалар API (essay / test) — Go маршруттарына сәйкес.
 */

import { apiClient } from "@/lib/auth/api-client"
import type { EssayCriterion, TestQuestion } from "@/lib/api/ai"
import type { Grade } from "@/lib/api/grades"

export interface Assignment {
  id: number
  course_id: number
  title: string
  description: string
  due_date: string
  max_score: number
  type: "essay" | "test"
  word_count: number
  criteria?: EssayCriterion[]
  questions?: TestQuestion[]
  created_at: string
  updated_at: string
}

export interface CreateAssignmentRequest {
  title: string
  description: string
  due_date: string
  max_score?: number
  type?: "essay" | "test"
  word_count?: number
  criteria?: EssayCriterion[]
  questions?: TestQuestion[]
}

export type SubmissionStatus = "draft" | "submitted" | "late" | "graded"

export interface TestAnswer {
  question_id: number
  selected_index: number
}

export interface TestQuestionReview {
  question_id: number
  selected_index: number
  correct_index: number
  is_correct: boolean
  explanation?: string
  points_earned: number
  points_max: number
}

export interface AssignmentSubmission {
  id: number
  assignment_id: number
  student_id: number
  content: string
  answers?: TestAnswer[]
  status: SubmissionStatus
  word_count: number
  submitted_at?: string
  created_at?: string
  updated_at?: string
  grade?: Grade
  test_review?: TestQuestionReview[]
}

export interface AssignmentSubmissionRequest {
  content?: string
  answers?: TestAnswer[]
}

// === Teacher routes ===

export async function getTeacherCourseAssignments(courseId: number): Promise<Assignment[]> {
  return apiClient.get<Assignment[]>(`/api/teacher/courses/${courseId}/assignments`)
}

export async function createAssignment(courseId: number, data: CreateAssignmentRequest): Promise<Assignment> {
  return apiClient.post<Assignment>(`/api/teacher/courses/${courseId}/assignments`, {
    title: data.title,
    description: data.description ?? "",
    due_date: data.due_date,
    max_score: data.max_score ?? 100,
    type: data.type ?? "essay",
    word_count: data.word_count ?? 0,
    criteria: data.criteria ?? [],
    questions: data.questions ?? [],
  })
}

export async function getAssignment(id: number): Promise<Assignment> {
  return apiClient.get<Assignment>(`/api/teacher/assignments/${id}`)
}

export async function updateAssignment(id: number, data: CreateAssignmentRequest): Promise<Assignment> {
  return apiClient.put<Assignment>(`/api/teacher/assignments/${id}`, {
    title: data.title,
    description: data.description ?? "",
    due_date: data.due_date,
    max_score: data.max_score ?? 100,
    type: data.type ?? "essay",
    word_count: data.word_count ?? 0,
    criteria: data.criteria ?? [],
    questions: data.questions ?? [],
  })
}

export async function updateAssignmentCriteria(id: number, criteria: EssayCriterion[]): Promise<Assignment> {
  return apiClient.put<Assignment>(`/api/teacher/assignments/${id}/criteria`, { criteria })
}

export async function deleteAssignment(id: number): Promise<void> {
  await apiClient.delete(`/api/teacher/assignments/${id}`)
}

// === Student routes ===

export async function getStudentCourseAssignments(courseId: number): Promise<Assignment[]> {
  return apiClient.get<Assignment[]>(`/api/student/courses/${courseId}/assignments`)
}

export async function getStudentAssignment(id: number): Promise<Assignment> {
  return apiClient.get<Assignment>(`/api/student/assignments/${id}`)
}

export async function getStudentAssignmentSubmission(id: number): Promise<AssignmentSubmission> {
  return apiClient.get<AssignmentSubmission>(`/api/student/assignments/${id}/submission`)
}

export async function saveStudentAssignmentDraft(
  id: number,
  data: AssignmentSubmissionRequest,
): Promise<AssignmentSubmission> {
  return apiClient.put<AssignmentSubmission>(`/api/student/assignments/${id}/submission/draft`, {
    content: data.content ?? "",
    answers: data.answers ?? [],
  })
}

export async function submitStudentAssignment(
  id: number,
  data: AssignmentSubmissionRequest,
): Promise<AssignmentSubmission> {
  return apiClient.post<AssignmentSubmission>(`/api/student/assignments/${id}/submission/submit`, {
    content: data.content ?? "",
    answers: data.answers ?? [],
  })
}
