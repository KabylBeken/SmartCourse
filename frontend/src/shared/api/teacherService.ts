import { get, post, put, del } from './apiClient';
import type { ApiResponse } from './types';

// Типы для работы с курсами преподавателя
export interface TeacherCourse {
  id: number;
  title: string;
  description: string;
  students_count: number;
  created_at: string;
  updated_at: string;
}

// Типы для работы с заданиями
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

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  deadline: string;
  max_score: number;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  deadline?: string;
  max_score?: number;
}

// Типы для работы с оценками
export interface Grade {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  score: number;
  feedback: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGradeRequest {
  student_id: number;
  score: number;
  feedback: string;
}

export interface UpdateGradeRequest {
  score?: number;
  feedback?: string;
}

// Типы для студентов на курсе
export interface CourseStudent {
  id: number;
  user_id: number;
  name: string;
  email: string;
}

// Сервис для функций преподавателя
const teacherService = {
  // Курсы преподавателя
  getCourses: async (): Promise<ApiResponse<TeacherCourse[]>> => {
    return await get<TeacherCourse[]>('/api/teacher/courses');
  },

  getCourse: async (id: number): Promise<ApiResponse<TeacherCourse>> => {
    return await get<TeacherCourse>(`/api/teacher/courses/${id}`);
  },

  // Студенты на курсе
  getCourseStudents: async (courseId: number): Promise<ApiResponse<CourseStudent[]>> => {
    return await get<CourseStudent[]>(`/api/teacher/courses/${courseId}/students`);
  },

  // Задания для курса
  getCourseAssignments: async (courseId: number): Promise<ApiResponse<Assignment[]>> => {
    return await get<Assignment[]>(`/api/teacher/courses/${courseId}/assignments`);
  },

  createAssignment: async (courseId: number, data: CreateAssignmentRequest): Promise<ApiResponse<Assignment>> => {
    return await post<Assignment>(`/api/teacher/courses/${courseId}/assignments`, data);
  },

  getAssignment: async (id: number): Promise<ApiResponse<Assignment>> => {
    return await get<Assignment>(`/api/teacher/assignments/${id}`);
  },

  updateAssignment: async (id: number, data: UpdateAssignmentRequest): Promise<ApiResponse<Assignment>> => {
    return await put<Assignment>(`/api/teacher/assignments/${id}`, data);
  },

  deleteAssignment: async (id: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/teacher/assignments/${id}`);
  },

  // Оценки для задания
  getAssignmentGrades: async (assignmentId: number): Promise<ApiResponse<Grade[]>> => {
    return await get<Grade[]>(`/api/teacher/assignments/${assignmentId}/grades`);
  },

  createGrade: async (assignmentId: number, data: CreateGradeRequest): Promise<ApiResponse<Grade>> => {
    return await post<Grade>(`/api/teacher/assignments/${assignmentId}/grades`, data);
  },

  getGrade: async (id: number): Promise<ApiResponse<Grade>> => {
    return await get<Grade>(`/api/teacher/grades/${id}`);
  },

  updateGrade: async (id: number, data: UpdateGradeRequest): Promise<ApiResponse<Grade>> => {
    return await put<Grade>(`/api/teacher/grades/${id}`, data);
  },

  deleteGrade: async (id: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/teacher/grades/${id}`);
  }
};

export default teacherService;
