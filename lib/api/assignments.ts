/**
 * API для работы с заданиями
 * Соответствует Go маршрутам:
 * 
 * Teacher routes:
 * - GET /api/teacher/courses/:id/assignments
 * - POST /api/teacher/courses/:id/assignments
 * - PUT /api/teacher/assignments/:id
 * - DELETE /api/teacher/assignments/:id
 * 
 * Student routes:
 * - GET /api/student/courses/:id/assignments
 */

import { apiClient } from "@/lib/auth/api-client"

export interface Assignment {
  id: number
  course_id: number
  title: string
  description: string
  due_date: string       // ISO формат: "2006-01-02T15:04:05Z"
  created_at: string
  updated_at: string
}

export interface CreateAssignmentRequest {
  title: string
  description: string
  due_date: string       // ISO формат: "2006-01-02T15:04:05Z"
}

export interface UpdateAssignmentRequest {
  title?: string
  description?: string
  due_date?: string
}

// === Teacher routes ===

export async function getTeacherCourseAssignments(courseId: number): Promise<Assignment[]> {
  return apiClient.get<Assignment[]>(`/api/teacher/courses/${courseId}/assignments`)
}

export async function createAssignment(courseId: number, data: CreateAssignmentRequest): Promise<Assignment> {
  return apiClient.post<Assignment>(`/api/teacher/courses/${courseId}/assignments`, data)
}

export async function updateAssignment(id: number, data: UpdateAssignmentRequest): Promise<Assignment> {
  return apiClient.put<Assignment>(`/api/teacher/assignments/${id}`, data)
}

export async function deleteAssignment(id: number): Promise<void> {
  return apiClient.delete(`/api/teacher/assignments/${id}`)
}

// === Student routes ===

export async function getStudentCourseAssignments(courseId: number): Promise<Assignment[]> {
  return apiClient.get<Assignment[]>(`/api/student/courses/${courseId}/assignments`)
}
