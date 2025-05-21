import type { ReactNode } from 'react';
import logService from '@/shared/api/logService';
import eventService from '@/shared/api/eventService';
import type { Log, Event, LogLevelType } from '@/shared/api/types';
import {
  createStoreContext,
  createStoreProvider,
  createStoreHook,
} from './StoreContext';
import type { StoreContextType } from './StoreContext';

// --- Контекст для логов ---
const LogsContext = createStoreContext<Log[]>();

// Функция получения логов
const fetchLogs = async (params?: any) => {
  if (params?.level) {
    return await logService.getLogsByLevel(params.level as LogLevelType);
  }
  if (params?.source) {
    return await logService.getLogsBySource(params.source);
  }
  if (params?.search) {
    return await logService.searchLogs(params.search);
  }
  if (params?.startDate && params?.endDate) {
    return await logService.getLogsByDateRange(params.startDate, params.endDate);
  }
  return await logService.getLogs();
};

// Провайдер для логов
export const LogsProvider = ({ children }: { children: ReactNode }) => {
  const Provider = createStoreProvider<Log[]>(LogsContext, fetchLogs, 120000); // 2 минуты кэширования для логов
  return <Provider>{children}</Provider>;
};

// Базовый хук для логов
export const useLogs = createStoreHook<Log[]>(LogsContext);

// Расширенный интерфейс для работы с логами
export interface LogStoreExtended extends StoreContextType<Log[]> {
  getLogsByLevel: (level: LogLevelType) => Promise<void>;
  getLogsBySource: (source: string) => Promise<void>;
  searchLogs: (query: string) => Promise<void>;
  getLogsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  getLogsForPagination: (page: number, pageSize: number) => Log[];
  getTotalPages: (pageSize: number) => number;
}

// Расширенный хук для логов
export const useLogStore = (): LogStoreExtended => {
  const store = useLogs();

  // Получение логов по уровню
  const getLogsByLevel = async (level: LogLevelType): Promise<void> => {
    await store.fetchData({ level });
  };

  // Получение логов по источнику
  const getLogsBySource = async (source: string): Promise<void> => {
    await store.fetchData({ source });
  };

  // Поиск логов
  const searchLogs = async (query: string): Promise<void> => {
    await store.fetchData({ search: query });
  };

  // Получение логов за период
  const getLogsByDateRange = async (startDate: string, endDate: string): Promise<void> => {
    await store.fetchData({ startDate, endDate });
  };

  // Пагинация логов
  const getLogsForPagination = (page: number, pageSize: number): Log[] => {
    if (!store.state.data) return [];
    const startIndex = (page - 1) * pageSize;
    return store.state.data.slice(startIndex, startIndex + pageSize);
  };

  // Общее количество страниц
  const getTotalPages = (pageSize: number): number => {
    if (!store.state.data) return 0;
    return Math.ceil(store.state.data.length / pageSize);
  };

  return {
    ...store,
    getLogsByLevel,
    getLogsBySource,
    searchLogs,
    getLogsByDateRange,
    getLogsForPagination,
    getTotalPages
  };
};

// --- Контекст для событий ---
const EventsContext = createStoreContext<Event[]>();

// Функция получения событий
const fetchEvents = async (params?: any) => {
  if (params?.type) {
    return await eventService.getEventsByType(params.type);
  }
  if (params?.entityType) {
    return await eventService.getEventsByEntityType(params.entityType);
  }
  if (params?.entityId) {
    return await eventService.getEventsByEntityId(params.entityId);
  }
  if (params?.userId) {
    return await eventService.getEventsByUserId(params.userId);
  }
  if (params?.startDate && params?.endDate) {
    return await eventService.getEventsByDateRange(params.startDate, params.endDate);
  }
  return await eventService.getEvents();
};

// Провайдер для событий
export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const Provider = createStoreProvider<Event[]>(EventsContext, fetchEvents, 180000); // 3 минуты кэширования для событий
  return <Provider>{children}</Provider>;
};

// Базовый хук для событий
export const useEvents = createStoreHook<Event[]>(EventsContext);

// Расширенный интерфейс для работы с событиями
export interface EventStoreExtended extends StoreContextType<Event[]> {
  getEventsByType: (type: string) => Promise<void>;
  getEventsByEntityType: (entityType: string) => Promise<void>;
  getEventsByEntityId: (entityId: number) => Promise<void>;
  getEventsByUserId: (userId: number) => Promise<void>;
  getEventsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  getEventsForPagination: (page: number, pageSize: number) => Event[];
  getTotalPages: (pageSize: number) => number;
}

// Расширенный хук для событий
export const useEventStore = (): EventStoreExtended => {
  const store = useEvents();

  // Получение событий по типу
  const getEventsByType = async (type: string): Promise<void> => {
    await store.fetchData({ type });
  };

  // Получение событий по типу сущности
  const getEventsByEntityType = async (entityType: string): Promise<void> => {
    await store.fetchData({ entityType });
  };

  // Получение событий по ID сущности
  const getEventsByEntityId = async (entityId: number): Promise<void> => {
    await store.fetchData({ entityId });
  };

  // Получение событий по ID пользователя
  const getEventsByUserId = async (userId: number): Promise<void> => {
    await store.fetchData({ userId });
  };

  // Получение событий за период
  const getEventsByDateRange = async (startDate: string, endDate: string): Promise<void> => {
    await store.fetchData({ startDate, endDate });
  };

  // Пагинация событий
  const getEventsForPagination = (page: number, pageSize: number): Event[] => {
    if (!store.state.data) return [];
    const startIndex = (page - 1) * pageSize;
    return store.state.data.slice(startIndex, startIndex + pageSize);
  };

  // Общее количество страниц
  const getTotalPages = (pageSize: number): number => {
    if (!store.state.data) return 0;
    return Math.ceil(store.state.data.length / pageSize);
  };

  return {
    ...store,
    getEventsByType,
    getEventsByEntityType,
    getEventsByEntityId,
    getEventsByUserId,
    getEventsByDateRange,
    getEventsForPagination,
    getTotalPages
  };
};
