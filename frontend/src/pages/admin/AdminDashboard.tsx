import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Панель администратора</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Управление курсами</h2>
          <p className="mb-4 text-gray-600">Создание, редактирование и удаление курсов</p>
          <a 
            href="/admin/courses" 
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Перейти
          </a>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Управление пользователями</h2>
          <p className="mb-4 text-gray-600">Управление студентами и преподавателями</p>
          <a 
            href="/admin/users" 
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Перейти
          </a>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Логи и события</h2>
          <p className="mb-4 text-gray-600">Просмотр логов и событий системы</p>
          <a 
            href="/admin/logs" 
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Перейти
          </a>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Метрики</h2>
          <p className="mb-4 text-gray-600">Просмотр метрик системы</p>
          <a 
            href="/admin/metrics" 
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Перейти
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
