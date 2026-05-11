"use client"

import type React from "react"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Trash2, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import {
  deleteAssignment,
  getAssignment,
  updateAssignment,
  type Assignment,
} from "@/lib/api/assignments"
import type { EssayCriterion, TestQuestion } from "@/lib/api/ai"

type AssignmentForm = {
  title: string
  description: string
  dueDate: string
  maxScore: number
  type: "essay" | "test"
  wordCount: number
  criteria: EssayCriterion[]
  questions: TestQuestion[]
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

function buildForm(assignment: Assignment): AssignmentForm {
  return {
    title: assignment.title,
    description: assignment.description || "",
    dueDate: toDateTimeLocal(assignment.due_date),
    maxScore: assignment.max_score || 100,
    type: assignment.type || "essay",
    wordCount: assignment.word_count || assignment.questions?.length || 0,
    criteria: assignment.criteria || [],
    questions: assignment.questions || [],
  }
}

export default function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const assignmentId = Number(id)
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [form, setForm] = useState<AssignmentForm | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadAssignment() {
      try {
        const data = await getAssignment(assignmentId)
        setAssignment(data)
        setForm(buildForm(data))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Задание не найдено")
      } finally {
        setIsLoading(false)
      }
    }

    if (Number.isFinite(assignmentId)) {
      loadAssignment()
    } else {
      setError("Неверный ID задания")
      setIsLoading(false)
    }
  }, [assignmentId])

  const updateCriterion = (index: number, field: keyof EssayCriterion, value: string | number) => {
    setForm((current) => {
      if (!current) return current
      const criteria = [...current.criteria]
      criteria[index] = { ...criteria[index], [field]: value }
      return { ...current, criteria }
    })
  }

  const addCriterion = () => {
    setForm((current) =>
      current
        ? {
            ...current,
            criteria: [...current.criteria, { name: "", maxPoints: 10, description: "" }],
          }
        : current,
    )
  }

  const removeCriterion = (index: number) => {
    setForm((current) =>
      current ? { ...current, criteria: current.criteria.filter((_, itemIndex) => itemIndex !== index) } : current,
    )
  }

  const updateQuestion = (index: number, field: keyof TestQuestion, value: string | number | string[]) => {
    setForm((current) => {
      if (!current) return current
      const questions = [...current.questions]
      questions[index] = { ...questions[index], [field]: value }
      return { ...current, questions }
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setForm((current) => {
      if (!current) return current
      const questions = [...current.questions]
      const options = [...questions[questionIndex].options]
      options[optionIndex] = value
      questions[questionIndex] = { ...questions[questionIndex], options }
      return { ...current, questions }
    })
  }

  const addQuestion = () => {
    setForm((current) =>
      current
        ? {
            ...current,
            questions: [
              ...current.questions,
              {
                id: current.questions.length + 1,
                question: "",
                options: ["", "", "", ""],
                correctIndex: 0,
                explanation: "",
              },
            ],
            wordCount: current.questions.length + 1,
          }
        : current,
    )
  }

  const removeQuestion = (index: number) => {
    setForm((current) => {
      if (!current) return current
      const questions = current.questions.filter((_, itemIndex) => itemIndex !== index)
      return { ...current, questions, wordCount: questions.length }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form) return

    if (!form.title.trim() || !form.dueDate) {
      setError("Название и срок сдачи обязательны")
      return
    }

    setIsSaving(true)
    setError("")
    try {
      await updateAssignment(assignmentId, {
        title: form.title.trim(),
        description: form.description,
        due_date: new Date(form.dueDate).toISOString(),
        max_score: Number(form.maxScore),
        type: form.type,
        word_count: form.type === "test" ? form.questions.length : form.wordCount,
        criteria: form.type === "essay" ? form.criteria : [],
        questions: form.type === "test" ? form.questions : [],
      })
      router.push(`/assignments/${assignmentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить задание")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Удалить это задание?")) return

    try {
      await deleteAssignment(assignmentId)
      router.push("/assignments")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить задание")
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/assignments/${assignmentId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Редактировать задание</h1>
              <p className="text-muted-foreground">{assignment?.title || "Загрузка данных"}</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading || isSaving}>
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && form && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Название, описание, тип и срок задания</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Срок сдачи</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={form.dueDate}
                      onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                      required
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={5}
                    disabled={isSaving}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="type">Тип</Label>
                    <select
                      id="type"
                      value={form.type}
                      onChange={(event) => setForm({ ...form, type: event.target.value as "essay" | "test" })}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      disabled={isSaving}
                    >
                      <option value="essay">Эссе</option>
                      <option value="test">Тест</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxScore">Максимальный балл</Label>
                    <Input
                      id="maxScore"
                      type="number"
                      min={1}
                      value={form.maxScore}
                      onChange={(event) => setForm({ ...form, maxScore: Number(event.target.value) })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Курс</Label>
                    <Input value={`#${assignment?.course_id || ""}`} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {form.type === "essay" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Критерии эссе</CardTitle>
                    <CardDescription>Эти критерии будут видны в разделе критериев</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {form.criteria.length === 0 && <p className="text-sm text-muted-foreground">Критерии не добавлены.</p>}
                  {form.criteria.map((criterion, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_120px_auto]">
                      <div className="space-y-2">
                        <Input
                          placeholder="Название критерия"
                          value={criterion.name}
                          onChange={(event) => updateCriterion(index, "name", event.target.value)}
                          disabled={isSaving}
                        />
                        <Input
                          placeholder="Описание"
                          value={criterion.description || ""}
                          onChange={(event) => updateCriterion(index, "description", event.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <Input
                        type="number"
                        min={1}
                        value={criterion.maxPoints || criterion.max_score || 10}
                        onChange={(event) => updateCriterion(index, "maxPoints", Number(event.target.value))}
                        disabled={isSaving}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCriterion(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {form.type === "test" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Вопросы теста</CardTitle>
                    <CardDescription>Выберите правильный вариант для каждого вопроса</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.questions.length === 0 && <p className="text-sm text-muted-foreground">Вопросы не добавлены.</p>}
                  {form.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="space-y-3 rounded-lg border p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Текст вопроса"
                          value={question.question}
                          onChange={(event) => updateQuestion(questionIndex, "question", event.target.value)}
                          disabled={isSaving}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(questionIndex)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center gap-2 rounded-md border p-2">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={question.correctIndex === optionIndex}
                              onChange={() => updateQuestion(questionIndex, "correctIndex", optionIndex)}
                              disabled={isSaving}
                            />
                            <Input
                              value={option}
                              onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                              placeholder={`Вариант ${optionIndex + 1}`}
                              disabled={isSaving}
                            />
                          </label>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Түсініктеме (студентке қатеге жазсаңыз көрсетіледі)</Label>
                        <Textarea
                          rows={3}
                          value={question.explanation || ""}
                          onChange={(event) => updateQuestion(questionIndex, "explanation", event.target.value)}
                          placeholder='Мысалы: Go тілінде int нөлдік мәні 0 болады, себебі nil тек сәйкес сандық емес типтер үшін қолданылады.'
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" asChild disabled={isSaving}>
                <Link href={`/assignments/${assignmentId}`}>Отмена</Link>
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Сохранить
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
