import { get } from './apiClient';
import type { ApiResponse } from './types';

// Типы для работы с курсами студента
export interface StudentCourse {
  id: number;
  title: string;
  description: string;
  teacher_name: string;
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends StudentCourse {
  lessons_count: number;
  assignments_count: number;
  completed_assignments_count: number;
  average_grade: number;
}

// Типы для работы с заданиями студента
export interface StudentAssignment {
  id: number;
  course_id: number;
  title: string;
  description: string;
  deadline: string;
  max_score: number;
  is_completed: boolean;
  grade: StudentGrade | null;
  created_at: string;
  updated_at: string;
}

// Типы для работы с оценками
export interface StudentGrade {
  id: number;
  assignment_id: number;
  assignment_title: string;
  course_id: number;
  course_title: string;
  score: number;
  max_score: number;
  feedback: string;
  created_at: string;
}

// Сервис для функций студента
const studentService = {
  // Курсы студента
  getCourses: async (): Promise<ApiResponse<StudentCourse[]>> => {
    return await get<StudentCourse[]>('/api/student/courses');
  },

  getCourse: async (id: number): Promise<ApiResponse<CourseDetail>> => {
    return await get<CourseDetail>(`/api/student/courses/${id}`);
  },

  // Задания курса
  getCourseAssignments: async (courseId: number): Promise<ApiResponse<StudentAssignment[]>> => {
    return await get<StudentAssignment[]>(`/api/student/courses/${courseId}/assignments`);
  },

  // Оценки студента
  getGrades: async (): Promise<ApiResponse<StudentGrade[]>> => {
    return await get<StudentGrade[]>('/api/student/grades');
  }
};

export default studentService;
