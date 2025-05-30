import type { ReactNode } from 'react';
import assignmentService from '@/shared/api/assignmentService';
import type { Assignment } from '@/shared/api/types';
import {
  createStoreContext,
  createStoreProvider,
  createStoreHook,
} from './StoreContext';
import type { StoreContextType } from './StoreContext';

// Создаем контекст для заданий
const AssignmentsContext = createStoreContext<Assignment[]>();

// Создаем функцию получения данных
const fetchAssignments = async (params?: any) => {
  if (params?.assignmentId) {
    return await assignmentService.getAssignment(params.assignmentId);
  }
  if (params?.courseId) {
    return await assignmentService.getCourseAssignments(params.courseId);
  }
  // По умолчанию возвращаем пустой массив
  return { data: [] };
};

// Создаем провайдер
export const AssignmentsProvider = ({ children }: { children: ReactNode }) => {
  const Provider = createStoreProvider<Assignment[]>(AssignmentsContext, fetchAssignments, 300000); // 5 минут кэширования
  return <Provider>{children}</Provider>;
};

// Создаем хук для использования контекста
export const useAssignments = createStoreHook<Assignment[]>(AssignmentsContext);

// Расширенный интерфейс для работы с заданиями
export interface AssignmentStoreExtended extends StoreContextType<Assignment[]> {
  getAssignmentById: (id: number) => Assignment | null;
  getAssignmentsByCourse: (courseId: number) => Promise<void>;
  getAssignmentsForPagination: (page: number, pageSize: number) => Assignment[];
  getTotalPages: (pageSize: number) => number;
}

// Расширенный хук для заданий с дополнительными методами
export const useAssignmentStore = (): AssignmentStoreExtended => {
  const store = useAssignments();

  // Метод для получения задания по ID
  const getAssignmentById = (id: number): Assignment | null => {
    return store.getItem(id) as Assignment | null;
  };

  // Метод для получения заданий по курсу
  const getAssignmentsByCourse = async (courseId: number): Promise<void> => {
    await store.fetchData({ courseId });
  };

  // Метод для пагинации заданий
  const getAssignmentsForPagination = (page: number, pageSize: number): Assignment[] => {
    if (!store.state.data) return [];
    const startIndex = (page - 1) * pageSize;
    return store.state.data.slice(startIndex, startIndex + pageSize);
  };

  // Метод для получения общего количества страниц
  const getTotalPages = (pageSize: number): number => {
    if (!store.state.data) return 0;
    return Math.ceil(store.state.data.length / pageSize);
  };

  return {
    ...store,
    getAssignmentById,
    getAssignmentsByCourse,
    getAssignmentsForPagination,
    getTotalPages
  };
};
