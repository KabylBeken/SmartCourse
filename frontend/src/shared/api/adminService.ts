import { get, post, put, del } from './apiClient';
import type { ApiResponse } from './types';

// Типы для работы с курсами
export interface Course {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  teacher_id: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  teacher_id?: number;
}

// Типы для работы со студентами
export interface Student {
  id: number;
  user_id: number;
  name: string;
  email: string;
}

export interface AddStudentToCourseRequest {
  student_id: number;
}

// Типы для логов и метрик
export interface Log {
  id: number;
  level: string;
  message: string;
  user_id: number;
  module: string;
  created_at: string;
}

export interface Event {
  id: number;
  type: string;
  entity_id: number;
  entity_type: string;
  user_id: number;
  data: any;
  created_at: string;
}

export interface Metric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

// Сервис для администраторских функций
const adminService = {
  // Управление курсами
  getCourses: async (): Promise<ApiResponse<Course[]>> => {
    console.log('Запрос списка курсов для администратора');
    try {
      const result = await get<Course[]>('/api/admin/courses');
      console.log('Ответ списка курсов:', result);
      return result;
    } catch (error) {
      console.error('Ошибка получения списка курсов:', error);
      return { error: 'Ошибка получения списка курсов' };
    }
  },

  getCourse: async (id: number): Promise<ApiResponse<Course>> => {
    console.log(`Запрос курса с ID ${id}`);
    try {
      const result = await get<Course>(`/api/admin/courses/${id}`);
      console.log(`Ответ курса с ID ${id}:`, result);
      return result;
    } catch (error) {
      console.error(`Ошибка получения курса с ID ${id}:`, error);
      return { error: `Ошибка получения курса с ID ${id}` };
    }
  },

  createCourse: async (data: CreateCourseRequest): Promise<ApiResponse<Course>> => {
    console.log('Создание нового курса:', data);
    try {
      const result = await post<Course>('/api/admin/courses', data);
      console.log('Ответ создания курса:', result);
      return result;
    } catch (error) {
      console.error('Ошибка создания курса:', error);
      return { error: 'Ошибка создания курса' };
    }
  },

  updateCourse: async (id: number, data: UpdateCourseRequest): Promise<ApiResponse<Course>> => {
    console.log(`Обновление курса с ID ${id}:`, data);
    try {
      const result = await put<Course>(`/api/admin/courses/${id}`, data);
      console.log(`Ответ обновления курса с ID ${id}:`, result);
      return result;
    } catch (error) {
      console.error(`Ошибка обновления курса с ID ${id}:`, error);
      return { error: `Ошибка обновления курса с ID ${id}` };
    }
  },

  deleteCourse: async (id: number): Promise<ApiResponse<void>> => {
    console.log(`Удаление курса с ID ${id}`);
    try {
      const result = await del<void>(`/api/admin/courses/${id}`);
      console.log(`Ответ удаления курса с ID ${id}:`, result);
      return result;
    } catch (error) {
      console.error(`Ошибка удаления курса с ID ${id}:`, error);
      return { error: `Ошибка удаления курса с ID ${id}` };
    }
  },

  // Управление студентами на курсах
  getCourseStudents: async (courseId: number): Promise<ApiResponse<Student[]>> => {
    return await get<Student[]>(`/api/admin/courses/${courseId}/students`);
  },

  addStudentToCourse: async (courseId: number, data: AddStudentToCourseRequest): Promise<ApiResponse<void>> => {
    return await post<void>(`/api/admin/courses/${courseId}/students`, data);
  },

  removeStudentFromCourse: async (courseId: number, studentId: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/admin/courses/${courseId}/students/${studentId}`);
  },

  // Логи и метрики
  getLogs: async (): Promise<ApiResponse<Log[]>> => {
    return await get<Log[]>('/api/admin/logs');
  },

  getEvents: async (): Promise<ApiResponse<Event[]>> => {
    return await get<Event[]>('/api/admin/events');
  },

  getMetrics: async (): Promise<ApiResponse<Metric[]>> => {
    return await get<Metric[]>('/api/admin/metrics');
  }
};

export default adminService;
