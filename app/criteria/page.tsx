"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { CriteriaBuilder } from "@/components/features/criteria/criteria-builder"
import { AITestDialog } from "@/components/features/criteria/ai-test-dialog"
import { useToast } from "@/components/ui/use-toast"
import type { Assignment, GradingCriteria } from "@/lib/types"

// Mock data
const mockAssignment: Assignment = {
  id: 1,
  title: "Research Essay: Climate Change",
  description: "Write a comprehensive research essay on climate change impacts",
  course_id: 1,
  due_date: "2024-02-15",
  max_score: 100,
  created_at: "2024-01-01",
}

const mockCriteria: GradingCriteria[] = [
  {
    id: 1,
    assignment_id: 1,
    name: "Thesis Statement",
    description: "Clear and arguable thesis that addresses the prompt",
    max_score: 20,
    weight: 1.2,
    auto_checkable: true,
    check_prompt:
      "Evaluate if the essay has a clear, arguable thesis statement that directly addresses climate change impacts. Score 0-20 based on clarity and specificity.",
    order_index: 0,
  },
  {
    id: 2,
    assignment_id: 1,
    name: "Evidence & Research",
    description: "Quality and relevance of sources cited",
    max_score: 25,
    weight: 1.5,
    auto_checkable: true,
    check_prompt:
      "Assess the quality and relevance of research sources. Check for peer-reviewed sources, recent data, and proper citation. Score 0-25.",
    order_index: 1,
  },
  {
    id: 3,
    assignment_id: 1,
    name: "Organization & Structure",
    description: "Logical flow and paragraph structure",
    max_score: 20,
    weight: 1.0,
    auto_checkable: false,
    check_prompt: "",
    order_index: 2,
  },
  {
    id: 4,
    assignment_id: 1,
    name: "Grammar & Style",
    description: "Writing quality, grammar, and academic tone",
    max_score: 15,
    weight: 0.8,
    auto_checkable: true,
    check_prompt:
      "Check for grammar errors, academic tone, and writing clarity. Score 0-15 based on overall writing quality.",
    order_index: 3,
  },
]

export default function CriteriaPage() {
  const [criteria, setCriteria] = useState<GradingCriteria[]>(mockCriteria)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testingCriterion, setTestingCriterion] = useState<GradingCriteria | null>(null)
  const { toast } = useToast()

  const handleAddCriterion = () => {
    const newCriterion: GradingCriteria = {
      id: Date.now(),
      assignment_id: mockAssignment.id,
      name: "New Criterion",
      description: "",
      max_score: 10,
      weight: 1.0,
      auto_checkable: false,
      check_prompt: "",
      order_index: criteria.length,
    }
    setCriteria((prev) => [...prev, newCriterion])
  }

  const handleUpdateCriterion = (id: number, data: Partial<GradingCriteria>) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }

  const handleDeleteCriterion = (id: number) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id))
  }

  const handleReorderCriteria = (ids: number[]) => {
    setCriteria((prev) =>
      ids.map((id, index) => {
        const criterion = prev.find((c) => c.id === id)!
        return { ...criterion, order_index: index }
      }),
    )
  }

  const handleSave = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast({ title: "Criteria saved", description: "Your grading criteria have been updated." })
  }

  const handleOpenAITest = (criterion: GradingCriteria) => {
    setTestingCriterion(criterion)
    setTestDialogOpen(true)
  }

  const handleTestAI = async (criteriaId: number, sampleText: string) => {
    // Simulate API call: POST /api/teacher/criteria/:id/test
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const criterion = criteria.find((c) => c.id === criteriaId)
    const mockScore = Math.floor(Math.random() * (criterion?.max_score || 10)) + 5
    return {
      score: Math.min(mockScore, criterion?.max_score || 10),
      feedback: `The submission demonstrates understanding of the topic. Key strengths include clear argumentation and relevant examples. Consider improving the depth of analysis in certain sections.`,
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <CriteriaBuilder
        assignment={mockAssignment}
        criteria={criteria}
        onAddCriterion={handleAddCriterion}
        onUpdateCriterion={handleUpdateCriterion}
        onDeleteCriterion={handleDeleteCriterion}
        onReorderCriteria={handleReorderCriteria}
        onSave={handleSave}
        onTestAICriterion={handleOpenAITest}
      />

      <AITestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        criterion={testingCriterion}
        onTest={handleTestAI}
      />
    </DashboardLayout>
  )
}
