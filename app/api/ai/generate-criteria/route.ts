import { NextResponse } from "next/server"
import { openRouterChat } from "@/lib/server/openrouter"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string
      description?: string
      type?: string
      max_score?: number
      count?: number
    }
    const title = (body.title || "Assignment").trim()
    const desc = (body.description || "").trim()
    const type = (body.type || "essay").trim()
    const maxScore = body.max_score || 100
    const count = Math.min(body.count || 5, 8)

    const prompt = `You are an expert educator. Generate ${count} grading criteria for this assignment.

Assignment Title: ${title}
Description: ${desc}
Type: ${type}
Total Points: ${maxScore}

Rules:
- All max_score values must sum to exactly ${maxScore}
- weight should be between 0.5 and 2.0 (higher = more important)
- auto_checkable = true only for criteria that AI can objectively evaluate (like grammar, code correctness)
- Provide a useful check_prompt only when auto_checkable is true
- Return ONLY valid JSON array, no markdown, no explanation

JSON format:
[
  {
    "name": "criterion name",
    "description": "what this evaluates",
    "max_score": 20,
    "weight": 1.5,
    "auto_checkable": true,
    "check_prompt": "optional AI evaluation prompt if auto_checkable",
    "difficulty": "medium"
  }
]`

    const { raw } = await openRouterChat({ messages: [{ role: "user", content: prompt }] })

    let criteria: unknown[]
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim()
      criteria = JSON.parse(cleaned)
      if (!Array.isArray(criteria)) throw new Error("not array")
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 502 })
    }

    return NextResponse.json({ criteria })
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI error"
    const status = message.includes("OPENROUTER_API_KEY") ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
