/**
 * AI клиент: шақырулар Next.js API арқылы (OpenRouter кілті серверде — OPENROUTER_API_KEY).
 */

export interface AIFeedbackRequest {
  assignmentTitle: string
  score: number
  maxScore: number
  existingFeedback?: string
}

export interface AIFeedbackResponse {
  feedback: string
  suggestions: string[]
  encouragement: string
}

export interface EssayCriterion {
  id?: number
  name: string
  maxPoints: number
  max_score?: number
  description: string
  weight?: number
  auto_checkable?: boolean
  check_prompt?: string
  order_index?: number
}

export interface TestQuestion {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
}

function parseAIJsonArray<T>(raw: string, fallback: T[]): T[] {
  const content = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

async function postAIJson<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { content?: string; error?: string }
  if (!res.ok) {
    const errText =
      typeof data.error === "string"
        ? data.error
        : `HTTP ${res.status} — AI API жауабы қате (terminalда route логтарын қараңыз)`
    throw new Error(errText)
  }
  return data as T
}

export async function generateEssayCriteria(topic: string, description?: string): Promise<EssayCriterion[]> {
  try {
    const { content } = await postAIJson<{ content: string }>("/api/ai/essay-criteria", {
      topic,
      description: description ?? "",
    })
    const raw = content || "[]"
    return parseAIJsonArray<EssayCriterion>(raw, [])
  } catch (e) {
    console.error("generateEssayCriteria:", e)
    return []
  }
}

export async function generateTestQuestions(topic: string, questionCount = 5): Promise<TestQuestion[]> {
  const count = Math.min(Math.max(Number(questionCount) || 5, 1), 30)
  try {
    const { content } = await postAIJson<{ content: string }>("/api/ai/test-questions", {
      topic,
      count,
    })
    const raw = content || "[]"
    const arr = parseAIJsonArray<TestQuestion>(raw, [])
    return arr.map((q, i) => ({
      ...q,
      id: q.id || i + 1,
      options: q.options?.length === 4 ? q.options : ["", "", "", ""],
      correctIndex: q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
    }))
  } catch (e) {
    console.error("generateTestQuestions:", e)
    return []
  }
}

export async function generateAIFeedback(request: AIFeedbackRequest): Promise<AIFeedbackResponse> {
  try {
    const { content } = await postAIJson<{ content: string }>("/api/ai/feedback", {
      assignmentTitle: request.assignmentTitle,
      score: request.score,
      maxScore: request.maxScore,
      existingFeedback: request.existingFeedback,
    })
    const text = content || ""

    try {
      const parsed = JSON.parse(text) as Record<string, unknown>
      return {
        feedback: typeof parsed.feedback === "string" ? parsed.feedback : "Результат обработан.",
        suggestions: Array.isArray(parsed.suggestions) ? (parsed.suggestions as string[]) : [],
        encouragement:
          typeof parsed.encouragement === "string" ? parsed.encouragement : "Продолжайте в том же духе!",
      }
    } catch {
      return {
        feedback: text,
        suggestions: [],
        encouragement: "Продолжайте работать над улучшением!",
      }
    }
  } catch (error) {
    console.error("AI Feedback error:", error)
    return {
      feedback: "Не удалось сгенерировать AI-фидбэк",
      suggestions: ["Повторите попытку позже"],
      encouragement: "Продолжайте учиться!",
    }
  }
}
