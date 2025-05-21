import React from 'react';
import { useAuth } from '@/shared/auth/AuthContext';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-large-screen">
      {/* Хедер */}
      <header className="bg-white shadow">
        <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-16 2xl:w-[80%] py-4">
          <h1 className="text-2xl font-bold text-blue-600">Smart Course</h1>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  Привет, {user?.name || 'Пользователь'}!
                </span>
                <button
                  onClick={logout}
                  className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="rounded border border-blue-500 px-4 py-2 text-blue-500 hover:bg-blue-50"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="w-full max-w-[1200px] mx-auto flex-1 px-4 sm:px-6 lg:px-8 xl:px-16 2xl:w-[80%] py-6">
        <div className="mx-auto w-full lg:max-w-4xl xl:max-w-5xl">
          <h2 className="mb-6 md:mb-8 lg:mb-10 text-center text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Добро пожаловать в Smart Course</h2>
          
          <div className="mb-8 rounded-lg bg-white p-6 md:p-8 lg:p-10 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="mb-4 text-xl md:text-2xl lg:text-2xl font-semibold">Образовательная платформа</h3>
            <p className="mb-4 text-gray-700 sm:text-base md:text-lg lg:text-lg leading-relaxed">
              Smart Course - это современная платформа для онлайн-обучения, которая соединяет студентов и преподавателей. Получайте знания, выполняйте задания и отслеживайте свой прогресс в удобном интерфейсе.
            </p>
            {isAuthenticated ? (
              <div className="mt-6">
                <h4 className="mb-2 text-lg font-medium">Ваш личный кабинет</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="rounded-lg bg-purple-100 p-4 text-center text-purple-700 shadow hover:bg-purple-200"
                    >
                      Панель администратора
                    </Link>
                  )}
                  {user?.role === 'teacher' && (
                    <Link
                      to="/teacher"
                      className="rounded-lg bg-indigo-100 p-4 text-center text-indigo-700 shadow hover:bg-indigo-200"
                    >
                      Кабинет преподавателя
                    </Link>
                  )}
                  {user?.role === 'student' && (
                    <Link
                      to="/student"
                      className="rounded-lg bg-green-100 p-4 text-center text-green-700 shadow hover:bg-green-200"
                    >
                      Кабинет студента
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                >
                  Начать обучение
                </Link>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 lg:gap-8">
            <div className="rounded-lg bg-white p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="mb-3 text-lg md:text-xl lg:text-xl font-semibold text-blue-600">Для студентов</h3>
              <p className="text-gray-700 sm:text-base lg:text-lg">Получайте доступ к курсам, выполняйте задания и отслеживайте свои оценки.</p>
            </div>
            <div className="rounded-lg bg-white p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="mb-3 text-lg md:text-xl lg:text-xl font-semibold text-indigo-600">Для преподавателей</h3>
              <p className="text-gray-700 sm:text-base lg:text-lg">Создавайте курсы, задания и контролируйте успеваемость студентов.</p>
            </div>
            <div className="rounded-lg bg-white p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="mb-3 text-lg md:text-xl lg:text-xl font-semibold text-purple-600">Для администраторов</h3>
              <p className="text-gray-700 sm:text-base lg:text-lg">Управляйте пользователями, курсами и контролируйте работу платформы.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-white py-4 shadow-inner">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 2xl:w-[80%] text-center text-gray-500">
          &copy; 2025 Smart Course. Все права защищены.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
