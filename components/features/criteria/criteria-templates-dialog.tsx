"use client"

import { BookOpen, Code2, Presentation, FlaskConical } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import type { GradingCriteria } from "@/lib/types"

type TemplateCriterion = Omit<GradingCriteria, "id" | "assignment_id" | "order_index">

interface Template {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  criteria: TemplateCriterion[]
}

const TEMPLATES: Template[] = [
  {
    id: "essay",
    label: "Essay / Written Work",
    description: "5 criteria for analytical essays and written assignments",
    icon: BookOpen,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    criteria: [
      { name: "Thesis Statement", description: "Clear, arguable thesis that addresses the prompt", max_score: 20, weight: 1.5, auto_checkable: false, difficulty: "medium", required: true },
      { name: "Evidence & Support", description: "Use of relevant evidence and examples", max_score: 25, weight: 1.5, auto_checkable: true, check_prompt: "Evaluate the quality and relevance of evidence used in this essay. Score from 0 to 25.", difficulty: "medium" },
      { name: "Analysis & Critical Thinking", description: "Depth of analysis and original insights", max_score: 25, weight: 2, auto_checkable: true, check_prompt: "Rate the depth of critical analysis and originality of thought. Score from 0 to 25.", difficulty: "hard" },
      { name: "Organization & Structure", description: "Logical flow with clear intro, body, and conclusion", max_score: 15, weight: 1, auto_checkable: false, difficulty: "easy" },
      { name: "Writing Mechanics", description: "Grammar, spelling, punctuation, and style", max_score: 15, weight: 1, auto_checkable: true, check_prompt: "Check grammar, spelling, and writing mechanics. Score from 0 to 15.", difficulty: "easy" },
    ],
  },
  {
    id: "coding",
    label: "Coding Project",
    description: "5 criteria for programming assignments",
    icon: Code2,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    criteria: [
      { name: "Correctness", description: "Code produces correct output for all test cases", max_score: 40, weight: 2, auto_checkable: true, check_prompt: "Evaluate whether the code logic is correct and handles all cases. Score from 0 to 40.", difficulty: "hard", required: true },
      { name: "Code Quality", description: "Clean, readable, and well-structured code", max_score: 20, weight: 1, auto_checkable: true, check_prompt: "Rate the code quality, readability, and structure. Score from 0 to 20.", difficulty: "medium" },
      { name: "Efficiency", description: "Optimal time and space complexity", max_score: 20, weight: 1.5, auto_checkable: true, check_prompt: "Assess the algorithmic efficiency and complexity. Score from 0 to 20.", difficulty: "hard" },
      { name: "Documentation", description: "Clear comments and documentation", max_score: 10, weight: 0.5, auto_checkable: false, difficulty: "easy" },
      { name: "Edge Cases", description: "Handles edge cases and invalid inputs", max_score: 10, weight: 1, auto_checkable: true, check_prompt: "Check if edge cases and invalid inputs are handled. Score from 0 to 10.", difficulty: "medium" },
    ],
  },
  {
    id: "presentation",
    label: "Presentation / Speech",
    description: "4 criteria for presentations and oral reports",
    icon: Presentation,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    criteria: [
      { name: "Content & Accuracy", description: "Accurate and comprehensive coverage of topic", max_score: 30, weight: 1.5, auto_checkable: false, difficulty: "medium", required: true },
      { name: "Organization & Flow", description: "Logical structure and smooth transitions", max_score: 25, weight: 1, auto_checkable: false, difficulty: "easy" },
      { name: "Visual Design", description: "Clear, professional, and engaging visuals", max_score: 20, weight: 1, auto_checkable: false, difficulty: "easy" },
      { name: "Delivery & Engagement", description: "Speaking clearly, confidently, and engaging audience", max_score: 25, weight: 1.5, auto_checkable: false, difficulty: "medium" },
    ],
  },
  {
    id: "research",
    label: "Research Paper",
    description: "5 criteria for academic research papers",
    icon: FlaskConical,
    color: "text-teal-600 bg-teal-50 border-teal-200",
    criteria: [
      { name: "Research Depth", description: "Comprehensive use of credible, diverse sources", max_score: 25, weight: 2, auto_checkable: true, check_prompt: "Evaluate the depth and quality of research and sources cited. Score from 0 to 25.", difficulty: "hard", required: true },
      { name: "Argumentation", description: "Clear, logical arguments supported by evidence", max_score: 25, weight: 1.5, auto_checkable: true, check_prompt: "Assess argument clarity and logical flow supported by evidence. Score from 0 to 25.", difficulty: "medium" },
      { name: "Methodology", description: "Appropriate and well-explained research methods", max_score: 20, weight: 1.5, auto_checkable: false, difficulty: "hard" },
      { name: "Conclusion", description: "Meaningful conclusions tied to research questions", max_score: 20, weight: 1, auto_checkable: false, difficulty: "medium" },
      { name: "Citations & Format", description: "Proper citation format (APA/MLA) and formatting", max_score: 10, weight: 0.5, auto_checkable: true, check_prompt: "Check citation format and overall document formatting. Score from 0 to 10.", difficulty: "easy" },
    ],
  },
]

interface CriteriaTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (criteria: TemplateCriterion[]) => void
  assignmentId: number
}

export function CriteriaTemplatesDialog({
  open,
  onOpenChange,
  onApply,
  assignmentId,
}: CriteriaTemplatesDialogProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const selectedTemplate = TEMPLATES.find((t) => t.id === selected)

  const handleApply = () => {
    if (!selectedTemplate) return
    onApply(selectedTemplate.criteria)
    onOpenChange(false)
    setSelected(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Criteria Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly add predefined grading criteria to your assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {TEMPLATES.map((template) => {
            const Icon = template.icon
            const isSelected = selected === template.id
            const totalPts = template.criteria.reduce((s, c) => s + c.max_score, 0)
            const aiCount = template.criteria.filter((c) => c.auto_checkable).length
            return (
              <Card
                key={template.id}
                onClick={() => setSelected(isSelected ? null : template.id)}
                className={`cursor-pointer p-4 transition-all border-2 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "hover:border-muted-foreground/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-lg border p-2 ${template.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{template.label}</p>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="text-xs">{totalPts} pts</Badge>
                        <Badge variant="outline" className="text-xs text-purple-600">{aiCount} AI</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>

                    {isSelected && (
                      <div className="mt-3 space-y-1.5">
                        {template.criteria.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-sm">
                            <span className="font-medium w-4 text-muted-foreground">{i + 1}.</span>
                            <span className="flex-1">{c.name}</span>
                            <span className="text-muted-foreground">{c.max_score}pts</span>
                            {c.auto_checkable && (
                              <Badge variant="secondary" className="text-xs text-purple-600">AI</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={!selected}>
            Apply Template ({selectedTemplate?.criteria.length || 0} criteria)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
