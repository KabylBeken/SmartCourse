/**
 * API Client для работы с Go backend
 * Базовый URL: http://localhost:8080
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8083"

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

// Получить токен из localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

// Базовый fetch с авторизацией
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  }

  if (!skipAuth) {
    const token = getToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  // Обработка 401 - редирект на логин
  if (response.status === 401 && !skipAuth) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    throw new Error("Требуется авторизация")
  }

  // Обработка ошибок
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Ошибка: ${response.status}`)
  }

  // Если нет контента
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// API Client объект
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, { ...options, method: "DELETE" }),

  postForm: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    }),
}

export default apiClient
