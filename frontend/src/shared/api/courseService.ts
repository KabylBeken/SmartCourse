import { get, post, put, del } from './apiClient';
import type { 
  ApiResponse, 
  Course, 
  CourseCreateRequest, 
  CourseUpdateRequest, 
  UserData
} from './types';

const courseService = {
  // Получение всех курсов (только для администратора)
  getCourses: async (): Promise<ApiResponse<Course[]>> => {
    return await get<Course[]>('/api/admin/courses');
  },
  
  // Получение курса по ID
  getCourse: async (id: number): Promise<ApiResponse<Course>> => {
    return await get<Course>(`/api/admin/courses/${id}`);
  },
  
  // Создание курса (только для администратора)
  createCourse: async (data: CourseCreateRequest): Promise<ApiResponse<Course>> => {
    return await post<Course>('/api/admin/courses', data);
  },
  
  // Обновление курса
  updateCourse: async (id: number, data: CourseUpdateRequest): Promise<ApiResponse<Course>> => {
    return await put<Course>(`/api/admin/courses/${id}`, data);
  },
  
  // Удаление курса
  deleteCourse: async (id: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/admin/courses/${id}`);
  },
  
  // Получение студентов курса
  getCourseStudents: async (courseId: number): Promise<ApiResponse<UserData[]>> => {
    return await get<UserData[]>(`/api/admin/courses/${courseId}/students`);
  },
  
  // Добавление студента на курс
  addStudentToCourse: async (courseId: number, studentId: number): Promise<ApiResponse<void>> => {
    return await post<void>(`/api/admin/courses/${courseId}/students`, { student_id: studentId });
  },
  
  // Удаление студента с курса
  removeStudentFromCourse: async (courseId: number, studentId: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/admin/courses/${courseId}/students/${studentId}`);
  }
};

export default courseService;
