import { NextResponse } from "next/server"
import { openRouterChat } from "@/lib/server/openrouter"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { topic?: string; count?: number }
    const topic = String(body.topic ?? "").trim()
    if (!topic) {
      return NextResponse.json({ error: "topic міндетті" }, { status: 400 })
    }
    const count = Math.min(Math.max(Number(body.count) || 5, 1), 30)

    const prompt = `Тақырып: "${topic}"
${count} сұрақтан тұратын бірнеше таңдаулы тест жаса. Әр сұрақта 4 нұсқа, біреуі дұрыс. JSON массив:
[{"id":1,"question":"...","options":["A","B","C","D"],"correctIndex":0},...]
correctIndex — 0..3. Тек JSON қайтар.`

    const { raw } = await openRouterChat({
      messages: [{ role: "user", content: prompt }],
    })

    return NextResponse.json({ content: raw })
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI қатесі"
    const status = message.includes("OPENROUTER_API_KEY") ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
