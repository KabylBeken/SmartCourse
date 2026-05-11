"use client"

import { useState } from "react"
import { X, Plus, Trash2, Sparkles, Loader2, BookOpen, ListChecks } from "lucide-react"
import { generateEssayCriteria, generateTestQuestions, EssayCriterion, TestQuestion } from "@/lib/api/ai"

// ─── Types ────────────────────────────────────────────────

interface CreateAssignmentModalProps {
  courseId: number
  onClose: () => void
  onSuccess: () => void
}

interface AssignmentFormData {
  title: string
  description: string
  dueDate: string
  maxScore: number
  type: "essay" | "test"
  wordCount: number
  criteria: EssayCriterion[]
  questions: TestQuestion[]
}

// ─── Component ────────────────────────────────────────────

export default function CreateAssignmentModal({ courseId, onClose, onSuccess }: CreateAssignmentModalProps) {
  const [form, setForm] = useState<AssignmentFormData>({
    title: "",
    description: "",
    dueDate: "",
    maxScore: 100,
    type: "essay",
    wordCount: 5,
    criteria: [],
    questions: [],
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // ─── AI Generate ─────────────────────────────────

  const handleGenerateCriteria = async () => {
    if (!form.title) { setError("Алдымен тақырып жазыңыз"); return }
    setAiLoading(true); setError("")
    try {
      const criteria = await generateEssayCriteria(form.title, form.description)
      setForm(f => ({ ...f, criteria }))
    } catch {
      setError("AI қатесі. Қайта көріңіз.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateQuestions = async () => {
    if (!form.title) { setError("Алдымен тақырып жазыңыз"); return }
    if (!form.wordCount || form.wordCount < 1) { setError("Сұрақ санын енгізіңіз"); return }
    setAiLoading(true); setError("")
    try {
      const questions = await generateTestQuestions(form.title, form.wordCount)
      setForm(f => ({ ...f, questions }))
    } catch {
      setError("AI қатесі. Қайта көріңіз.")
    } finally {
      setAiLoading(false)
    }
  }

  // ─── Criteria CRUD ────────────────────────────────

  const addCriterion = () => {
    setForm(f => ({
      ...f,
      criteria: [...f.criteria, { name: "", maxPoints: 10, description: "" }]
    }))
  }

  const updateCriterion = (i: number, field: keyof EssayCriterion, value: string | number) => {
    setForm(f => {
      const updated = [...f.criteria]
      updated[i] = { ...updated[i], [field]: value }
      return { ...f, criteria: updated }
    })
  }

  const removeCriterion = (i: number) => {
    setForm(f => ({ ...f, criteria: f.criteria.filter((_, idx) => idx !== i) }))
  }

  // ─── Questions CRUD ───────────────────────────────

  const addQuestion = () => {
    const id = form.questions.length + 1
    setForm(f => ({
      ...f,
      questions: [...f.questions, { id, question: "", options: ["", "", "", ""], correctIndex: 0 }]
    }))
  }

  const updateQuestion = (i: number, field: string, value: unknown) => {
    setForm(f => {
      const updated = [...f.questions]
      updated[i] = { ...updated[i], [field]: value }
      return { ...f, questions: updated }
    })
  }

  const updateOption = (qi: number, oi: number, value: string) => {
    setForm(f => {
      const updated = [...f.questions]
      const opts = [...updated[qi].options]
      opts[oi] = value
      updated[qi] = { ...updated[qi], options: opts }
      return { ...f, questions: updated }
    })
  }

  const removeQuestion = (i: number) => {
    setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))
  }

  // ─── Submit ───────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.title || !form.dueDate) {
      setError("Тақырып пен мерзімді толтырыңыз")
      return
    }
    setSaving(true); setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:8083/api/teacher/courses/${courseId}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          due_date: new Date(form.dueDate).toISOString(),
          max_score: form.maxScore,
          type: form.type,
          word_count: form.wordCount,
          criteria: form.type === "essay" ? form.criteria : [],
          questions: form.type === "test" ? form.questions : [],
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Сервер қатесі")
      }
      onSuccess()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Қате орын алды")
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ───────────────────────────────────────

  const totalCriteriaPoints = form.criteria.reduce((s, c) => s + (c.maxPoints || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Жаңа тапсырма</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          {/* Тип таңдау */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Тапсырма түрі</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "essay", label: "Эссе", icon: BookOpen, desc: "Мәтін жазу тапсырмасы" },
                { value: "test", label: "Тест", icon: ListChecks, desc: "Бір дұрыс жауапты тест" },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: value as "essay" | "test" }))}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 transition text-left ${form.type === value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${form.type === value ? "text-indigo-600" : "text-gray-400"}`} />
                  <div>
                    <div className={`font-semibold ${form.type === value ? "text-indigo-700" : "text-gray-700"}`}>{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Негізгі өрістер */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Тақырып *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder={form.type === "essay" ? "Мысалы: Қазақстанның тарихы туралы эссе" : "Мысалы: Биология 1-тарау тесті"}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Сипаттама</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                rows={2}
                placeholder="Тапсырма туралы қосымша ақпарат..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Тапсыру мерзімі *</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Максималды балл</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.maxScore}
                  onChange={e => setForm(f => ({ ...f, maxScore: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          {/* ── ESSAY БЛОК ── */}
          {form.type === "essay" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Критериялар
                  {form.criteria.length > 0 && (
                    <span className={`ml-2 text-xs ${totalCriteriaPoints === 100 ? "text-green-600" : "text-orange-500"}`}>
                      Жалпы: {totalCriteriaPoints}/100 балл
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateCriteria}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Генерировать с AI
                  </button>
                  <button
                    type="button"
                    onClick={addCriterion}
                    className="flex items-center gap-1 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Қосу
                  </button>
                </div>
              </div>

              {form.criteria.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  AI арқылы немесе қолмен критерий қосыңыз
                </div>
              )}

              <div className="space-y-2">
                {form.criteria.map((cr, i) => (
                  <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        placeholder="Критерий атауы"
                        value={cr.name}
                        onChange={e => updateCriterion(i, "name", e.target.value)}
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                          placeholder="Балл"
                          value={cr.maxPoints}
                          onChange={e => updateCriterion(i, "maxPoints", Number(e.target.value))}
                        />
                        <input
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                          placeholder="Сипаттама"
                          value={cr.description}
                          onChange={e => updateCriterion(i, "description", e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeCriterion(i)} className="p-1.5 hover:text-red-500 transition mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TEST БЛОК ── */}
          {form.type === "test" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Сұрақ саны</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className="w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.wordCount}
                  onChange={e => setForm(f => ({ ...f, wordCount: Number(e.target.value) }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Сұрақтар ({form.questions.length})
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateQuestions}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Генерировать с AI
                  </button>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Қосу
                  </button>
                </div>
              </div>

              {form.questions.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  AI арқылы немесе қолмен сұрақ қосыңыз
                </div>
              )}

              <div className="space-y-4">
                {form.questions.map((q, qi) => (
                  <div key={qi} className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-600 mt-2.5">{qi + 1}.</span>
                      <input
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        placeholder="Сұрақ мәтіні"
                        value={q.question}
                        onChange={e => updateQuestion(qi, "question", e.target.value)}
                      />
                      <button type="button" onClick={() => removeQuestion(qi)} className="p-1.5 hover:text-red-500 transition mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 pl-5">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            checked={q.correctIndex === oi}
                            onChange={() => updateQuestion(qi, "correctIndex", oi)}
                            className="accent-green-500 w-4 h-4 cursor-pointer"
                          />
                          <input
                            className={`flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white ${q.correctIndex === oi ? "border-green-400 bg-green-50" : "border-gray-200"
                              }`}
                            placeholder={`Вариант ${String.fromCharCode(65 + oi)}`}
                            value={opt}
                            onChange={e => updateOption(qi, oi, e.target.value)}
                          />
                          {q.correctIndex === oi && (
                            <span className="text-xs text-green-600 font-semibold whitespace-nowrap">✓ Дұрыс</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Болдырмау
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Сақтау
          </button>
        </div>
      </div>
    </div>
  )
}
