import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import teacherService from '@/shared/api/teacherService';
import type { Grade, UpdateGradeRequest } from '@/shared/api/teacherService';

const GradeForm = () => {
  const { gradeId } = useParams<{ gradeId: string }>();
  const navigate = useNavigate();
  
  const [grade, setGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState<UpdateGradeRequest>({
    score: 0,
    feedback: ''
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Загрузка данных оценки для редактирования
  useEffect(() => {
    const fetchGrade = async () => {
      setIsLoading(true);
      try {
        const response = await teacherService.getGrade(Number(gradeId));
        if (response.data) {
          setGrade(response.data);
          const { score, feedback } = response.data;
          setFormData({ score, feedback });
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке данных оценки');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (gradeId) {
      fetchGrade();
    }
  }, [gradeId]);
  
  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'score' ? Number(value) : value
    });
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка валидности оценки
    if (grade && (formData.score! < 0 || formData.score! > grade.assignment_id)) {
      setError(`Оценка должна быть в диапазоне от 0 до максимума для данного задания`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await teacherService.updateGrade(Number(gradeId), formData);
      if (!response.error) {
        setSuccess(true);
        // Редирект через некоторое время
        setTimeout(() => navigate(`/teacher/assignments/${grade?.assignment_id}/grades`), 2000);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Ошибка при сохранении оценки');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Редактирование оценки</h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
          Оценка успешно обновлена! Вы будете перенаправлены на страницу оценок.
        </div>
      )}
      
      {isLoading && !grade ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка данных оценки...</p>
        </div>
      ) : (
        <div>
          {grade && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold">Информация</h2>
              <p className="mt-2">
                <strong>Студент:</strong> {grade.student_name}
              </p>
              <p className="mt-1">
                <strong>Задание:</strong> {/* Название задания можно получить при необходимости */}
              </p>
              <p className="mt-1">
                <strong>Дата создания:</strong> {new Date(grade.created_at).toLocaleString()}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="max-w-lg bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <label htmlFor="score" className="block text-sm font-medium text-gray-700">
                Оценка
              </label>
              <input
                type="number"
                id="score"
                name="score"
                value={formData.score || 0}
                onChange={handleChange}
                required
                min={0}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                Комментарий
              </label>
              <textarea
                id="feedback"
                name="feedback"
                value={formData.feedback || ''}
                onChange={handleChange}
                rows={5}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(grade ? `/teacher/assignments/${grade.assignment_id}/grades` : '/teacher')}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GradeForm;
