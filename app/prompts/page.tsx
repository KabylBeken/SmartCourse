"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PromptLibrary } from "@/components/features/prompts/prompt-library"
import { useToast } from "@/components/ui/use-toast"
import type { Prompt, CreatePromptRequest } from "@/lib/types"

// Mock data for demonstration
const mockPrompts: Prompt[] = [
  {
    id: 1,
    title: "Essay Topic Generator",
    description: "Generate thought-provoking essay topics for various subjects",
    prompt_text: "Generate 5 essay topics for {{subject}} at the {{grade_level}} level focusing on {{skill}}.",
    category: "essay",
    is_public: true,
    created_at: "2024-01-15",
    updated_at: "2024-01-15",
    teacher_id: 1,
    variables: ["subject", "grade_level", "skill"],
  },
  {
    id: 2,
    title: "Quiz Question Builder",
    description: "Create multiple choice questions with distractors",
    prompt_text: "Create {{count}} multiple choice questions about {{topic}} with 4 options each.",
    category: "quiz",
    is_public: false,
    created_at: "2024-01-10",
    updated_at: "2024-01-12",
    teacher_id: 1,
    variables: ["count", "topic"],
  },
  {
    id: 3,
    title: "Project Rubric Generator",
    description: "Generate detailed project rubrics with clear criteria",
    prompt_text: "Create a rubric for a {{project_type}} project in {{subject}} with {{criteria_count}} criteria.",
    category: "project",
    is_public: true,
    created_at: "2024-01-08",
    updated_at: "2024-01-08",
    teacher_id: 1,
    variables: ["project_type", "subject", "criteria_count"],
  },
]

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts)
  const { toast } = useToast()

  const handleCreatePrompt = async (data: CreatePromptRequest) => {
    // Simulate API call
    const newPrompt: Prompt = {
      id: Date.now(),
      ...data,
      description: data.description || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      teacher_id: 1,
      variables: [...data.prompt_text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]),
    }
    setPrompts((prev) => [newPrompt, ...prev])
    toast({ title: "Prompt created", description: "Your new prompt has been saved." })
  }

  const handleUpdatePrompt = async (id: number, data: CreatePromptRequest) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...data,
              updated_at: new Date().toISOString(),
              variables: [...data.prompt_text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]),
            }
          : p,
      ),
    )
    toast({ title: "Prompt updated", description: "Your changes have been saved." })
  }

  const handleDeletePrompt = async (id: number) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    toast({ title: "Prompt deleted", description: "The prompt has been removed." })
  }

  const handleUsePrompt = (prompt: Prompt) => {
    toast({ title: "Using prompt", description: `Navigating to create assignment with "${prompt.title}"` })
  }

  return (
    <DashboardLayout userRole="teacher">
      <PromptLibrary
        prompts={prompts}
        onCreatePrompt={handleCreatePrompt}
        onUpdatePrompt={handleUpdatePrompt}
        onDeletePrompt={handleDeletePrompt}
        onUsePrompt={handleUsePrompt}
      />
    </DashboardLayout>
  )
}
