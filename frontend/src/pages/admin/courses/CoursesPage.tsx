import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminService, { Course } from '@/shared/api/adminService';

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Загрузка списка курсов
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await adminService.getCourses();
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

  // Обработчик удаления курса
  const handleDeleteCourse = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      setIsLoading(true);
      try {
        const response = await adminService.deleteCourse(id);
        if (!response.error) {
          setCourses(prevCourses => prevCourses.filter(course => course.id !== id));
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при удалении курса');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Управление курсами</h1>
        <Link
          to="/admin/courses/new"
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Создать курс
        </Link>
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID преподавателя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{course.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{course.title}</td>
                    <td className="px-6 py-4">
                      {course.description.length > 50 
                        ? course.description.substring(0, 50) + '...' 
                        : course.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{course.teacher_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(course.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="mr-2 text-blue-600 hover:text-blue-900"
                        onClick={() => navigate(`/admin/courses/${course.id}`)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="mr-2 text-blue-600 hover:text-blue-900"
                        onClick={() => navigate(`/admin/courses/${course.id}/students`)}
                      >
                        Студенты
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Курсы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
