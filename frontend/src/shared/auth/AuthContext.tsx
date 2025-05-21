import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '@/shared/api/authService';
import type { UserData, LoginRequest, RegisterRequest } from '@/shared/api/types';
import * as tokenService from '@/shared/auth/tokenService';

// Тип контекста аутентификации
interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Создаем контекст с значением по умолчанию
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
});

// Хук для использования контекста аутентификации
export const useAuth = () => useContext(AuthContext);

// Провайдер контекста аутентификации
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // При первом рендере проверяем наличие валидного токена и данных пользователя
  useEffect(() => {
    // Проверяем авторизацию с использованием tokenService
    if (tokenService.isAuthenticated()) {
      try {
        const userData = tokenService.getUserData();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Ошибка при восстановлении данных пользователя:', error);
        tokenService.clearAuthData();
      }
    }
  }, []);

  // Функция входа в систему
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      
      // Проверяем, что получены данные и нет ошибки
      if (!response.data || response.error) {
        throw new Error(response.error || 'Ошибка при входе');
      }
      
      // Сохраняем токен и данные пользователя с защитой от XSS и учетом срока действия
      tokenService.saveToken(response.data.token, 3600); // Предполагаем срок жизни токена 1 час
      tokenService.saveUserData(response.data.user);
      
      // Обновляем состояние
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
    }
  };

  // Функция регистрации
  const register = async (userData: RegisterRequest) => {
    try {
      await authService.register(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
    }
  };

  // Функция выхода из системы
  const logout = () => {
    // Очищаем данные аутентификации
    tokenService.clearAuthData();
    
    // Обновляем состояние
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
