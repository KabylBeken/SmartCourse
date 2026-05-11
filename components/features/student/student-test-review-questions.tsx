"use client"

import type { ElementType } from "react"

import type { Assignment, AssignmentSubmission, TestQuestionReview } from "@/lib/api/assignments"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Lightbulb, XCircle } from "lucide-react"

export type AnswerMap = Record<number, number>

interface StudentTestReviewQuestionsProps {
  assignment: Assignment
  answers: AnswerMap
  submission: AssignmentSubmission | null
  locked: boolean
  showResults: boolean
  onAnswerChange?: (questionId: number, optionIndex: number) => void
}

function formatPoints(value: number) {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
}

export function StudentTestReviewQuestions({
  assignment,
  answers,
  locked,
  showResults,
  onAnswerChange,
  submission,
}: StudentTestReviewQuestionsProps) {
  const reviewMap = buildReviewMap(submission?.test_review)

  return (
    <div className="space-y-4">
      {(assignment.questions || []).map((question, questionIndex) => {
        const qid = question.id || questionIndex + 1
        const selected = answers[qid]
        const review = showResults ? reviewMap.get(qid) : undefined

        return (
          <div
            key={question.id || questionIndex}
            className={cn(
              "rounded-xl border p-4 shadow-sm transition-colors",
              showResults && review && (review.is_correct ? "border-emerald-200 bg-emerald-50/35" : "border-red-200 bg-red-50/25"),
            )}
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    showResults && review
                      ? review.is_correct
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-sky-100 text-sky-800",
                  )}
                >
                  {questionIndex + 1}
                </div>
                <div>
                  <div className="text-base font-medium leading-snug">{question.question}</div>
                  {showResults && review && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      {review.is_correct ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          Дұрыс жауап
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-red-700">
                          <XCircle className="h-4 w-4 shrink-0" />
                          Қате жауап
                        </span>
                      )}
                      <Badge variant="secondary" className="font-normal tabular-nums">
                        +{formatPoints(review.points_earned)} / {formatPoints(review.points_max)} балл
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              {showResults && review && selected === undefined && (
                <Badge variant="outline" className="border-amber-300 text-amber-800">
                  Жауап жоқ
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <TestOptionRow
                  key={`${question.id}-${optionIndex}`}
                  label={option}
                  optionIndex={optionIndex}
                  questionId={qid}
                  selected={selected}
                  showResults={showResults && !!review}
                  review={review}
                  disabled={locked && !showResults}
                  onSelect={onAnswerChange}
                />
              ))}
            </div>

            {showResults && review && !review.is_correct && review.explanation && (
              <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4 text-amber-700" />
                    Неге дұрыс жауап мынау?
                  </div>
                  <p className="leading-relaxed text-amber-900/95">{review.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function buildReviewMap(rows?: TestQuestionReview[]) {
  const map = new Map<number, TestQuestionReview>()
  rows?.forEach((row) => map.set(row.question_id, row))
  return map
}

function TestOptionRow({
  label,
  optionIndex,
  questionId,
  selected,
  showResults,
  review,
  disabled,
  onSelect,
}: {
  label: string
  optionIndex: number
  questionId: number
  selected?: number
  showResults: boolean
  review?: TestQuestionReview
  disabled: boolean
  onSelect?: (questionId: number, optionIndex: number) => void
}) {
  const isChosen = selected === optionIndex
  const isCorrectOption = showResults && review ? optionIndex === review.correct_index : false
  const isWrongPick = showResults && review && isChosen && !review.is_correct
  const isRightPick = showResults && review && isChosen && review.is_correct

  const clickable = !disabled && !showResults && !!onSelect
  const Wrapper: ElementType = clickable ? "button" : "div"
  const interactionProps =
    clickable
      ? { type: "button" as const, onClick: () => onSelect?.(questionId, optionIndex) }
      : { role: "group" }

  return (
    <Wrapper
      {...interactionProps}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm transition",
        !showResults && isChosen && "border-sky-300 bg-sky-50 text-sky-950",
        !showResults && !isChosen && "border-border hover:bg-muted/50",
        clickable && !isChosen && !showResults && "cursor-pointer",
        showResults &&
          cn(
            isRightPick && "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-200",
            isWrongPick && "border-red-400 bg-red-50 shadow-sm ring-1 ring-red-200",
            isCorrectOption && !isChosen && "border-emerald-400 bg-emerald-50/80 ring-1 ring-emerald-100",
          ),
        showResults && !isCorrectOption && !isChosen && !isWrongPick && "border-muted/80 bg-muted/20 opacity-95",
      )}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold uppercase">
        {String.fromCharCode(65 + optionIndex)}
      </span>
      <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <span className="leading-relaxed">{label}</span>
        <span className="flex shrink-0 flex-col items-end gap-1 text-right">
          {isRightPick && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Сіздің таңдауыңыз
            </span>
          )}
          {isWrongPick && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
              <XCircle className="h-4 w-4" /> Қате
            </span>
          )}
          {showResults && isCorrectOption && !isChosen && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> Дұрыс жауап
            </span>
          )}
        </span>
      </span>
    </Wrapper>
  )
}
