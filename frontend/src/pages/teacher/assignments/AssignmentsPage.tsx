import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import teacherService from '@/shared/api/teacherService';
import type { Assignment, TeacherCourse } from '@/shared/api/teacherService';

const AssignmentsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<TeacherCourse | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Загрузка курса и его заданий
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Загружаем информацию о курсе
        const courseResponse = await teacherService.getCourse(Number(courseId));
        if (courseResponse.data) {
          setCourse(courseResponse.data);
        } else if (courseResponse.error) {
          setError(courseResponse.error);
          return;
        }
        
        // Загружаем список заданий курса
        const assignmentsResponse = await teacherService.getCourseAssignments(Number(courseId));
        if (assignmentsResponse.data) {
          setAssignments(assignmentsResponse.data);
        } else if (assignmentsResponse.error) {
          setError(assignmentsResponse.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (courseId) {
      fetchData();
    }
  }, [courseId]);
  
  // Обработчик удаления задания
  const handleDeleteAssignment = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это задание?')) {
      setIsLoading(true);
      try {
        const response = await teacherService.deleteAssignment(id);
        if (!response.error) {
          // Удаляем задание из локального состояния
          setAssignments(prevAssignments => prevAssignments.filter(assignment => assignment.id !== id));
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при удалении задания');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Проверка, просрочено ли задание
  const isDeadlinePassed = (deadline: string): boolean => {
    return new Date(deadline) < new Date();
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/teacher/courses')}
            className="mr-4 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
          >
            ← Назад к курсам
          </button>
          <h1 className="text-2xl font-bold">
            {course ? `Задания курса: ${course.title}` : 'Загрузка...'}
          </h1>
        </div>
        <button
          onClick={() => navigate(`/teacher/courses/${courseId}/assignments/new`)}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Создать задание
        </button>
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка заданий...</p>
        </div>
      ) : (
        <div>
          {assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дедлайн</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Макс. оценка</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{assignment.title}</td>
                      <td className="px-6 py-4">
                        <div className="line-clamp-2">
                          {assignment.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={isDeadlinePassed(assignment.deadline) ? "text-red-600" : "text-green-600"}>
                          {new Date(assignment.deadline).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {assignment.max_score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/teacher/assignments/${assignment.id}/grades`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Оценки
                          </button>
                          <button
                            onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow-md">
              <p className="text-gray-600">У этого курса пока нет заданий.</p>
              <button
                onClick={() => navigate(`/teacher/courses/${courseId}/assignments/new`)}
                className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Создать первое задание
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
