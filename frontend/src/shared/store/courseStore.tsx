import type { ReactNode } from 'react';
import courseService from '@/shared/api/courseService';
import type { Course } from '@/shared/api/types';
import {
  createStoreContext,
  createStoreProvider,
  createStoreHook,
} from './StoreContext';
import type { StoreContextType } from './StoreContext';

// Создаем контекст для курсов
const CoursesContext = createStoreContext<Course[]>();

// Создаем функцию получения данных
const fetchCourses = async (params?: any) => {
  if (params?.courseId) {
    return await courseService.getCourse(params.courseId);
  }
  return await courseService.getCourses();
};

// Создаем провайдер
export const CoursesProvider = ({ children }: { children: ReactNode }) => {
  const Provider = createStoreProvider<Course[]>(CoursesContext, fetchCourses, 300000); // 5 минут кэширования
  return <Provider>{children}</Provider>;
};

// Создаем хук для использования контекста
export const useCourses = createStoreHook<Course[]>(CoursesContext);

// Расширенный интерфейс для работы с курсами
export interface CourseStoreExtended extends StoreContextType<Course[]> {
  getCourseById: (id: number) => Course | null;
}

// Расширенный хук для курсов с дополнительными методами
export const useCourseStore = (): CourseStoreExtended => {
  const store = useCourses();

  // Метод для получения курса по ID
  const getCourseById = (id: number): Course | null => {
    return store.getItem(id) as Course | null;
  };

  return {
    ...store,
    getCourseById
  };
};
