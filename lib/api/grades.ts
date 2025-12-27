/**
 * API для работы с оценками
 * Соответствует Go маршрутам:
 * 
 * Teacher routes:
 * - GET /api/teacher/assignments/:id/grades
 * - POST /api/teacher/assignments/:id/grades
 * - PUT /api/teacher/grades/:id
 * - DELETE /api/teacher/grades/:id
 * 
 * Student routes:
 * - GET /api/student/grades
 */

import { apiClient } from "@/lib/auth/api-client"

export interface Grade {
  id: number
  assignment_id: number
  student_id: number
  score: number          // float64 в Go
  feedback: string
  created_at: string
  updated_at: string
}

export interface CreateGradeRequest {
  student_id: number
  score: number
  feedback?: string
}

export interface UpdateGradeRequest {
  score?: number
  feedback?: string
}

// === Teacher routes ===

export async function getAssignmentGrades(assignmentId: number): Promise<Grade[]> {
  return apiClient.get<Grade[]>(`/api/teacher/assignments/${assignmentId}/grades`)
}

export async function createGrade(assignmentId: number, data: CreateGradeRequest): Promise<Grade> {
  return apiClient.post<Grade>(`/api/teacher/assignments/${assignmentId}/grades`, data)
}

export async function updateGrade(id: number, data: UpdateGradeRequest): Promise<Grade> {
  return apiClient.put<Grade>(`/api/teacher/grades/${id}`, data)
}

export async function deleteGrade(id: number): Promise<void> {
  return apiClient.delete(`/api/teacher/grades/${id}`)
}

// === Student routes ===

export async function getStudentGrades(): Promise<Grade[]> {
  return apiClient.get<Grade[]>("/api/student/grades")
}
