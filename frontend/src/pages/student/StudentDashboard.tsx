import React from 'react';

const StudentDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Личный кабинет студента</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Мои курсы</h2>
          <p className="mb-4 text-gray-600">Просмотр курсов, на которые вы записаны</p>
          <a 
            href="/student/courses" 
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Перейти
          </a>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Задания</h2>
          <p className="mb-4 text-gray-600">Просмотр и выполнение заданий</p>
          <a 
            href="/student/assignments" 
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Перейти
          </a>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Мои оценки</h2>
          <p className="mb-4 text-gray-600">Просмотр полученных оценок</p>
          <a 
            href="/student/grades" 
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Перейти
          </a>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
