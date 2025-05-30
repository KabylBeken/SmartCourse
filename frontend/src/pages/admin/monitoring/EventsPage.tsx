import { useState, useEffect } from 'react';
import adminService, { Event } from '@/shared/api/adminService';

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  
  // Загрузка событий
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await adminService.getEvents();
        if (response.data) {
          setEvents(response.data);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке событий');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Уникальные типы событий для фильтрации
  const uniqueTypes = [...new Set(events.map(event => event.type))];
  const uniqueEntityTypes = [...new Set(events.map(event => event.entity_type))];
  
  // Фильтрация событий
  const filteredEvents = events.filter(event => {
    const typeMatch = !filterType || event.type === filterType;
    const entityTypeMatch = !filterEntityType || event.entity_type === filterEntityType;
    return typeMatch && entityTypeMatch;
  });
  
  // Форматирование данных события для отображения
  const formatEventData = (data: any) => {
    if (!data) return '—';
    
    try {
      if (typeof data === 'string') {
        // Если данные уже в строковом формате, пробуем распарсить JSON
        try {
          const parsed = JSON.parse(data);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return data;
        }
      }
      // Если данные в формате объекта, преобразуем в строку
      return JSON.stringify(data, null, 2);
    } catch (err) {
      return 'Ошибка отображения данных';
    }
  };
  
  // Получение цвета для типа события
  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'create': return 'text-green-600 bg-green-100';
      case 'update': return 'text-blue-600 bg-blue-100';
      case 'delete': return 'text-red-600 bg-red-100';
      case 'login': return 'text-purple-600 bg-purple-100';
      case 'logout': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">События системы</h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {/* Фильтры */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
            Тип события
          </label>
          <select
            id="type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Все типы</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="entity-type-filter" className="block text-sm font-medium text-gray-700">
            Тип сущности
          </label>
          <select
            id="entity-type-filter"
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Все сущности</option>
            {uniqueEntityTypes.map(entityType => (
              <option key={entityType} value={entityType}>{entityType}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка событий...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {filteredEvents.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сущность</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID сущности</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Данные</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{event.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.entity_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.entity_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.user_id}</td>
                    <td className="px-6 py-4">
                      <pre className="text-xs overflow-x-auto max-w-xs">
                        {formatEventData(event.data)}
                      </pre>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              События не найдены или не соответствуют выбранным фильтрам.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
