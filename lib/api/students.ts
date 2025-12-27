/**
 * API для работы со студентами
 * Студенты - это users с role='student'
 * Соответствует Go маршрутам:
 * - GET /api/students
 * - GET /api/students/:id
 * - POST /api/students
 * - PUT /api/students/:id
 * - DELETE /api/students/:id
 */

import { apiClient } from "@/lib/auth/api-client"

export interface Student {
  id: number
  fullName: string       // username из таблицы users
  username: string
  role: string
}

export interface CreateStudentRequest {
  username: string
  password: string
  fullName?: string
}

export interface UpdateStudentRequest {
  username?: string
  fullName?: string
}

export async function getAllStudents(): Promise<Student[]> {
  return apiClient.get<Student[]>("/api/students")
}

export async function getStudentById(id: number): Promise<Student> {
  return apiClient.get<Student>(`/api/students/${id}`)
}

export async function createStudent(data: CreateStudentRequest): Promise<Student> {
  return apiClient.post<Student>("/api/students", data)
}

export async function updateStudent(id: number, data: UpdateStudentRequest): Promise<Student> {
  return apiClient.put<Student>(`/api/students/${id}`, data)
}

export async function deleteStudent(id: number): Promise<void> {
  return apiClient.delete(`/api/students/${id}`)
}
