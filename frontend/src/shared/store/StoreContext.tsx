import { createContext, useContext, ReactNode, useReducer, useCallback, useState, useEffect } from 'react';

// Базовый интерфейс для состояния любого хранилища
export interface StoreState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Тип данных для кэша
export interface CacheData<T> {
  [key: string]: {
    data: T;
    timestamp: number;
    expiry: number;
  };
}

// Базовые действия для редьюсера
export type StoreAction<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T; meta?: any }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'SET_DATA'; payload: T }
  | { type: 'CLEAR_DATA' }
  | { type: 'UPDATE_ITEM'; payload: Partial<T>; id: number | string; idField?: string };

// Функция для создания начального состояния
export const createInitialState = <T,>(): StoreState<T> => ({
  data: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
});

// Базовый редьюсер для всех хранилищ
export function createReducer<T>() {
  return (state: StoreState<T>, action: StoreAction<T>): StoreState<T> => {
    switch (action.type) {
      case 'FETCH_START':
        return {
          ...state,
          isLoading: true,
          error: null,
        };
      case 'FETCH_SUCCESS':
        return {
          ...state,
          data: action.payload,
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        };
      case 'FETCH_ERROR':
        return {
          ...state,
          isLoading: false,
          error: action.error,
        };
      case 'SET_DATA':
        return {
          ...state,
          data: action.payload,
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        };
      case 'CLEAR_DATA':
        return {
          ...state,
          data: null,
          error: null,
        };
      case 'UPDATE_ITEM':
        if (Array.isArray(state.data)) {
          const idField = action.idField || 'id';
          return {
            ...state,
            data: state.data.map((item: any) => {
              if (item[idField] === action.id) {
                return { ...item, ...action.payload };
              }
              return item;
            }) as T,
            lastUpdated: Date.now(),
          };
        }
        return state;
      default:
        return state;
    }
  };
}

// Интерфейс контекста хранилища
export interface StoreContextType<T> {
  state: StoreState<T>;
  dispatch: React.Dispatch<StoreAction<T>>;
  fetchData: (params?: any) => Promise<void>;
  getItem: (id: number | string, idField?: string) => any;
  setData: (data: T) => void;
  clearData: () => void;
  updateItem: (id: number | string, updates: Partial<T>, idField?: string) => void;
}

// Создание контекста хранилища
export function createStoreContext<T>() {
  return createContext<StoreContextType<T> | undefined>(undefined);
}

// Провайдер для контекста хранилища
export function createStoreProvider<T>(
  Context: React.Context<StoreContextType<T> | undefined>,
  fetchFunction: (params?: any) => Promise<{ data?: T; error?: string }>,
  cacheTime: number = 300000 // 5 минут по умолчанию
) {
  return ({ children }: { children: ReactNode }) => {
    const reducer = createReducer<T>();
    const [state, dispatch] = useReducer(reducer, createInitialState<T>());
    const [cache, setCache] = useState<CacheData<T>>({});

    // Очистка кэша при монтировании компонента
    useEffect(() => {
      const now = Date.now();
      const newCache = { ...cache };
      let hasChanged = false;

      // Удаляем просроченные записи кэша
      Object.keys(newCache).forEach(key => {
        if (newCache[key].expiry < now) {
          delete newCache[key];
          hasChanged = true;
        }
      });

      if (hasChanged) {
        setCache(newCache);
      }
    }, [cache]);

    // Функция для получения данных с использованием кэширования
    const fetchData = useCallback(async (params?: any) => {
      const cacheKey = params ? JSON.stringify(params) : 'default';
      const now = Date.now();

      // Проверяем кэш
      if (cache[cacheKey] && cache[cacheKey].expiry > now) {
        dispatch({ type: 'FETCH_SUCCESS', payload: cache[cacheKey].data });
        return;
      }

      dispatch({ type: 'FETCH_START' });
      try {
        const response = await fetchFunction(params);
        if (response.data) {
          // Сохраняем в состоянии
          dispatch({ type: 'FETCH_SUCCESS', payload: response.data });
          
          // Сохраняем в кэше
          setCache(prev => ({
            ...prev,
            [cacheKey]: {
              data: response.data as T,
              timestamp: now,
              expiry: now + cacheTime
            }
          }));
        } else if (response.error) {
          dispatch({ type: 'FETCH_ERROR', error: response.error });
        }
      } catch (error) {
        let errorMessage = 'Неизвестная ошибка';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch({ type: 'FETCH_ERROR', error: errorMessage });
      }
    }, [cache, fetchFunction, cacheTime]);

    // Функция для получения элемента по ID
    const getItem = useCallback((id: number | string, idField: string = 'id') => {
      if (Array.isArray(state.data)) {
        return state.data.find((item: any) => item[idField] === id) || null;
      }
      return null;
    }, [state.data]);

    // Функция для установки данных напрямую
    const setData = useCallback((data: T) => {
      dispatch({ type: 'SET_DATA', payload: data });
    }, []);

    // Функция для очистки данных
    const clearData = useCallback(() => {
      dispatch({ type: 'CLEAR_DATA' });
    }, []);

    // Функция для обновления элемента по ID
    const updateItem = useCallback((id: number | string, updates: Partial<T>, idField: string = 'id') => {
      dispatch({ type: 'UPDATE_ITEM', id, payload: updates, idField });
    }, []);

    const value = {
      state,
      dispatch,
      fetchData,
      getItem,
      setData,
      clearData,
      updateItem
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };
}

// Создание хука для использования контекста
export function createStoreHook<T>(Context: React.Context<StoreContextType<T> | undefined>) {
  return () => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error('useStore должен использоваться внутри StoreProvider');
    }
    return context;
  };
}
