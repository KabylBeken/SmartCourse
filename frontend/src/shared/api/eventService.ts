import { get } from './apiClient';
import type { ApiResponse, Event } from './types';

const eventService = {
  // Администратор - получение всех событий
  getEvents: async (): Promise<ApiResponse<Event[]>> => {
    return await get<Event[]>('/api/admin/events');
  },
  
  // Администратор - получение событий по типу
  getEventsByType: async (type: string): Promise<ApiResponse<Event[]>> => {
    return await get<Event[]>(`/api/admin/events?type=${type}`);
  },
  
  // Администратор - получение событий по типу сущности
  getEventsByEntityType: async (entityType: string): Promise<ApiResponse<Event[]>> => {
    return await get<Event[]>(`/api/admin/events?entity_type=${entityType}`);
  },
  
  // Администратор - получение событий по ID сущности
  getEventsByEntityId: async (entityId: number): Promise<ApiResponse<Event[]>> => {
    return await get<Event[]>(`/api/admin/events?entity_id=${entityId}`);
  },
  
  // Администратор - получение событий по ID пользователя
  getEventsByUserId: async (userId: number): Promise<ApiResponse<Event[]>> => {
    return await get<Event[]>(`/api/admin/events?user_id=${userId}`);
  },
  
  // Администратор - получение событий за период времени
  getEventsByDateRange: async (startDate: string, endDate: string): Promise<ApiResponse<Event[]>> => {
    return await get<Event[]>(`/api/admin/events?start_date=${startDate}&end_date=${endDate}`);
  }
};

export default eventService;
