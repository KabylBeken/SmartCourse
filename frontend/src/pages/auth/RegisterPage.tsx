import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');
    setSuccess(false);
    setIsLoading(true);

    try {
      // Используем функцию register из AuthContext
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (!result.success) {
        throw new Error(result.error || 'Ошибка при регистрации');
      }

      setSuccess(true);
      
      // Перенаправление на страницу входа через 2 секунды
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Регистрация</h2>
        
        {errors && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {errors}
          </div>
        )}
        
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
            Регистрация прошла успешно! Вы будете перенаправлены на страницу входа.
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Выполняется регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Войти
          </a>
        </div>
      </div>
    </div>
  );
}
