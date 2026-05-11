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
  max_score?: number
  type?: "essay" | "test"
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
  max_score: number
  weight: number
  auto_checkable: boolean
  check_prompt?: string
  order_index?: number
  difficulty?: "easy" | "medium" | "hard"
  required?: boolean
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
  title: string
  description?: string
  prompt_text: string
  category: string
  is_public: boolean
  is_favorite?: boolean
  use_count?: number
  created_at: string
  updated_at: string
  teacher_id: number
  tags?: string[]
  collection?: string | null
  variables?: string[]
  is_template?: boolean
}

export interface CreatePromptRequest {
  title: string
  description?: string
  prompt_text: string
  category: string
  is_public: boolean
  tags?: string[]
  collection?: string | null
  is_template?: boolean
}

export interface UpdatePromptRequest {
  title?: string
  description?: string
  prompt_text?: string
  category?: string
  is_public?: boolean
  tags?: string[]
  collection?: string | null
  is_favorite?: boolean
}
