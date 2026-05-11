import { NextResponse } from "next/server"
import { openRouterChat } from "@/lib/server/openrouter"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { title?: string; description?: string; prompt_text?: string }
    const title = (body.title || "").trim()
    const desc = (body.description || "").trim()
    const original = (body.prompt_text || "").trim()

    const prompt = `You are an expert prompt engineer for teachers. Improve the following AI prompt for clarity, pedagogy, and structure.
- KEEP all variables intact exactly as {{var}}.
- Use concise, actionable language.
- Return ONLY the improved prompt text, no markdown.

Title: ${title}
Description: ${desc}
Prompt:
${original}`

    const { raw } = await openRouterChat({ messages: [{ role: "user", content: prompt }] })
    return NextResponse.json({ content: raw })
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI error"
    const status = message.includes("OPENROUTER_API_KEY") ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
