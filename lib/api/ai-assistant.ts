import { apiClient } from "@/lib/auth/api-client"
import { pollJob, type JobStatus } from "./jobs"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LessonStep {
  stage: string
  duration: number
  activity: string
}

export interface LessonPlanResult {
  title: string
  objectives: string[]
  outline: LessonStep[]
  materials: string[]
  assessment: string
  homework: string
  reflection: string
}

export interface TestMCQ {
  question: string
  options: string[] // 4 нұсқа
  correct_index: number
  explanation: string
  difficulty: string
}

export interface TestGenerateResult {
  topic: string
  questions: TestMCQ[]
}

export interface ImproveResult {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  examples: string[]
  tone: string
  overall_score: number
}

// ── Enqueue helpers ───────────────────────────────────────────────────────────

export async function enqueueLessonPlan(params: {
  topic: string
  gradeLevel?: string
  duration?: number
  bloomLevel?: string
  language?: string
}): Promise<{ job_id: string }> {
  return apiClient.post("/api/teacher/ai/lesson-plan", {
    topic: params.topic,
    grade_level: params.gradeLevel ?? "",
    duration: params.duration ?? 45,
    bloom_level: params.bloomLevel ?? "",
    language: params.language ?? "ru",
  })
}

export async function enqueueTestGenerate(params: {
  topic: string
  count: number
  difficulty: string
  language?: string
}): Promise<{ job_id: string }> {
  return apiClient.post("/api/teacher/ai/test-generate", {
    topic: params.topic,
    count: params.count,
    difficulty: params.difficulty,
    language: params.language ?? "ru",
  })
}

export async function enqueueImprove(params: {
  submissionText: string
  assignmentName?: string
  currentFeedback?: string
  language?: string
}): Promise<{ job_id: string }> {
  return apiClient.post("/api/teacher/ai/improve", {
    submission_text: params.submissionText,
    assignment_name: params.assignmentName ?? "",
    current_feedback: params.currentFeedback ?? "",
    language: params.language ?? "ru",
  })
}

// ── Poll + typed result ───────────────────────────────────────────────────────

export async function runLessonPlan(
  params: Parameters<typeof enqueueLessonPlan>[0],
  onUpdate?: (s: JobStatus) => void,
): Promise<LessonPlanResult> {
  const { job_id } = await enqueueLessonPlan(params)
  const st = await pollJob(job_id, { onUpdate })
  if (st.status === "failed") throw new Error(st.error ?? "AI job failed")
  return st.result as LessonPlanResult
}

export async function runTestGenerate(
  params: Parameters<typeof enqueueTestGenerate>[0],
  onUpdate?: (s: JobStatus) => void,
): Promise<TestGenerateResult> {
  const { job_id } = await enqueueTestGenerate(params)
  const st = await pollJob(job_id, { onUpdate })
  if (st.status === "failed") throw new Error(st.error ?? "AI job failed")
  return st.result as TestGenerateResult
}

export async function runImprove(
  params: Parameters<typeof enqueueImprove>[0],
  onUpdate?: (s: JobStatus) => void,
): Promise<ImproveResult> {
  const { job_id } = await enqueueImprove(params)
  const st = await pollJob(job_id, { onUpdate })
  if (st.status === "failed") throw new Error(st.error ?? "AI job failed")
  return st.result as ImproveResult
}
