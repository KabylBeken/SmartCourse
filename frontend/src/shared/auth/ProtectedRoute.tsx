import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  // Проверяем наличие токена в localStorage
  const token = localStorage.getItem('token');
  
  // Если токен отсутствует, перенаправляем на страницу входа
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Если требуется определенная роль, проверяем ее
  if (requiredRole) {
    try {
      // В реальном приложении роль пользователя должна храниться более безопасно
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) {
        return <Navigate to="/login" replace />;
      }
      
      const userData = JSON.parse(userDataStr);
      if (userData.role !== requiredRole) {
        // Если роль не соответствует, перенаправляем на домашнюю страницу
        return <Navigate to="/" replace />;
      }
    } catch (error) {
      // Если при проверке произошла ошибка, перенаправляем на страницу входа
      return <Navigate to="/login" replace />;
    }
  }

  // Если токен есть и роль соответствует, показываем защищенный контент
  return <>{children}</>;
};

export default ProtectedRoute;
