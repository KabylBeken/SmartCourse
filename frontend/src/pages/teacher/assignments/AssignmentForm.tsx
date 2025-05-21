import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import teacherService from '@/shared/api/teacherService';
import type { Assignment, CreateAssignmentRequest, UpdateAssignmentRequest } from '@/shared/api/teacherService';

const AssignmentForm = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const isEditMode = assignmentId !== 'new' && assignmentId !== undefined;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CreateAssignmentRequest | UpdateAssignmentRequest>({
    title: '',
    description: '',
    deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16), // Дедлайн через неделю
    max_score: 100
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Загрузка данных задания для редактирования
  useEffect(() => {
    if (isEditMode && assignmentId) {
      const fetchAssignment = async () => {
        setIsLoading(true);
        try {
          const response = await teacherService.getAssignment(Number(assignmentId));
          if (response.data) {
            const { title, description, deadline, max_score } = response.data;
            // Форматируем дату для поля ввода datetime-local
            const formattedDeadline = new Date(deadline).toISOString().substring(0, 16);
            setFormData({ title, description, deadline: formattedDeadline, max_score });
          } else if (response.error) {
            setError(response.error);
          }
        } catch (err) {
          setError('Ошибка при загрузке данных задания');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAssignment();
    }
  }, [assignmentId, isEditMode]);
  
  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'max_score' ? Number(value) : value
    });
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    // Преобразуем дату в ISO формат для отправки на сервер
    const submissionData = {
      ...formData,
      deadline: new Date(formData.deadline as string).toISOString()
    };
    
    try {
      if (isEditMode && assignmentId) {
        // Редактирование существующего задания
        const response = await teacherService.updateAssignment(Number(assignmentId), submissionData);
        if (!response.error) {
          setSuccess(true);
          // Редирект через некоторое время
          setTimeout(() => navigate(`/teacher/courses/${response.data?.course_id}/assignments`), 2000);
        } else {
          setError(response.error);
        }
      } else if (courseId) {
        // Создание нового задания
        const response = await teacherService.createAssignment(Number(courseId), submissionData as CreateAssignmentRequest);
        if (!response.error) {
          setSuccess(true);
          // Редирект через некоторое время
          setTimeout(() => navigate(`/teacher/courses/${courseId}/assignments`), 2000);
        } else {
          setError(response.error);
        }
      }
    } catch (err) {
      setError('Ошибка при сохранении задания');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">
        {isEditMode ? 'Редактирование задания' : 'Создание нового задания'}
      </h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
          Задание успешно {isEditMode ? 'обновлено' : 'создано'}! Вы будете перенаправлены на страницу заданий.
        </div>
      )}
      
      {isLoading && !formData.title && isEditMode ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка данных задания...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-lg bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Название задания
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title as string}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Описание задания
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description as string}
              onChange={handleChange}
              required
              rows={5}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
              Дедлайн
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline as string}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="max_score" className="block text-sm font-medium text-gray-700">
              Максимальная оценка
            </label>
            <input
              type="number"
              id="max_score"
              name="max_score"
              value={formData.max_score as number}
              onChange={handleChange}
              required
              min={1}
              max={1000}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(isEditMode && assignmentId 
                ? `/teacher/assignments/${assignmentId}/grades` 
                : `/teacher/courses/${courseId}/assignments`)}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? `${isEditMode ? 'Сохранение' : 'Создание'}...` 
                : `${isEditMode ? 'Сохранить изменения' : 'Создать задание'}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AssignmentForm;
