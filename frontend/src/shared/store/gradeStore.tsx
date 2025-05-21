import type { ReactNode } from 'react';
import gradeService from '@/shared/api/gradeService';
import type { Grade } from '@/shared/api/types';
import {
  createStoreContext,
  createStoreProvider,
  createStoreHook,
} from './StoreContext';
import type { StoreContextType } from './StoreContext';

// Создаем контекст для оценок
const GradesContext = createStoreContext<Grade[]>();

// Создаем функцию получения данных
const fetchGrades = async (params?: any) => {
  if (params?.gradeId) {
    return await gradeService.getGrade(params.gradeId);
  }
  if (params?.assignmentId) {
    return await gradeService.getAssignmentGrades(params.assignmentId);
  }
  // Для студента - получение всех его оценок
  if (params?.studentView) {
    return await gradeService.getStudentGrades();
  }
  return { data: [] };
};

// Создаем провайдер
export const GradesProvider = ({ children }: { children: ReactNode }) => {
  const Provider = createStoreProvider<Grade[]>(GradesContext, fetchGrades, 300000); // 5 минут кэширования
  return <Provider>{children}</Provider>;
};

// Создаем хук для использования контекста
export const useGrades = createStoreHook<Grade[]>(GradesContext);

// Расширенный интерфейс для работы с оценками
export interface GradeStoreExtended extends StoreContextType<Grade[]> {
  getGradeById: (id: number) => Grade | null;
  getGradesByAssignment: (assignmentId: number) => Promise<void>;
  getStudentGrades: () => Promise<void>;
  getGradesForPagination: (page: number, pageSize: number) => Grade[];
  getTotalPages: (pageSize: number) => number;
  getAverageScore: () => number;
}

// Расширенный хук для оценок с дополнительными методами
export const useGradeStore = (): GradeStoreExtended => {
  const store = useGrades();

  // Метод для получения оценки по ID
  const getGradeById = (id: number): Grade | null => {
    return store.getItem(id) as Grade | null;
  };

  // Метод для получения оценок по заданию
  const getGradesByAssignment = async (assignmentId: number): Promise<void> => {
    await store.fetchData({ assignmentId });
  };

  // Метод для получения оценок студента
  const getStudentGrades = async (): Promise<void> => {
    await store.fetchData({ studentView: true });
  };

  // Метод для пагинации оценок
  const getGradesForPagination = (page: number, pageSize: number): Grade[] => {
    if (!store.state.data) return [];
    const startIndex = (page - 1) * pageSize;
    return store.state.data.slice(startIndex, startIndex + pageSize);
  };

  // Метод для получения общего количества страниц
  const getTotalPages = (pageSize: number): number => {
    if (!store.state.data) return 0;
    return Math.ceil(store.state.data.length / pageSize);
  };

  // Метод для расчета средней оценки
  const getAverageScore = (): number => {
    if (!store.state.data || store.state.data.length === 0) return 0;
    
    const totalScore = store.state.data.reduce((sum, grade) => sum + grade.score, 0);
    return parseFloat((totalScore / store.state.data.length).toFixed(2));
  };

  return {
    ...store,
    getGradeById,
    getGradesByAssignment,
    getStudentGrades,
    getGradesForPagination,
    getTotalPages,
    getAverageScore
  };
};
