import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import { UserRole } from '@/shared/api/types';

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');
    setIsLoading(true);

    try {
      const result = await login(formData);

      if (!result.success) {
        throw new Error(result.error || 'Ошибка при входе. Проверьте имя пользователя и пароль.');
      }

      // Получаем данные пользователя из локального хранилища
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) {
        throw new Error('Не удалось получить данные пользователя');
      }

      const userData = JSON.parse(userDataStr);
      
      // Редирект в зависимости от роли пользователя
      switch (userData.role) {
        case UserRole.ADMIN:
          navigate('/admin');
          break;
        case UserRole.TEACHER:
          navigate('/teacher');
          break;
        case UserRole.STUDENT:
          navigate('/student');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrors(error.message);
      } else {
        setErrors('Произошла неизвестная ошибка');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 lg:p-10 shadow-lg border border-gray-100 backdrop-blur-sm bg-opacity-95">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Вход в систему</h2>
        
        {errors && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {errors}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Выполняется вход...' : 'Войти'}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Нет аккаунта?{' '}
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Зарегистрироваться
          </a>
        </div>
      </div>
    </div>
  );
}
