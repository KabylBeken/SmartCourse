"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiClient } from "./api-client"

// Типы соответствующие Go backend
export type UserRole = "admin" | "teacher" | "student"

export interface User {
  id: number
  username: string
  role: UserRole
  name?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  role?: UserRole
  name?: string
  email?: string
}

interface AuthResponse {
  token: string
  user: User
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Загружаем пользователя из localStorage при инициализации
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    }
    setIsLoading(false)
  }, [])

  // POST /auth/login
  const login = async (credentials: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
      { skipAuth: true }
    )

    localStorage.setItem("token", response.token)
    localStorage.setItem("user", JSON.stringify(response.user))
    setUser(response.user)
  }

  // POST /auth/register
  const register = async (data: RegisterRequest) => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      {
        username: data.username,
        password: data.password,
        role: data.role || "student",
      },
      { skipAuth: true }
    )

    localStorage.setItem("token", response.token)
    localStorage.setItem("user", JSON.stringify(response.user))
    setUser(response.user)
  }

  // Выход
  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
