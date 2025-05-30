import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService, { Student, AddStudentToCourseRequest, Course } from '@/shared/api/adminService';

const CourseStudentsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number>(0);
  
  // Загрузка курса и его студентов
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Загружаем информацию о курсе
        const courseResponse = await adminService.getCourse(Number(id));
        if (courseResponse.data) {
          setCourse(courseResponse.data);
        } else if (courseResponse.error) {
          setError(courseResponse.error);
          return;
        }
        
        // Загружаем список студентов на курсе
        const studentsResponse = await adminService.getCourseStudents(Number(id));
        if (studentsResponse.data) {
          setStudents(studentsResponse.data);
        } else if (studentsResponse.error) {
          setError(studentsResponse.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);
  
  // Обработчик добавления студента на курс
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || studentId <= 0) {
      setError('Введите корректный ID студента');
      return;
    }
    
    setIsLoading(true);
    try {
      const data: AddStudentToCourseRequest = { student_id: studentId };
      const response = await adminService.addStudentToCourse(Number(id), data);
      
      if (!response.error) {
        // Обновляем список студентов
        const studentsResponse = await adminService.getCourseStudents(Number(id));
        if (studentsResponse.data) {
          setStudents(studentsResponse.data);
        }
        setStudentId(0); // Сбрасываем поле ввода
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Ошибка при добавлении студента');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик удаления студента с курса
  const handleRemoveStudent = async (studentId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить студента с курса?')) {
      setIsLoading(true);
      try {
        const response = await adminService.removeStudentFromCourse(Number(id), studentId);
        
        if (!response.error) {
          // Удаляем студента из локального состояния
          setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при удалении студента с курса');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate('/admin/courses')}
          className="mr-4 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
        >
          ← Назад к курсам
        </button>
        <h1 className="text-2xl font-bold">
          {course ? `Студенты курса: ${course.title}` : 'Загрузка...'}
        </h1>
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Форма добавления студента */}
        <div className="col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Добавить студента на курс</h2>
            <form onSubmit={handleAddStudent}>
              <div className="mb-4">
                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                  ID студента
                </label>
                <input
                  type="number"
                  id="student_id"
                  value={studentId || ''}
                  onChange={(e) => setStudentId(Number(e.target.value))}
                  min={1}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Загрузка...' : 'Добавить'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Список студентов */}
        <div className="col-span-1 md:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Студенты на курсе</h2>
            
            {isLoading && students.length === 0 ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Загрузка студентов...</p>
              </div>
            ) : (
              <>
                {students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                          <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{student.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleRemoveStudent(student.id)}
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    На данном курсе еще нет студентов.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseStudentsPage;
