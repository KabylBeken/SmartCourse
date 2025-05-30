import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import teacherService from '@/shared/api/teacherService';
import type { TeacherCourse } from '@/shared/api/teacherService';

const TeacherCoursesPage = () => {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Загрузка списка курсов преподавателя
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await teacherService.getCourses();
        if (response.data) {
          setCourses(response.data);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке курсов');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate('/teacher')}
          className="mr-4 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
        >
          ← Назад к панели
        </button>
        <h1 className="text-2xl font-bold">Мои курсы</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка курсов...</p>
        </div>
      ) : (
        <div>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div key={course.id} className="rounded-lg bg-white p-6 shadow-md">
                  <h2 className="mb-2 text-xl font-semibold">{course.title}</h2>
                  <p className="mb-4 text-gray-600 line-clamp-3">{course.description}</p>
                  <div className="mb-4 flex items-center text-sm text-gray-500">
                    <span className="mr-4">
                      <span className="font-semibold">{course.students_count}</span> студентов
                    </span>
                    <span>
                      Создан: {new Date(course.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/teacher/courses/${course.id}/assignments`)}
                      className="rounded bg-indigo-500 px-3 py-1.5 text-white hover:bg-indigo-600"
                    >
                      Задания
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/courses/${course.id}/students`)}
                      className="rounded bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600"
                    >
                      Студенты
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow-md">
              <p className="text-gray-600">У вас пока нет назначенных курсов.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherCoursesPage;
