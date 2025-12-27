"use client"

import { useState } from "react"
import { Brain, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import type { GradingCriteria } from "@/lib/types"

interface AITestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  criterion: GradingCriteria | null
  onTest: (criteriaId: number, sampleText: string) => Promise<{ score: number; feedback: string }>
}

export function AITestDialog({ open, onOpenChange, criterion, onTest }: AITestDialogProps) {
  const [sampleText, setSampleText] = useState("")
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const handleTest = async () => {
    if (!criterion) return
    setIsTesting(true)
    try {
      const testResult = await onTest(criterion.id, sampleText)
      setResult(testResult)
    } catch (error) {
      console.error("AI test failed:", error)
    } finally {
      setIsTesting(false)
    }
  }

  const handleClose = () => {
    setSampleText("")
    setResult(null)
    onOpenChange(false)
  }

  const scorePercentage = result ? (result.score / (criterion?.max_score || 1)) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Test AI Evaluation
          </DialogTitle>
          <DialogDescription>Test how AI will evaluate submissions for: {criterion?.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Criterion Info */}
          <Card className="bg-muted/30 p-4">
            <div className="mb-2 text-sm font-medium">{criterion?.name}</div>
            <div className="text-sm text-muted-foreground">{criterion?.description}</div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>Max Score: {criterion?.max_score}</span>
              <span>Weight: {criterion?.weight}x</span>
            </div>
          </Card>

          {/* Sample Text Input */}
          <div className="space-y-2">
            <Label htmlFor="sample">Sample Submission Text</Label>
            <Textarea
              id="sample"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Paste a sample student submission to test the AI evaluation..."
              className="min-h-[150px]"
            />
          </div>

          {/* Result */}
          {result && (
            <Card className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Score</span>
                <div className="flex items-center gap-2">
                  {scorePercentage >= 70 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-bold">
                    {result.score} / {criterion?.max_score}
                  </span>
                </div>
              </div>
              <Progress value={scorePercentage} className="h-2" />
              <div className="space-y-1">
                <span className="text-sm font-medium">Feedback</span>
                <p className="text-sm text-muted-foreground">{result.feedback}</p>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleTest} disabled={!sampleText.trim() || isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Run Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
