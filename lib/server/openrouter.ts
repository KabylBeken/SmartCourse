/**
 * Сервер-тарапта ғана қолдану (route handlers).
 * Кілт: OPENROUTER_API_KEY — жоба түбіндегі `.env` / `.env.local`
 * (Next кейде жүктелмей қалса, dotenv арқылы қайта оқылады.)
 */
import { config as loadEnvFile } from "dotenv"
import { resolve } from "path"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

let envFilesLoaded = false

function loadServerEnvFiles() {
  if (envFilesLoaded) return
  envFilesLoaded = true
  try {
    const root = process.cwd()
    loadEnvFile({ path: resolve(root, ".env") })
    loadEnvFile({ path: resolve(root, ".env.local"), override: true })
    if (process.env.NODE_ENV === "development") {
      loadEnvFile({ path: resolve(root, ".env.development.local"), override: true })
    }
  } catch {
    // cwd түзі емес ортада елемейміз
  }
}

export function getOpenRouterApiKey(): string | undefined {
  loadServerEnvFiles()
  return (
    process.env.OPENROUTER_API_KEY?.trim() ||
    process.env.OPEN_ROUTER_API_KEY?.trim()
  )
}

export function getDefaultOpenRouterModel(): string {
  loadServerEnvFiles()
  return process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-oss-120b:free"
}

export async function openRouterChat(params: {
  messages: { role: string; content: string }[]
  model?: string
  /** gpt-oss үшін ұсынылады */
  reasoning?: boolean
}): Promise<{ raw: string }> {
  loadServerEnvFiles()

  const key = getOpenRouterApiKey()
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY табылмады. SmartCourse түбіне .env.local қойыңыз: OPENROUTER_API_KEY=sk-... содан кейін dev серверді толық тоқтатып қайта іске қосыңыз.",
    )
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const model = params.model?.trim() || getDefaultOpenRouterModel()
  const useReasoning = params.reasoning !== false

  const payload: Record<string, unknown> = {
    model,
    messages: params.messages,
  }
  if (useReasoning) {
    payload.reasoning = { enabled: true }
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": site,
      "X-Title": "SmartCourse",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await response.text()
    const hint =
      response.status === 401
        ? " Кілт жарамсыз немесе .env.local қате — openrouter.ai keys тексеріңіз."
        : ""
    throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 200)}${hint}`)
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const raw = data.choices?.[0]?.message?.content ?? ""
  return { raw }
}
