/**
 * Speech Teacher — фронтенд API клиент.
 * Gemini API-ге Next.js route арқылы хабарлама жіберу.
 */

export interface SpeechMessage {
  id: number
  role: "user" | "assistant"
  content: string
  audioBase64?: string | null
  audioMimeType?: string | null
  timestamp: string
}

export interface SpeechChatResponse {
  userTranscription: string
  assistantText: string
  assistantAudio: string | null
  audioMimeType: string | null
}

export interface ChatHistoryItem {
  role: "user" | "assistant"
  content: string
}

/** Аудио немесе мәтін арқылы чат жіберу. */
export async function sendSpeechChat(params: {
  text?: string
  audio?: string
  audioMimeType?: string
  language: string
  history: ChatHistoryItem[]
}): Promise<SpeechChatResponse> {
  const res = await fetch("/api/speech/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: params.text,
      audio: params.audio,
      audioMimeType: params.audioMimeType,
      language: params.language,
      history: params.history,
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }

  return res.json()
}

/** Мәтінді аудиоға айналдыру (TTS). */
export async function textToSpeech(
  text: string,
  language: string = "en"
): Promise<{ audioBase64: string; mimeType: string }> {
  const res = await fetch("/api/speech/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `TTS HTTP ${res.status}`)
  }

  return res.json()
}

/**
 * Base64 PCM аудионы AudioContext арқылы ойнату.
 * Gemini TTS L16 24kHz 16-bit mono форматында қайтарады.
 */
export function playAudioBase64(
  base64: string,
  mimeType: string = "audio/L16;rate=24000"
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const raw = atob(base64)
      const bytes = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i)
      }

      // Parse mime type for sample rate
      const rateMatch = mimeType.match(/rate=(\d+)/)
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000
      const isL16 = mimeType.includes("L16") || mimeType.includes("audio/L16")

      if (isL16 || mimeType.includes("pcm")) {
        // Raw PCM 16-bit signed little-endian
        const samples = new Int16Array(bytes.buffer)
        const audioCtx = new AudioContext({ sampleRate })
        const buffer = audioCtx.createBuffer(1, samples.length, sampleRate)
        const channelData = buffer.getChannelData(0)
        for (let i = 0; i < samples.length; i++) {
          channelData[i] = samples[i] / 32768
        }
        const source = audioCtx.createBufferSource()
        source.buffer = buffer
        source.connect(audioCtx.destination)
        source.onended = () => {
          audioCtx.close()
          resolve()
        }
        source.start()
      } else {
        // WAV/MP3/OGG — use standard Audio element
        const blob = new Blob([bytes], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => {
          URL.revokeObjectURL(url)
          resolve()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error("Audio playback error"))
        }
        audio.play()
      }
    } catch (e) {
      reject(e)
    }
  })
}
