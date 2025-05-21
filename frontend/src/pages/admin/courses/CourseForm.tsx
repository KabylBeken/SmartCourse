import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminService, { Course, CreateCourseRequest, UpdateCourseRequest } from '@/shared/api/adminService';

const CourseForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== 'new' && id !== undefined;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CreateCourseRequest | UpdateCourseRequest>({
    title: '',
    description: '',
    teacher_id: 0
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Загрузка данных курса для редактирования
  useEffect(() => {
    if (isEditMode) {
      const fetchCourse = async () => {
        setIsLoading(true);
        try {
          const response = await adminService.getCourse(Number(id));
          if (response.data) {
            const { title, description, teacher_id } = response.data;
            setFormData({ title, description, teacher_id });
          } else if (response.error) {
            setError(response.error);
          }
        } catch (err) {
          setError('Ошибка при загрузке данных курса');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCourse();
    }
  }, [id, isEditMode]);
  
  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'teacher_id' ? Number(value) : value
    });
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    // Проверяем корректность заполнения формы
    if (!formData.title || formData.title.trim() === '') {
      setError('Название курса обязательно для заполнения');
      setIsLoading(false);
      return;
    }

    if (!formData.description || formData.description.trim() === '') {
      setError('Описание курса обязательно для заполнения');
      setIsLoading(false);
      return;
    }

    if (!formData.teacher_id || formData.teacher_id <= 0) {
      setError('ID преподавателя должен быть указан корректно');
      setIsLoading(false);
      return;
    }
    
    console.log('Отправляемые данные формы:', formData);
    
    try {
      if (isEditMode) {
        // Редактирование существующего курса
        console.log(`Отправка запроса на редактирование курса с ID ${id}`);
        const response = await adminService.updateCourse(Number(id), formData);
        console.log('Ответ от сервера при редактировании:', response);
        
        if (!response.error) {
          setSuccess(true);
          // Редирект через некоторое время
          setTimeout(() => navigate('/admin/courses'), 2000);
        } else {
          setError(response.error);
        }
      } else {
        // Создание нового курса
        console.log('Отправка запроса на создание нового курса');
        const createData = formData as CreateCourseRequest;
        console.log('Данные для создания курса:', createData);
        
        const response = await adminService.createCourse(createData);
        console.log('Ответ от сервера при создании:', response);
        
        if (!response.error) {
          setSuccess(true);
          // Редирект через некоторое время
          setTimeout(() => navigate('/admin/courses'), 2000);
        } else {
          setError(response.error);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка при сохранении курса: ${errorMessage}`);
      console.error('Ошибка при отправке формы:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">
        {isEditMode ? 'Редактирование курса' : 'Создание нового курса'}
      </h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
          Курс успешно {isEditMode ? 'обновлен' : 'создан'}! Вы будете перенаправлены на страницу курсов.
        </div>
      )}
      
      {isLoading && !formData.title && isEditMode ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка данных курса...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-lg bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Название курса
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
              Описание курса
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
          
          <div className="mb-6">
            <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700">
              ID преподавателя
            </label>
            <input
              type="number"
              id="teacher_id"
              name="teacher_id"
              value={formData.teacher_id as number}
              onChange={handleChange}
              required
              min={1}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
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
                : `${isEditMode ? 'Сохранить изменения' : 'Создать курс'}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CourseForm;
