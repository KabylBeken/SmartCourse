import { get, post, put, del } from './apiClient';
import type { 
  ApiResponse, 
  Assignment, 
  AssignmentCreateRequest, 
  AssignmentUpdateRequest 
} from './types';

const assignmentService = {
  // Получение всех заданий курса
  getCourseAssignments: async (courseId: number): Promise<ApiResponse<Assignment[]>> => {
    return await get<Assignment[]>(`/api/admin/courses/${courseId}/assignments`);
  },
  
  // Получение задания по ID
  getAssignment: async (id: number): Promise<ApiResponse<Assignment>> => {
    return await get<Assignment>(`/api/admin/assignments/${id}`);
  },
  
  // Создание задания для курса
  createAssignment: async (data: AssignmentCreateRequest): Promise<ApiResponse<Assignment>> => {
    return await post<Assignment>('/api/admin/assignments', data);
  },
  
  // Обновление задания
  updateAssignment: async (id: number, data: AssignmentUpdateRequest): Promise<ApiResponse<Assignment>> => {
    return await put<Assignment>(`/api/admin/assignments/${id}`, data);
  },
  
  // Удаление задания
  deleteAssignment: async (id: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/admin/assignments/${id}`);
  },
  
  // Преподаватель - получение заданий по курсу
  getTeacherAssignments: async (courseId: number): Promise<ApiResponse<Assignment[]>> => {
    return await get<Assignment[]>(`/api/teacher/courses/${courseId}/assignments`);
  },
  
  // Преподаватель - создание задания
  createTeacherAssignment: async (courseId: number, data: AssignmentUpdateRequest): Promise<ApiResponse<Assignment>> => {
    return await post<Assignment>(`/api/teacher/courses/${courseId}/assignments`, data);
  },
  
  // Преподаватель - обновление задания
  updateTeacherAssignment: async (id: number, data: AssignmentUpdateRequest): Promise<ApiResponse<Assignment>> => {
    return await put<Assignment>(`/api/teacher/assignments/${id}`, data);
  },
  
  // Преподаватель - удаление задания
  deleteTeacherAssignment: async (id: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/teacher/assignments/${id}`);
  },
  
  // Студент - получение заданий по курсу
  getStudentAssignments: async (courseId: number): Promise<ApiResponse<Assignment[]>> => {
    return await get<Assignment[]>(`/api/student/courses/${courseId}/assignments`);
  }
};

export default assignmentService;
