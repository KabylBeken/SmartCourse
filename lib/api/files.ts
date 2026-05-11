import { apiClient } from "@/lib/auth/api-client"

export interface UploadedFile {
  key: string
  url: string
  bucket: string
  content_type: string
  size: number
  filename: string
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const fd = new FormData()
  fd.append("file", file)
  return apiClient.postForm<UploadedFile>("/api/teacher/files/upload", fd)
}

export async function presignFile(key: string): Promise<string> {
  const res = await apiClient.get<{ url: string; key: string }>(
    `/api/teacher/files/${encodeURIComponent(key)}/presign`,
  )
  return res.url
}

export async function deleteFile(key: string): Promise<void> {
  await apiClient.delete(`/api/teacher/files/${encodeURIComponent(key)}`)
}
