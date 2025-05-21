import React from 'react';

const TeacherDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Панель преподавателя</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Мои курсы</h2>
          <p className="mb-4 text-gray-600">Управление курсами, назначенными вам</p>
          <a 
            href="/teacher/courses" 
            className="rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
          >
            Перейти
          </a>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Задания</h2>
          <p className="mb-4 text-gray-600">Создание и управление заданиями</p>
          <a 
            href="/teacher/assignments" 
            className="rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
          >
            Перейти
          </a>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Оценки</h2>
          <p className="mb-4 text-gray-600">Выставление и управление оценками</p>
          <a 
            href="/teacher/grades" 
            className="rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
          >
            Перейти
          </a>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
