import { apiClient } from "@/lib/auth/api-client"

export interface TutorMessage {
  id: number
  session_id: number
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface TutorSession {
  id: number
  student_id: number
  assignment_id: number
  created_at: string
}

export interface TutorSessionResponse {
  session: TutorSession
  messages: TutorMessage[]
}

export async function getTutorSession(assignmentId: number): Promise<TutorSessionResponse> {
  return apiClient.get(`/api/student/assignments/${assignmentId}/tutor`)
}

export async function clearTutorHistory(assignmentId: number): Promise<void> {
  return apiClient.delete(`/api/student/assignments/${assignmentId}/tutor`)
}

/**
 * streamTutorMessage — SSE streaming хабарлама жіберу.
 * onChunk(delta) — әр бөлік келген сайын шақырылады.
 * Returns full assembled response.
 */
export async function streamTutorMessage(
  assignmentId: number,
  content: string,
  onChunk: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token") ?? ""
    : ""

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083"

  const res = await fetch(
    `${baseUrl}/api/student/assignments/${assignmentId}/tutor/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
      signal,
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Stream error ${res.status}: ${text}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  let buffer = ""
  let full = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const payload = line.slice(6).trim()
      if (payload === "[DONE]") {
        return full
      }
      try {
        const parsed = JSON.parse(payload) as { delta: string }
        if (parsed.delta) {
          full += parsed.delta
          onChunk(parsed.delta)
        }
      } catch {
        // skip malformed chunk
      }
    }
  }
  return full
}
