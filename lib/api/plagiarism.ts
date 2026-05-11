import { apiClient } from "@/lib/auth/api-client"
import { pollJob, type JobStatus } from "./jobs"

export interface PlagiarismPair {
  student_a: number
  student_b: number
  student_a_name: string
  student_b_name: string
  submission_a: number
  submission_b: number
  similarity: number
  snippet_a: string
  snippet_b: string
}

export interface PlagiarismReport {
  id: number
  assignment_id: number
  scan_id: string
  doc_count: number
  avg_similarity: number
  max_similarity: number
  created_at: string
  pairs: PlagiarismPair[]
}

export async function startPlagiarismScan(assignmentId: number): Promise<{ job_id: string }> {
  return apiClient.post(`/api/teacher/assignments/${assignmentId}/plagiarism/scan`, {})
}

export async function getLatestPlagiarismReport(assignmentId: number): Promise<PlagiarismReport> {
  return apiClient.get(`/api/teacher/assignments/${assignmentId}/plagiarism`)
}

export async function runPlagiarismScan(
  assignmentId: number,
  onUpdate?: (s: JobStatus) => void,
): Promise<PlagiarismReport> {
  const { job_id } = await startPlagiarismScan(assignmentId)
  const st = await pollJob(job_id, { onUpdate })
  if (st.status === "failed") throw new Error(st.error ?? "Scan failed")
  return st.result as PlagiarismReport
}
