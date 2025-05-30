import { get, post, put, del } from './apiClient';
import type { 
  ApiResponse, 
  Grade, 
  GradeCreateRequest, 
  GradeUpdateRequest 
} from './types';

const gradeService = {
  // Администратор - получение всех оценок для задания
  getAssignmentGrades: async (assignmentId: number): Promise<ApiResponse<Grade[]>> => {
    return await get<Grade[]>(`/api/admin/assignments/${assignmentId}/grades`);
  },
  
  // Администратор - получение оценки по ID
  getGrade: async (id: number): Promise<ApiResponse<Grade>> => {
    return await get<Grade>(`/api/admin/grades/${id}`);
  },
  
  // Администратор - создание оценки
  createGrade: async (data: GradeCreateRequest): Promise<ApiResponse<Grade>> => {
    return await post<Grade>('/api/admin/grades', data);
  },
  
  // Администратор - обновление оценки
  updateGrade: async (id: number, data: GradeUpdateRequest): Promise<ApiResponse<Grade>> => {
    return await put<Grade>(`/api/admin/grades/${id}`, data);
  },
  
  // Администратор - удаление оценки
  deleteGrade: async (id: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/admin/grades/${id}`);
  },
  
  // Преподаватель - получение оценок для задания
  getTeacherAssignmentGrades: async (assignmentId: number): Promise<ApiResponse<Grade[]>> => {
    return await get<Grade[]>(`/api/teacher/assignments/${assignmentId}/grades`);
  },
  
  // Преподаватель - создание оценки
  createTeacherGrade: async (assignmentId: number, data: GradeCreateRequest): Promise<ApiResponse<Grade>> => {
    return await post<Grade>(`/api/teacher/assignments/${assignmentId}/grades`, data);
  },
  
  // Преподаватель - обновление оценки
  updateTeacherGrade: async (id: number, data: GradeUpdateRequest): Promise<ApiResponse<Grade>> => {
    return await put<Grade>(`/api/teacher/grades/${id}`, data);
  },
  
  // Преподаватель - удаление оценки
  deleteTeacherGrade: async (id: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/teacher/grades/${id}`);
  },
  
  // Студент - получение всех своих оценок
  getStudentGrades: async (): Promise<ApiResponse<Grade[]>> => {
    return await get<Grade[]>(`/api/student/grades`);
  }
};

export default gradeService;
