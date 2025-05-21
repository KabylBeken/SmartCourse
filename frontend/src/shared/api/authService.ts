import { post } from './apiClient';
import type { AuthResponse, LoginRequest, RegisterRequest } from './types';

// Сервис для работы с аутентификацией
const authService = {
  // Метод для входа пользователя
  login: async (credentials: LoginRequest) => {
    const response = await post<AuthResponse>('/auth/login', credentials);
    
    if (response.data) {
      // Сохраняем токен в localStorage
      localStorage.setItem('token', response.data.token);
      // Сохраняем данные пользователя
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response;
  },
  
  // Метод для регистрации пользователя
  register: async (userData: RegisterRequest) => {
    return await post<AuthResponse>('/auth/register', userData);
  },
  
  // Метод для выхода пользователя из системы
  logout: () => {
    // Удаляем данные пользователя из localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  },
  
  // Проверка авторизации пользователя
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
  
  // Получение роли пользователя
  getUserRole: (): string | null => {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    
    try {
      const parsed = JSON.parse(userData);
      return parsed.role;
    } catch (error) {
      console.error('Ошибка при получении роли пользователя:', error);
      return null;
    }
  },
  
  // Получение данных пользователя
  getUserData: () => {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      return null;
    }
  }
};

export default authService;
