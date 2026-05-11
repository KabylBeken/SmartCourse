import { apiClient } from "@/lib/auth/api-client"
import type { Prompt, CreatePromptRequest, UpdatePromptRequest } from "@/lib/types"

export interface PromptQuery {
  search?: string
  category?: string
  visibility?: "all" | "mine" | "public" | "favorites" | "templates"
  tags?: string[]
  collection?: string | null
}

export async function listPrompts(params: PromptQuery = {}): Promise<Prompt[]> {
  const q = new URLSearchParams()
  if (params.search) q.set("search", params.search)
  if (params.category && params.category !== "all") q.set("category", params.category)
  if (params.visibility) q.set("visibility", params.visibility)
  if (params.tags?.length) q.set("tags", params.tags.join(","))
  if (params.collection) q.set("collection", params.collection)
  return apiClient.get<Prompt[]>(`/api/prompts?${q.toString()}`)
}

export async function getPrompt(id: number): Promise<Prompt> {
  return apiClient.get<Prompt>(`/api/prompts/${id}`)
}

export async function createPrompt(data: CreatePromptRequest): Promise<Prompt> {
  return apiClient.post<Prompt>("/api/teacher/prompts", data)
}

export async function updatePrompt(id: number, data: UpdatePromptRequest): Promise<Prompt> {
  return apiClient.put<Prompt>(`/api/teacher/prompts/${id}`, data)
}

export async function deletePrompt(id: number): Promise<void> {
  return apiClient.delete<void>(`/api/teacher/prompts/${id}`)
}

export async function clonePrompt(id: number): Promise<Prompt> {
  return apiClient.post<Prompt>(`/api/teacher/prompts/${id}/clone`)
}

export async function toggleFavorite(id: number, favorite: boolean): Promise<void> {
  return apiClient.post<void>(`/api/teacher/prompts/${id}/favorite`, { is_favorite: favorite })
}

export async function incrementUseCount(id: number, variables?: Record<string, string>): Promise<{ compiled?: string }> {
  return apiClient.post<{ compiled?: string }>(`/api/prompts/${id}/use`, { variables })
}

export interface PromptVersion {
  id: number
  version: number
  title: string
  description?: string
  prompt_text: string
  category: string
  tags?: string[]
  created_at: string
}

export async function listPromptVersions(id: number): Promise<PromptVersion[]> {
  return apiClient.get<PromptVersion[]>(`/api/teacher/prompts/${id}/versions`)
}

export async function revertPromptVersion(id: number, version: number): Promise<Prompt> {
  return apiClient.post<Prompt>(`/api/teacher/prompts/${id}/revert/${version}`)
}

export async function exportPrompts(): Promise<Prompt[]> {
  return apiClient.get<Prompt[]>(`/api/teacher/prompts/export`)
}

export async function importPrompts(items: CreatePromptRequest[]): Promise<{ created: number }>{
  return apiClient.post<{ created: number }>(`/api/teacher/prompts/import`, { items })
}
