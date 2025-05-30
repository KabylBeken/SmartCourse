import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '@/shared/api/studentService';
import type { StudentGrade } from '@/shared/api/studentService';

const StudentGradesPage = () => {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Фильтры
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  
  useEffect(() => {
    const fetchGrades = async () => {
      setIsLoading(true);
      try {
        const response = await studentService.getGrades();
        if (response.data) {
          setGrades(response.data);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке оценок');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGrades();
  }, []);
  
  // Получаем уникальные курсы для фильтрации
  const courses = [...new Set(grades.map(grade => grade.course_id))];
  
  // Фильтрация и сортировка оценок
  const filteredGrades = grades
    .filter(grade => courseFilter === 'all' || grade.course_id.toString() === courseFilter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return (b.score / b.max_score) - (a.score / a.max_score);
      }
    });
  
  // Расчет процента оценки
  const calculatePercentage = (score: number, maxScore: number): number => {
    return Math.round((score / maxScore) * 100);
  };
  
  // Получение цвета для оценки
  const getGradeColor = (score: number, maxScore: number): string => {
    const percentage = calculatePercentage(score, maxScore);
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate('/student')}
          className="mr-4 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
        >
          ← Назад к панели
        </button>
        <h1 className="text-2xl font-bold">Мои оценки</h1>
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка оценок...</p>
        </div>
      ) : (
        <div>
          {grades.length > 0 ? (
            <>
              <div className="mb-6 flex flex-wrap gap-4">
                <div>
                  <label htmlFor="courseFilter" className="block text-sm font-medium text-gray-700">
                    Фильтр по курсу
                  </label>
                  <select
                    id="courseFilter"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                  >
                    <option value="all">Все курсы</option>
                    {courses.map(courseId => {
                      const courseName = grades.find(g => g.course_id === courseId)?.course_title || '';
                      return (
                        <option key={courseId} value={courseId.toString()}>
                          {courseName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                    Сортировка
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                  >
                    <option value="date">По дате</option>
                    <option value="score">По оценке</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Курс</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Задание</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оценка</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Комментарий</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGrades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {grade.course_title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {grade.assignment_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="mr-2">
                              {grade.score}/{grade.max_score}
                            </div>
                            <div className="relative w-16 h-4 bg-gray-200 rounded">
                              <div 
                                className={`absolute top-0 left-0 h-4 rounded ${getGradeColor(grade.score, grade.max_score)}`}
                                style={{ width: `${calculatePercentage(grade.score, grade.max_score)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="line-clamp-2">
                            {grade.feedback || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(grade.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow-md">
              <p className="text-gray-600">У вас пока нет оценок.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentGradesPage;
