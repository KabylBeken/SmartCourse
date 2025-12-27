/**
 * API для работы с AI через OpenRouter
 * Используется для генерации фидбэка по оценкам
 */

const OPENROUTER_API_KEY = "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"
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

export interface AIFeedbackRequest {
  assignmentTitle: string
  score: number
  maxScore: number
  existingFeedback?: string
}

export interface AIFeedbackResponse {
  feedback: string
  suggestions: string[]
  encouragement: string
}

export async function generateAIFeedback(request: AIFeedbackRequest): Promise<AIFeedbackResponse> {
  const prompt = `Ты - помощник преподавателя. Студент получил оценку ${request.score} из ${request.maxScore} за задание "${request.assignmentTitle}".
${request.existingFeedback ? `Комментарий преподавателя: "${request.existingFeedback}"` : ""}

Сгенерируй развёрнутый фидбэк для студента на русском языке в формате JSON:
{
  "feedback": "Подробный анализ результата (2-3 предложения)",
  "suggestions": ["Совет 1 для улучшения", "Совет 2 для улучшения"],
  "encouragement": "Мотивирующее сообщение для студента"
}

Отвечай ТОЛЬКО валидным JSON без markdown.`

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SmartCourse",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""
    
    // Парсим JSON из ответа
    try {
      const parsed = JSON.parse(content)
      return {
        feedback: parsed.feedback || "Результат обработан.",
        suggestions: parsed.suggestions || [],
        encouragement: parsed.encouragement || "Продолжайте в том же духе!"
      }
    } catch {
      // Если не удалось распарсить, возвращаем как есть
      return {
        feedback: content,
        suggestions: [],
        encouragement: "Продолжайте работать над улучшением!"
      }
    }
  } catch (error) {
    console.error("AI Feedback error:", error)
    return {
      feedback: "Не удалось сгенерировать AI-фидбэк",
      suggestions: ["Повторите попытку позже"],
      encouragement: "Продолжайте учиться!"
    }
  }
}
