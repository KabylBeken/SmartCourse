/**
 * API для работы с курсами
 * Соответствует Go маршрутам:
 * - GET /api/courses
 * - GET /api/courses/:id
 * - POST /api/courses
 * - PUT /api/courses/:id
 * - DELETE /api/courses/:id
 * - POST /api/courses/:id/students
 * - DELETE /api/courses/:id/students/:student_id
 * 
 * Student routes:
 * - GET /api/student/courses
 * - GET /api/student/courses/:id
 */

import { apiClient } from "@/lib/auth/api-client"

export interface Course {
  id: number
  title: string          // Go использует title, не name
  description: string
  teacher_id: number
  created_at: string
  updated_at: string
}

export interface CreateCourseRequest {
  title: string          // Go использует title
  description: string
  teacher_id: number     // Обязательное поле в Go
}

export interface UpdateCourseRequest {
  title?: string
  description?: string
}

// === Admin/Teacher routes ===

export async function getAllCourses(): Promise<Course[]> {
  return apiClient.get<Course[]>("/api/courses")
}

export async function getCourseById(id: number): Promise<Course> {
  return apiClient.get<Course>(`/api/courses/${id}`)
}

export async function createCourse(data: CreateCourseRequest): Promise<Course> {
  return apiClient.post<Course>("/api/courses", data)
}

export async function updateCourse(id: number, data: UpdateCourseRequest): Promise<Course> {
  return apiClient.put<Course>(`/api/courses/${id}`, data)
}

export async function deleteCourse(id: number): Promise<void> {
  return apiClient.delete(`/api/courses/${id}`)
}

export async function addStudentToCourse(courseId: number, studentId: number): Promise<void> {
  return apiClient.post(`/api/courses/${courseId}/students`, { student_id: studentId })
}

export async function removeStudentFromCourse(courseId: number, studentId: number): Promise<void> {
  return apiClient.delete(`/api/courses/${courseId}/students/${studentId}`)
}

// === Student routes ===

export async function getStudentCourses(): Promise<Course[]> {
  return apiClient.get<Course[]>("/api/student/courses")
}

export async function getStudentCourseById(id: number): Promise<Course> {
  return apiClient.get<Course>(`/api/student/courses/${id}`)
}
