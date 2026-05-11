import { apiClient } from "@/lib/auth/api-client"

export type AttachmentTarget = "assignment" | "submission" | "course" | "free"

export interface Attachment {
  id: number
  owner_id: number
  target_type: AttachmentTarget
  target_id?: number | null
  object_key: string
  filename: string
  content_type: string
  size_bytes: number
  created_at: string
  url: string
}

export interface CreateAttachmentInput {
  target_type: AttachmentTarget
  target_id?: number | null
  object_key: string
  filename: string
  content_type: string
  size_bytes: number
}

export async function listAttachments(params: {
  target_type?: AttachmentTarget
  target_id?: number
} = {}): Promise<Attachment[]> {
  const qs = new URLSearchParams()
  if (params.target_type) qs.set("target_type", params.target_type)
  if (params.target_id) qs.set("target_id", String(params.target_id))
  const q = qs.toString()
  return apiClient.get<Attachment[]>(`/api/teacher/attachments${q ? "?" + q : ""}`)
}

export async function createAttachment(input: CreateAttachmentInput): Promise<Attachment> {
  return apiClient.post<Attachment>("/api/teacher/attachments", input)
}

export async function deleteAttachment(id: number): Promise<void> {
  await apiClient.delete(`/api/teacher/attachments/${id}`)
}
