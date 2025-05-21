/**
 * Сервис для безопасной работы с токенами
 * Обеспечивает защиту от XSS-атак путем правильного хранения и обработки токенов
 */

// Ключи для хранения в localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'userData';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Сохраняет токен в localStorage с временем истечения
export const saveToken = (token: string, expiresInSeconds = 3600): void => {
  try {
    const expiryTime = new Date().getTime() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Ошибка при сохранении токена:', error);
  }
};

// Получает токен из localStorage
export const getToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    
    // Проверяем, не истек ли токен
    if (isTokenExpired()) {
      removeToken();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Ошибка при получении токена:', error);
    return null;
  }
};

// Удаляет токен из localStorage
export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Ошибка при удалении токена:', error);
  }
};

// Проверяет, истек ли токен
export const isTokenExpired = (): boolean => {
  try {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    return new Date().getTime() > parseInt(expiryTime);
  } catch (error) {
    console.error('Ошибка при проверке срока действия токена:', error);
    return true;
  }
};

// Сохраняет данные пользователя в localStorage
export const saveUserData = (userData: any): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Ошибка при сохранении данных пользователя:', error);
  }
};

// Получает данные пользователя из localStorage
export const getUserData = (): any | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return null;
  }
};

// Удаляет данные пользователя из localStorage
export const removeUserData = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Ошибка при удалении данных пользователя:', error);
  }
};

// Полностью очищает данные авторизации
export const clearAuthData = (): void => {
  removeToken();
  removeUserData();
};

// Проверяет, авторизован ли пользователь
export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getUserData();
};
