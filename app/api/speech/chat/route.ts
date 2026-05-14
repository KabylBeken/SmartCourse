import { NextResponse } from "next/server"
import {
  geminiChat,
  geminiAudioUnderstand,
  geminiTTS,
  type ChatMessage,
} from "@/lib/server/gemini"

interface SpeechChatBody {
  text?: string
  audio?: string // base64
  audioMimeType?: string
  language?: string
  history?: ChatMessage[]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SpeechChatBody
    const language = body.language ?? "en"
    const history = body.history ?? []

    // 1) Determine user message: from audio or text
    let userText = body.text?.trim() ?? ""

    if (body.audio && !userText) {
      userText = await geminiAudioUnderstand(
        body.audio,
        body.audioMimeType ?? "audio/webm"
      )
    }

    if (!userText) {
      return NextResponse.json(
        { error: "Хабарлама немесе аудио жіберіңіз" },
        { status: 400 }
      )
    }

    // 2) Build conversation and get AI response
    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: userText },
    ]

    const assistantText = await geminiChat(messages, language)

    // 3) Generate TTS for the response
    let assistantAudio: string | null = null
    let audioMimeType: string | null = null

    try {
      const tts = await geminiTTS(assistantText, "Sadaltager", language)
      assistantAudio = tts.audioBase64
      audioMimeType = tts.mimeType
    } catch (e) {
      console.error("TTS generation failed, returning text only:", e)
    }

    return NextResponse.json({
      userTranscription: userText,
      assistantText,
      assistantAudio,
      audioMimeType,
    })
  } catch (e) {
    console.error("Speech chat error:", e)
    const message = e instanceof Error ? e.message : "Speech API қатесі"
    const status = message.includes("GEMINI_API_KEY") ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
