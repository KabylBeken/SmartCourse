import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse } from './types';

// Создаем настроенный инстанс axios
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Для передачи cookie в кросс-доменных запросах
});

// Добавляем интерцептор запросов для вставки токена в заголовки
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Добавляем интерцептор ответов для глобальной обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Обработка 401 ошибки - неавторизованный доступ
    if (error.response?.status === 401) {
      // Очищаем токен и перенаправляем на страницу входа
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Упрощенная обертка над GET запросом
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    console.log(`Выполняется GET запрос на: ${url}`);
    const response = await apiClient.get<T>(url, config);
    console.log(`Успешный ответ GET ${url}:`, response.data);
    return { data: response.data };
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Ошибка при GET запросе ${url}:`, err);
    
    // Дополнительная информация об ошибке
    if (err.response) {
      console.error(`Статус: ${err.response.status}, Данные:`, err.response.data);
    } else if (err.request) {
      console.error(`Ошибка запроса:`, err.request);
    } else {
      console.error(`Ошибка настройки:`, err.message);
    }
    
    const errorMsg = err.response?.data?.error || 
                    (err.response?.data?.message) || 
                    err.message || 
                    'Произошла ошибка при выполнении запроса';
    return { error: errorMsg, status: err.response?.status };
  }
};

// Упрощенная обертка над POST запросом
export const post = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    console.log(`Выполняется POST запрос на: ${url}`, data);
    const response = await apiClient.post<T>(url, data, config);
    console.log(`Успешный ответ POST ${url}:`, response.data);
    return { data: response.data };
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Ошибка при POST запросе ${url}:`, err);
    
    // Дополнительная информация об ошибке
    if (err.response) {
      console.error(`Статус: ${err.response.status}, Данные:`, err.response.data);
    } else if (err.request) {
      console.error(`Ошибка запроса:`, err.request);
    } else {
      console.error(`Ошибка настройки:`, err.message);
    }
    
    const errorMsg = err.response?.data?.error || 
                    (err.response?.data?.message) || 
                    err.message || 
                    'Произошла ошибка при выполнении запроса';
    return { error: errorMsg, status: err.response?.status };
  }
};

// Упрощенная обертка над PUT запросом
export const put = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    console.log(`Выполняется PUT запрос на: ${url}`, data);
    const response = await apiClient.put<T>(url, data, config);
    console.log(`Успешный ответ PUT ${url}:`, response.data);
    return { data: response.data };
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Ошибка при PUT запросе ${url}:`, err);
    
    // Дополнительная информация об ошибке
    if (err.response) {
      console.error(`Статус: ${err.response.status}, Данные:`, err.response.data);
    } else if (err.request) {
      console.error(`Ошибка запроса:`, err.request);
    } else {
      console.error(`Ошибка настройки:`, err.message);
    }
    
    const errorMsg = err.response?.data?.error || 
                    (err.response?.data?.message) || 
                    err.message || 
                    'Произошла ошибка при выполнении запроса';
    return { error: errorMsg, status: err.response?.status };
  }
};

// Упрощенная обертка над DELETE запросом
export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    console.log(`Выполняется DELETE запрос на: ${url}`);
    const response = await apiClient.delete<T>(url, config);
    console.log(`Успешный ответ DELETE ${url}:`, response.data);
    return { data: response.data };
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Ошибка при DELETE запросе ${url}:`, err);
    
    // Дополнительная информация об ошибке
    if (err.response) {
      console.error(`Статус: ${err.response.status}, Данные:`, err.response.data);
    } else if (err.request) {
      console.error(`Ошибка запроса:`, err.request);
    } else {
      console.error(`Ошибка настройки:`, err.message);
    }
    
    const errorMsg = err.response?.data?.error || 
                    (err.response?.data?.message) || 
                    err.message || 
                    'Произошла ошибка при выполнении запроса';
    return { error: errorMsg, status: err.response?.status };
  }
};

export default apiClient;
