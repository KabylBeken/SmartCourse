import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '@/shared/api/studentService';
import type { StudentCourse } from '@/shared/api/studentService';
import MainLayout from '@/widgets/layouts/MainLayout';
import Pagination from '@/shared/ui/Pagination';
import CourseCard from '@/entities/course/ui/CourseCard';
import Button from '@/shared/ui/Button';

const StudentCoursesPage = () => {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  // Загрузка списка курсов студента
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await studentService.getCourses();
        if (response.data) {
          setCourses(response.data);
          setTotalPages(Math.ceil(response.data.length / itemsPerPage));
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

  // Получаем текущую страницу курсов
  const getCurrentPageCourses = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return courses.slice(startIndex, endIndex);
  };

  // Обработка смены страницы пагинации
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Мои курсы</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <p>{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-2">У вас нет доступных курсов</h3>
            <p className="text-gray-500 mb-4">Обратитесь к администратору для добавления курсов</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 lg:gap-8">
              {getCurrentPageCourses().map((course) => (
                <div key={course.id} className="flex flex-col h-full">
                  <CourseCard
                    course={{
                      id: course.id,
                      title: course.title,
                      description: course.description || '',
                      category: 'Курс студента',
                      imageUrl: '/course-placeholder.jpg'
                    }}
                  />
                  <div className="flex space-x-2 mt-3">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => navigate(`/courses/${course.id}`)}
                      fullWidth
                    >
                      Подробнее
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => navigate(`/assignments?courseId=${course.id}`)}
                      fullWidth
                    >
                      Задания
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default StudentCoursesPage;
