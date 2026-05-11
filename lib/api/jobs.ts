import { apiClient } from "@/lib/auth/api-client"

export type JobStatusType = "queued" | "running" | "done" | "failed"

export interface JobStatus {
  id: string
  status: JobStatusType
  progress: number
  result?: unknown
  error?: string
  updated_at: string
}

export async function enqueueJob(type: string, payload: unknown): Promise<{ job_id: string }> {
  return apiClient.post<{ job_id: string; status: string }>("/api/teacher/jobs", {
    type,
    payload,
  })
}

export async function getJobStatus(id: string): Promise<JobStatus> {
  return apiClient.get<JobStatus>(`/api/teacher/jobs/${id}`)
}

/** Polling helper для одной задачи. */
export async function pollJob(
  id: string,
  opts: { intervalMs?: number; timeoutMs?: number; onUpdate?: (s: JobStatus) => void } = {},
): Promise<JobStatus> {
  const { intervalMs = 1000, timeoutMs = 120_000, onUpdate } = opts
  const start = Date.now()
  while (true) {
    const st = await getJobStatus(id)
    onUpdate?.(st)
    if (st.status === "done" || st.status === "failed") return st
    if (Date.now() - start > timeoutMs) throw new Error("job timeout")
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}
