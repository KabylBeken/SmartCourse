// Общие типы для API
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status?: number;
  message?: string;
};

// Типы для аутентификации
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: UserData;
}

// Пользователи
export interface UserData {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

// Роли пользователей
export const UserRole = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student"
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Курсы
export interface Course {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  teacher_name: string;
  created_at: string;
  updated_at: string;
}

export interface CourseCreateRequest {
  title: string;
  description: string;
  teacher_id: number;
}

export interface CourseUpdateRequest {
  title?: string;
  description?: string;
  teacher_id?: number;
}

// Задания
export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description: string;
  deadline: string;
  max_score: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentCreateRequest {
  course_id: number;
  title: string;
  description: string;
  deadline: string;
  max_score: number;
}

export interface AssignmentUpdateRequest {
  title?: string;
  description?: string;
  deadline?: string;
  max_score?: number;
}

// Оценки
export interface Grade {
  id: number;
  assignment_id: number;
  student_id: number;
  score: number;
  feedback: string;
  created_at: string;
  updated_at: string;
}

export interface GradeCreateRequest {
  assignment_id: number;
  student_id: number;
  score: number;
  feedback?: string;
}

export interface GradeUpdateRequest {
  score?: number;
  feedback?: string;
}

// События
export interface Event {
  id: number;
  type: string;
  entity_type: string;
  entity_id: number;
  user_id: number;
  details: string;
  created_at: string;
}

// Уровни логов
export const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error"
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

// Логи
export interface Log {
  id: number;
  level: LogLevelType;
  message: string;
  source: string;
  created_at: string;
}
