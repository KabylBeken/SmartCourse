"use client"

import { useState, useEffect } from "react"
import { Sparkles, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Prompt } from "@/lib/types"

interface PromptGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: Prompt | null
  onGenerate: (id: number, variables: Record<string, string>) => Promise<{ assignment: string }>
}

export function PromptGeneratorDialog({ open, onOpenChange, prompt, onGenerate }: PromptGeneratorDialogProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [generatedText, setGeneratedText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (prompt) {
      const initialVars: Record<string, string> = {}
      prompt.variables.forEach((v) => {
        initialVars[v] = ""
      })
      setVariables(initialVars)
      setGeneratedText("")
    }
  }, [prompt])

  const handleGenerate = async () => {
    if (!prompt) return
    setIsGenerating(true)
    try {
      const result = await onGenerate(prompt.id, variables)
      setGeneratedText(result.assignment)
    } catch (error) {
      console.error("Generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isFormValid = prompt?.variables.every((v) => variables[v]?.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Assignment
          </DialogTitle>
          <DialogDescription>{prompt?.title} - Fill in the variables to generate your assignment</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variables Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">Variables</h4>
              <Badge variant="secondary">{prompt?.variables.length || 0}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {prompt?.variables.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable} className="capitalize">
                    {variable.replace(/_/g, " ")}
                  </Label>
                  <Input
                    id={variable}
                    value={variables[variable] || ""}
                    onChange={(e) => setVariables((prev) => ({ ...prev, [variable]: e.target.value }))}
                    placeholder={`Enter ${variable.replace(/_/g, " ")}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Generated Output */}
          {generatedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Assignment</Label>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <Textarea value={generatedText} readOnly className="min-h-[200px] resize-none bg-muted/50" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleGenerate} disabled={!isFormValid || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
