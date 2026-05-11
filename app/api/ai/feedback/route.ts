import { NextResponse } from "next/server"
import { openRouterChat } from "@/lib/server/openrouter"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      assignmentTitle?: string
      score?: number
      maxScore?: number
      existingFeedback?: string
    }
    const title = String(body.assignmentTitle ?? "")
    const score = Number(body.score)
    const maxScore = Number(body.maxScore)
    const existingFeedback = body.existingFeedback

    const prompt = `Ты - помощник преподавателя. Студент получил оценку ${score} из ${maxScore} за задание "${title}".
${existingFeedback ? `Комментарий преподавателя: "${existingFeedback}"` : ""}

Сгенерируй развёрнутый фидбэк для студента на русском языке в формате JSON:
{
  "feedback": "Подробный анализ результата (2-3 предложения)",
  "suggestions": ["Совет 1 для улучшения", "Совет 2 для улучшения"],
  "encouragement": "Мотивирующее сообщение для студента"
}

Отвечай ТОЛЬКО валидным JSON без markdown.`

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
