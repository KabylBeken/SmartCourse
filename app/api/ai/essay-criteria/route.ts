import { NextResponse } from "next/server"
import { openRouterChat } from "@/lib/server/openrouter"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { topic?: string; description?: string }
    const title = String(body.topic ?? "").trim()
    if (!title) {
      return NextResponse.json({ error: "topic міндетті" }, { status: 400 })
    }
    const desc = String(body.description ?? "").trim()
    const merged = desc ? `${title}. Қосымша: ${desc}` : title

    const prompt = `Тақырып: "${merged}"
Осы тақырып бойынша эссе бағалау үшін 3–5 критерий ұсынып, JSON массив түрінде қайтар (тек JSON, markdown жоқ):
[{"name":"...","maxPoints":20,"description":"..."},...]
Жалпы maxPoints сомасы шамамен 100 болуы керек.`

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
