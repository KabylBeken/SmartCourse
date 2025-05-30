import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import teacherService from '@/shared/api/teacherService';
import type { Grade, Assignment, CreateGradeRequest, CourseStudent } from '@/shared/api/teacherService';

const GradesPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для формы добавления оценки
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateGradeRequest>({
    student_id: 0,
    score: 0,
    feedback: ''
  });
  
  // Загрузка задания и его оценок
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Загружаем информацию о задании
        const assignmentResponse = await teacherService.getAssignment(Number(assignmentId));
        if (assignmentResponse.data) {
          setAssignment(assignmentResponse.data);
          
          // Загружаем список оценок для задания
          const gradesResponse = await teacherService.getAssignmentGrades(Number(assignmentId));
          if (gradesResponse.data) {
            setGrades(gradesResponse.data);
          } else if (gradesResponse.error) {
            setError(gradesResponse.error);
            return;
          }
          
          // Загружаем список студентов курса
          const studentsResponse = await teacherService.getCourseStudents(assignmentResponse.data.course_id);
          if (studentsResponse.data) {
            setStudents(studentsResponse.data);
          } else if (studentsResponse.error) {
            setError(studentsResponse.error);
          }
        } else if (assignmentResponse.error) {
          setError(assignmentResponse.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (assignmentId) {
      fetchData();
    }
  }, [assignmentId]);
  
  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'student_id' || name === 'score' ? Number(value) : value
    });
  };
  
  // Обработчик отправки формы добавления оценки
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id) {
      setError('Выберите студента');
      return;
    }
    
    if (formData.score < 0 || formData.score > (assignment?.max_score || 100)) {
      setError(`Оценка должна быть в диапазоне от 0 до ${assignment?.max_score || 100}`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await teacherService.createGrade(Number(assignmentId), formData);
      if (!response.error) {
        // Добавляем новую оценку в состояние
        if (response.data) {
          setGrades(prevGrades => [...prevGrades, response.data!]);
        }
        // Сбрасываем форму
        setFormData({
          student_id: 0,
          score: 0,
          feedback: ''
        });
        setShowForm(false);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Ошибка при добавлении оценки');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик удаления оценки
  const handleDeleteGrade = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту оценку?')) {
      setIsLoading(true);
      try {
        const response = await teacherService.deleteGrade(id);
        if (!response.error) {
          // Удаляем оценку из локального состояния
          setGrades(prevGrades => prevGrades.filter(grade => grade.id !== id));
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при удалении оценки');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Получаем список студентов, которые еще не оценены
  const unevaluatedStudents = students.filter(student => 
    !grades.some(grade => grade.student_id === student.id)
  );
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(`/teacher/courses/${assignment?.course_id}/assignments`)}
            className="mr-4 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
          >
            ← Назад к заданиям
          </button>
          <h1 className="text-2xl font-bold">
            {assignment ? `Оценки: ${assignment.title}` : 'Загрузка...'}
          </h1>
        </div>
        {unevaluatedStudents.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
            disabled={isLoading || showForm}
          >
            Добавить оценку
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {/* Форма добавления оценки */}
      {showForm && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold">Добавить оценку</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                Студент
              </label>
              <select
                id="student_id"
                name="student_id"
                value={formData.student_id || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Выберите студента</option>
                {unevaluatedStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="score" className="block text-sm font-medium text-gray-700">
                Оценка (максимум: {assignment?.max_score || 100})
              </label>
              <input
                type="number"
                id="score"
                name="score"
                value={formData.score || ''}
                onChange={handleChange}
                required
                min={0}
                max={assignment?.max_score || 100}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                Комментарий
              </label>
              <textarea
                id="feedback"
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Добавление...' : 'Добавить оценку'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {isLoading && !assignment ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка данных...</p>
        </div>
      ) : (
        <div>
          {grades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Студент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оценка</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Комментарий</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{grade.student_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          px-2 py-1 text-sm rounded-full
                          ${grade.score >= (assignment?.max_score || 100) * 0.8 ? 'bg-green-100 text-green-800' : 
                           grade.score >= (assignment?.max_score || 100) * 0.6 ? 'bg-blue-100 text-blue-800' : 
                           grade.score >= (assignment?.max_score || 100) * 0.4 ? 'bg-yellow-100 text-yellow-800' : 
                           'bg-red-100 text-red-800'}
                        `}>
                          {grade.score} / {assignment?.max_score || 100}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="line-clamp-2">
                          {grade.feedback || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(grade.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/teacher/grades/${grade.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(grade.id)}
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
              <p className="text-gray-600">Оценки для этого задания пока не выставлены.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GradesPage;
