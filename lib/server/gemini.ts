/**
 * Серверный клиент Google Gemini AI.
 * Қолданылатын модельдер:
 *  - gemini-2.5-flash-preview-tts  → TTS (text → audio)
 *  - gemini-2.0-flash-lite          → Audio understanding + Chat (free tier)
 *
 * Кілт: GEMINI_API_KEY (.env.local)
 */
import { GoogleGenAI } from "@google/genai"
import { config as loadEnvFile } from "dotenv"
import { resolve } from "path"

// Модельдер — free tier лимиттерімен жұмыс істейтіндер
const CHAT_MODEL = "gemini-2.0-flash-lite"
const AUDIO_MODEL = "gemini-2.0-flash-lite"
const TTS_MODEL = "gemini-2.5-flash-preview-tts"

let envLoaded = false

function ensureEnv() {
  if (envLoaded) return
  envLoaded = true
  try {
    const root = process.cwd()
    loadEnvFile({ path: resolve(root, ".env") })
    loadEnvFile({ path: resolve(root, ".env.local"), override: true })
  } catch {
    // ignore
  }
}

function getClient(): GoogleGenAI {
  ensureEnv()
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY табылмады. .env.local файлына GEMINI_API_KEY=... қосыңыз."
    )
  }
  return new GoogleGenAI({ apiKey })
}

/** Retry helper — 429 rate-limit кезінде қайта жіберу */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")
      if (!isRateLimit || attempt >= retries) throw e
      const delay = Math.min(5000 * (attempt + 1), 30000)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

// ─── System prompt ──────────────────────────────────────────────────────────

const TEACHER_SYSTEM_PROMPT = `You are "The Patient Teacher" — a patient, kind, and encouraging language teacher.

Rules:
- Always be supportive and positive
- Correct mistakes gently with explanations
- If the student speaks English, respond in English
- If the student speaks Russian, respond in Russian
- Keep responses concise (2-4 sentences max) for natural conversation flow
- Encourage the student to keep practicing
- If you don't understand something, kindly ask the student to repeat
- Adjust your vocabulary level to match the student's proficiency
- When correcting pronunciation or grammar, explain WHY something is wrong`

// ─── Chat (text or transcription → text response) ──────────────────────────

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function geminiChat(
  messages: ChatMessage[],
  language: string = "en"
): Promise<string> {
  const client = getClient()

  const langHint =
    language === "ru"
      ? "The student prefers Russian. Respond in Russian."
      : "The student prefers English. Respond in English."

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }))

  return withRetry(async () => {
    const response = await client.models.generateContent({
      model: CHAT_MODEL,
      config: {
        systemInstruction: `${TEACHER_SYSTEM_PROMPT}\n\n${langHint}`,
      },
      contents,
    })
    return response.text ?? ""
  })
}

// ─── Audio Understanding (audio → text) ─────────────────────────────────────

export async function geminiAudioUnderstand(
  audioBase64: string,
  mimeType: string = "audio/webm"
): Promise<string> {
  const client = getClient()

  return withRetry(async () => {
    const response = await client.models.generateContent({
      model: AUDIO_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text: "Transcribe this audio exactly as spoken. Return only the transcription, nothing else.",
            },
          ],
        },
      ],
    })
    return response.text?.trim() ?? ""
  })
}

// ─── TTS (text → audio base64 PCM) ─────────────────────────────────────────

export async function geminiTTS(
  text: string,
  voice: string = "Sadaltager",
  language: string = "en"
): Promise<{ audioBase64: string; mimeType: string }> {
  const client = getClient()

  const langPrefix = language === "ru" ? "Say in Russian:" : "Say in English:"

  return withRetry(async () => {
    const response = await client.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: `${langPrefix} ${text}` }],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    })

    const candidate = response.candidates?.[0]
    const part = candidate?.content?.parts?.[0]

    if (part?.inlineData?.data) {
      return {
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? "audio/L16;rate=24000",
      }
    }

    throw new Error("Gemini TTS жауабында аудио табылмады")
  })
}
