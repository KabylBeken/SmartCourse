import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentService from '@/shared/api/studentService';
import type { StudentAssignment, StudentCourse } from '@/shared/api/studentService';

const StudentAssignmentsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<StudentCourse | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Загружаем информацию о курсе
        const courseResponse = await studentService.getCourse(Number(courseId));
        if (courseResponse.data) {
          setCourse(courseResponse.data);
        } else if (courseResponse.error) {
          setError(courseResponse.error);
          return;
        }
        
        // Загружаем список заданий курса
        const assignmentsResponse = await studentService.getCourseAssignments(Number(courseId));
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
  
  // Проверка, просрочено ли задание
  const isDeadlinePassed = (deadline: string): boolean => {
    return new Date(deadline) < new Date();
  };
  
  // Форматирование статуса задания
  const getAssignmentStatus = (assignment: StudentAssignment): React.ReactNode => {
    if (assignment.is_completed) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Выполнено
          {assignment.grade && ` • ${assignment.grade.score}/${assignment.max_score}`}
        </span>
      );
    } else if (isDeadlinePassed(assignment.deadline)) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          Просрочено
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          Активно
        </span>
      );
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate(`/student/courses/${courseId}`)}
          className="mr-4 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
        >
          ← Назад к курсу
        </button>
        <h1 className="text-2xl font-bold">
          {course ? `Задания курса: ${course.title}` : 'Загрузка...'}
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
          <p className="mt-2 text-gray-600">Загрузка заданий...</p>
        </div>
      ) : (
        <div>
          {assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg bg-white p-6 shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{assignment.title}</h2>
                      <p className="mt-2 text-gray-600">{assignment.description}</p>
                    </div>
                    <div>
                      {getAssignmentStatus(assignment)}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-semibold">Дедлайн:</span> {new Date(assignment.deadline).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">Макс. баллов:</span> {assignment.max_score}
                    </div>
                  </div>
                  
                  {assignment.grade && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-md">
                      <h3 className="font-semibold text-blue-700">Оценка</h3>
                      <div className="mt-2 flex gap-4">
                        <div>
                          <span className="font-semibold">Баллы:</span> {assignment.grade.score}/{assignment.max_score}
                        </div>
                        {assignment.grade.feedback && (
                          <div>
                            <span className="font-semibold">Комментарий:</span> {assignment.grade.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow-md">
              <p className="text-gray-600">У этого курса пока нет заданий.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentsPage;
