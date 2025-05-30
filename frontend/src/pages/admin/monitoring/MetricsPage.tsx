import { useState, useEffect } from 'react';
import adminService, { Metric } from '@/shared/api/adminService';

const MetricsPage = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterName, setFilterName] = useState<string>('');
  
  // Загрузка метрик
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const response = await adminService.getMetrics();
        if (response.data) {
          setMetrics(response.data);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Ошибка при загрузке метрик');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);
  
  // Уникальные имена метрик для фильтрации
  const uniqueNames = [...new Set(metrics.map(metric => metric.name))];
  
  // Фильтрация метрик
  const filteredMetrics = metrics.filter(metric => {
    return !filterName || metric.name === filterName;
  });
  
  // Форматирование меток метрики
  const formatLabels = (labels: Record<string, string>) => {
    return Object.entries(labels)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Метрики системы</h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {/* Фильтры */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name-filter" className="block text-sm font-medium text-gray-700">
            Имя метрики
          </label>
          <select
            id="name-filter"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Все метрики</option>
            {uniqueNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка метрик...</p>
        </div>
      ) : (
        <div>
          {filteredMetrics.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMetrics.map((metric, index) => (
                <div key={`${metric.name}-${index}`} className="rounded-lg bg-white p-6 shadow-md">
                  <h2 className="mb-2 text-xl font-semibold">{metric.name}</h2>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-blue-600">{metric.value}</span>
                  </div>
                  {Object.keys(metric.labels).length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">Метки:</span>
                      <div className="mt-1 text-sm">
                        {formatLabels(metric.labels)}
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    Последнее обновление: {new Date(metric.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Метрики не найдены или не соответствуют выбранным фильтрам.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsPage;
