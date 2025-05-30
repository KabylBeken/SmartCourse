import { useAuth } from '@/shared/auth/AuthContext';
import { Link } from 'react-router-dom';

/**
 * Компонент для отображения статуса аутентификации и быстрых действий
 */
export const AuthStatus = () => {
  const { user, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          Войти
        </Link>
        <Link to="/register" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          Регистрация
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-700">
        Привет, <span className="font-medium">{user?.name}</span>
      </span>
      <button
        onClick={logout}
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        Выйти
      </button>
    </div>
  );
};
