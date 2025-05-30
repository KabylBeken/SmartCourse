import { get } from './apiClient';
import type { ApiResponse, Log, LogLevelType } from './types';

const logService = {
  // Администратор - получение всех логов
  getLogs: async (): Promise<ApiResponse<Log[]>> => {
    return await get<Log[]>('/api/admin/logs');
  },
  
  // Администратор - получение логов по уровню
  getLogsByLevel: async (level: LogLevelType): Promise<ApiResponse<Log[]>> => {
    return await get<Log[]>(`/api/admin/logs?level=${level}`);
  },
  
  // Администратор - получение логов по источнику
  getLogsBySource: async (source: string): Promise<ApiResponse<Log[]>> => {
    return await get<Log[]>(`/api/admin/logs?source=${source}`);
  },
  
  // Администратор - получение логов за период времени
  getLogsByDateRange: async (startDate: string, endDate: string): Promise<ApiResponse<Log[]>> => {
    return await get<Log[]>(`/api/admin/logs?start_date=${startDate}&end_date=${endDate}`);
  },
  
  // Администратор - поиск логов по тексту сообщения
  searchLogs: async (query: string): Promise<ApiResponse<Log[]>> => {
    return await get<Log[]>(`/api/admin/logs?search=${query}`);
  }
};

export default logService;
