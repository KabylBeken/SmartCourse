import { get, post, put, del } from './apiClient';
import type { ApiResponse, UserData, UserCreateRequest, UserUpdateRequest } from './types';

const userService = {
  // Получение всех пользователей (только для администратора)
  getUsers: async (): Promise<ApiResponse<UserData[]>> => {
    return await get<UserData[]>('/api/admin/users');
  },
  
  // Получение пользователя по ID
  getUser: async (id: number): Promise<ApiResponse<UserData>> => {
    return await get<UserData>(`/api/admin/users/${id}`);
  },
  
  // Создание пользователя (только для администратора)
  createUser: async (data: UserCreateRequest): Promise<ApiResponse<UserData>> => {
    return await post<UserData>('/api/admin/users', data);
  },
  
  // Обновление пользователя
  updateUser: async (id: number, data: UserUpdateRequest): Promise<ApiResponse<UserData>> => {
    return await put<UserData>(`/api/admin/users/${id}`, data);
  },
  
  // Удаление пользователя
  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    return await del<void>(`/api/admin/users/${id}`);
  },
  
  // Получение профиля текущего пользователя
  getProfile: async (): Promise<ApiResponse<UserData>> => {
    return await get<UserData>('/api/profile');
  },
  
  // Обновление профиля текущего пользователя
  updateProfile: async (data: UserUpdateRequest): Promise<ApiResponse<UserData>> => {
    return await put<UserData>('/api/profile', data);
  }
};

export default userService;
