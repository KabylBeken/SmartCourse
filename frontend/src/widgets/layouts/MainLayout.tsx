import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  // Навигационные элементы в зависимости от роли пользователя
  const getNavLinks = () => {
    if (!isAuthenticated || !user) return [];

    const commonLinks = [
      { to: '/dashboard', label: 'Дашборд' },
    ];

    switch (user.role) {
      case 'student':
        return [
          ...commonLinks,
          { to: '/courses', label: 'Курсы' },
          { to: '/assignments', label: 'Задания' },
          { to: '/grades', label: 'Оценки' },
        ];
      case 'teacher':
        return [
          ...commonLinks,
          { to: '/teacher/courses', label: 'Мои курсы' },
          { to: '/teacher/assignments', label: 'Задания' },
          { to: '/teacher/grades', label: 'Оценки' },
        ];
      case 'admin':
        return [
          ...commonLinks,
          { to: '/admin/users', label: 'Пользователи' },
          { to: '/admin/courses', label: 'Курсы' },
          { to: '/admin/logs', label: 'Логи' },
          { to: '/admin/events', label: 'События' },
        ];
      default:
        return commonLinks;
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm bg-opacity-90 backdrop-blur-sm border-b border-gray-100">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 2xl:w-[90%]">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-blue-600">Smart Course</span>
              </Link>
            </div>

            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="flex space-x-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        location.pathname.startsWith(link.to)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600">
                    {user?.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Мобильное меню */}
      {isAuthenticated && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="px-2 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  location.pathname.startsWith(link.to)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 relative">
        <div className="absolute inset-0 bg-pattern opacity-[0.03] -z-10 pointer-events-none"></div>
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 2xl:w-[80%] py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 2xl:w-[80%] py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">© 2025 Smart Course. Все права защищены.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                Помощь
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                Условия
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                Конфиденциальность
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
