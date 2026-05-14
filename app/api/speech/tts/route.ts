import { NextResponse } from "next/server"
import { geminiTTS } from "@/lib/server/gemini"

interface TTSBody {
  text?: string
  language?: string
  voice?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TTSBody
    const text = body.text?.trim()

    if (!text) {
      return NextResponse.json(
        { error: "Мәтін жіберіңіз" },
        { status: 400 }
      )
    }

    const voice = body.voice ?? "Sadaltager"
    const language = body.language ?? "en"

    const { audioBase64, mimeType } = await geminiTTS(text, voice, language)

    return NextResponse.json({ audioBase64, mimeType })
  } catch (e) {
    console.error("TTS error:", e)
    const message = e instanceof Error ? e.message : "TTS қатесі"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
