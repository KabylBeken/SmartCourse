import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentService from '@/shared/api/studentService';
import type { CourseDetail } from '@/shared/api/studentService';

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCourseDetails = async () => {
      setIsLoading(true);
      try {
        const response = await studentService.getCourse(Number(courseId));
        if (response.data) {
          setCourse(response.data);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке информации о курсе');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);
  
  const calculateProgress = (): number => {
    if (!course || !course.assignments_count) return 0;
    return Math.round((course.completed_assignments_count / course.assignments_count) * 100);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate('/student/courses')}
          className="mr-4 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
        >
          ← Назад к курсам
        </button>
        <h1 className="text-2xl font-bold">
          {isLoading ? 'Загрузка...' : course?.title}
        </h1>
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка информации о курсе...</p>
        </div>
      ) : course ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold">Описание курса</h2>
              <p className="mb-6 text-gray-700">{course.description}</p>
              
              <h3 className="mb-2 text-lg font-semibold">Преподаватель</h3>
              <p className="mb-6 text-gray-700">{course.teacher_name}</p>
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Прогресс по курсу</h3>
                <span className="text-sm font-medium text-gray-600">
                  {calculateProgress()}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate(`/student/courses/${course.id}/assignments`)}
                  className="rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
                >
                  Перейти к заданиям
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold">Статистика курса</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-600">Общее количество уроков</h3>
                  <p className="text-2xl font-bold">{course.lessons_count}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Общее количество заданий</h3>
                  <p className="text-2xl font-bold">{course.assignments_count}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Выполнено заданий</h3>
                  <p className="text-2xl font-bold">{course.completed_assignments_count}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Средняя оценка</h3>
                  <p className="text-2xl font-bold">
                    {course.average_grade ? `${course.average_grade.toFixed(1)} / 100` : 'Нет оценок'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Дата начала курса</h3>
                  <p className="text-xl font-bold">
                    {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center shadow-md">
          <p className="text-gray-600">Информация о курсе не найдена.</p>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
