/**
 * Серверный клиент Google Gemini AI.
 * Қолданылатын модельдер:
 *  - gemini-2.5-flash-preview-tts  → TTS (text → audio)
 *  - gemini-2.0-flash               → Audio understanding + Chat
 *
 * Кілт: GEMINI_API_KEY (.env.local)
 */
import { GoogleGenAI } from "@google/genai"
import { config as loadEnvFile } from "dotenv"
import { resolve } from "path"

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

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    config: {
      systemInstruction: `${TEACHER_SYSTEM_PROMPT}\n\n${langHint}`,
    },
    contents,
  })

  return response.text ?? ""
}

// ─── Audio Understanding (audio → text) ─────────────────────────────────────

export async function geminiAudioUnderstand(
  audioBase64: string,
  mimeType: string = "audio/webm"
): Promise<string> {
  const client = getClient()

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
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
}

// ─── TTS (text → audio base64 PCM) ─────────────────────────────────────────

export async function geminiTTS(
  text: string,
  voice: string = "Sadaltager",
  language: string = "en"
): Promise<{ audioBase64: string; mimeType: string }> {
  const client = getClient()

  const langPrefix = language === "ru" ? "Say in Russian:" : "Say in English:"

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
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
}
