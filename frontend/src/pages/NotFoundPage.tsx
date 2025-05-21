import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-blue-600">404</h1>
        <h2 className="mb-6 text-2xl font-medium text-gray-800">Страница не найдена</h2>
        <p className="mb-8 text-gray-600">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <Link
          to="/"
          className="rounded-md bg-blue-600 px-6 py-3 text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
