import type { ReactNode } from 'react';
import userService from '@/shared/api/userService';
import type { UserData } from '@/shared/api/types';
import {
  createStoreContext,
  createStoreProvider,
  createStoreHook,
} from './StoreContext';
import type { StoreContextType } from './StoreContext';

// Создаем контекст для пользователей
const UsersContext = createStoreContext<UserData[]>();

// Создаем функцию получения данных
const fetchUsers = async (params?: any) => {
  if (params?.userId) {
    return await userService.getUser(params.userId);
  }
  if (params?.profile) {
    return await userService.getProfile();
  }
  return await userService.getUsers();
};

// Создаем провайдер
export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const Provider = createStoreProvider<UserData[]>(UsersContext, fetchUsers, 300000); // 5 минут кэширования
  return <Provider>{children}</Provider>;
};

// Создаем хук для использования контекста
export const useUsers = createStoreHook<UserData[]>(UsersContext);

// Расширенный интерфейс для работы с пользователями
export interface UserStoreExtended extends StoreContextType<UserData[]> {
  getUserById: (id: number) => UserData | null;
  getUsersByRole: (role: string) => UserData[];
  getUserProfile: () => Promise<void>;
  getUsersForPagination: (page: number, pageSize: number) => UserData[];
  getTotalPages: (pageSize: number) => number;
}

// Расширенный хук для пользователей с дополнительными методами
export const useUserStore = (): UserStoreExtended => {
  const store = useUsers();

  // Метод для получения пользователя по ID
  const getUserById = (id: number): UserData | null => {
    return store.getItem(id) as UserData | null;
  };

  // Метод для получения пользователей по роли
  const getUsersByRole = (role: string): UserData[] => {
    if (!store.state.data) return [];
    return store.state.data.filter(user => user.role === role);
  };

  // Метод для получения профиля текущего пользователя
  const getUserProfile = async (): Promise<void> => {
    await store.fetchData({ profile: true });
  };

  // Метод для пагинации пользователей
  const getUsersForPagination = (page: number, pageSize: number): UserData[] => {
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
    getUserById,
    getUsersByRole,
    getUserProfile,
    getUsersForPagination,
    getTotalPages
  };
};
