/**
 * Типы данных соответствующие Go backend моделям
 * Файл: internal/models/
 */

// ============================================
// User & Auth Types (из models/user.go)
// ============================================

export type UserRole = "admin" | "teacher" | "student"

export interface User {
  id: number
  username: string
  role: UserRole
  created_at: string
  updated_at: string
}

// ============================================
// Course Types (из models/course.go)
// ============================================

export interface Course {
  id: number
  title: string           // Go: Title
  description: string
  teacher_id: number
  teacher?: User
  students?: User[]
  assignments?: Assignment[]
  student_count?: number  // вычисляемое поле для UI
  created_at: string
  updated_at: string
}

export interface CreateCourseRequest {
  title: string
  description: string
  teacher_id: number
}

export interface UpdateCourseRequest {
  title?: string
  description?: string
}

// ============================================
// Student Types (из models/student.go)
// ============================================

export interface Student {
  id: number
  fullName: string        // Go: FullName
  birthdate: string
  age: number
}

export interface CreateStudentRequest {
  full_name: string       // JSON: full_name
  birthdate?: string
  age?: number
}

// ============================================
// Assignment Types (из models/assignment.go)
// ============================================

export interface Assignment {
  id: number
  title: string
  description: string
  course_id: number
  due_date: string        // ISO формат
  course?: Course
  grades?: Grade[]
  created_at: string
  updated_at: string
}

export interface CreateAssignmentRequest {
  title: string
  description: string
  due_date: string        // ISO формат: "2006-01-02T15:04:05Z"
}

export interface UpdateAssignmentRequest {
  title?: string
  description?: string
  due_date?: string
}

// ============================================
// Grade Types (из models/grade.go)
// ============================================

export interface Grade {
  id: number
  student_id: number
  assignment_id: number
  score: number           // float64 в Go
  feedback: string
  student?: User
  assignment?: Assignment
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

// ============================================
// Event Types (из models/event.go) - MongoDB
// ============================================

export interface Event {
  id: string
  user_id: number
  event_type: string
  data: Record<string, unknown>
  timestamp: string
}

// ============================================
// Log Types (из models/log.go) - MongoDB
// ============================================

export interface Log {
  id: string
  user_id: number
  module: string
  message: string
  level: "INFO" | "WARNING" | "ERROR"
  timestamp: string
}

// ============================================
// Metric Types (из models/metric.go) - MongoDB
// ============================================

export interface Metric {
  id: string
  name: string
  value: number
  timestamp: string
}

// ============================================
// UI-only Types (не из Go)
// ============================================

export interface GradingCriteria {
  id: number
  assignment_id: number
  name: string
  description: string
  max_points: number
  weight: number
}

export interface Submission {
  id: number
  student_id: number
  assignment_id: number
  content: string
  submitted_at: string
  status: "pending" | "graded" | "reviewed"
}

export interface SubmissionEvaluation {
  id: number
  submission_id: number
  criteria_id: number
  score: number
  feedback: string
  ai_generated: boolean
}

export interface Prompt {
  id: number
  name: string
  description: string
  content: string
  category: string
  created_at: string
  updated_at: string
}

export interface CreatePromptRequest {
  name: string
  description: string
  content: string
  category: string
}
