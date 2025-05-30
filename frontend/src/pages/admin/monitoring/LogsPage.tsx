import { useState, useEffect } from 'react';
import adminService, { Log } from '@/shared/api/adminService';

const LogsPage = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('');
  
  // Загрузка логов
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await adminService.getLogs();
        if (response.data) {
          setLogs(response.data);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке логов');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);
  
  // Уникальные модули для фильтрации
  const uniqueModules = [...new Set(logs.map(log => log.module))];
  
  // Фильтрация логов
  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'all' || log.level === filterLevel;
    const moduleMatch = !filterModule || log.module === filterModule;
    return levelMatch && moduleMatch;
  });
  
  // Получение цвета для уровня лога
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'debug': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Логи системы</h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {/* Фильтры */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="level-filter" className="block text-sm font-medium text-gray-700">
            Уровень логов
          </label>
          <select
            id="level-filter"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="all">Все уровни</option>
            <option value="error">Ошибки</option>
            <option value="warning">Предупреждения</option>
            <option value="info">Информация</option>
            <option value="debug">Отладка</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="module-filter" className="block text-sm font-medium text-gray-700">
            Модуль
          </label>
          <select
            id="module-filter"
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Все модули</option>
            {uniqueModules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка логов...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Уровень</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Модуль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сообщение</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{log.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{log.module}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{log.user_id}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-md break-words">{log.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Логи не найдены или не соответствуют выбранным фильтрам.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LogsPage;
