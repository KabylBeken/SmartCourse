"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { StudentCriteriaView } from "@/components/features/student/student-criteria-view"
import type { Assignment, GradingCriteria } from "@/lib/types"

// Mock data - in real app, fetch from /api/student/assignments/:id/criteria
const mockAssignment: Assignment = {
  id: 1,
  title: "Climate Change Research Essay",
  description: "Write a comprehensive research essay on climate change impacts and potential solutions",
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
    description:
      "Clear and arguable thesis that addresses the prompt. Your thesis should be specific and take a clear stance on the topic.",
    max_score: 20,
    weight: 1.2,
    auto_checkable: true,
    check_prompt: "",
    order_index: 0,
  },
  {
    id: 2,
    assignment_id: 1,
    name: "Evidence & Research",
    description:
      "Quality and relevance of sources cited. Use peer-reviewed sources, recent data, and proper citation format.",
    max_score: 25,
    weight: 1.5,
    auto_checkable: true,
    check_prompt: "",
    order_index: 1,
  },
  {
    id: 3,
    assignment_id: 1,
    name: "Organization & Structure",
    description:
      "Logical flow and paragraph structure. Your essay should have clear introduction, body, and conclusion sections.",
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
    description: "Writing quality, grammar, and academic tone. Maintain formal language throughout.",
    max_score: 15,
    weight: 0.8,
    auto_checkable: true,
    check_prompt: "",
    order_index: 3,
  },
  {
    id: 5,
    assignment_id: 1,
    name: "Conclusion & Recommendations",
    description: "Strong conclusion that summarizes findings and provides actionable recommendations.",
    max_score: 20,
    weight: 1.0,
    auto_checkable: false,
    check_prompt: "",
    order_index: 4,
  },
]

export default function StudentCriteriaPage() {
  return (
    <DashboardLayout userRole="student">
      <StudentCriteriaView assignment={mockAssignment} criteria={mockCriteria} />
    </DashboardLayout>
  )
}
