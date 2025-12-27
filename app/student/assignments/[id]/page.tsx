"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, Target, FileUp, Send, CheckCircle } from "lucide-react"
import Link from "next/link"

const mockAssignment = {
  id: 1,
  title: "Climate Change Research Essay",
  description: "Write a comprehensive research essay analyzing the impacts of climate change on global ecosystems.",
  course: "Environmental Science",
  due_date: "2024-02-15",
  max_score: 100,
  instructions: `
1. Research at least 5 credible sources
2. Write 2000-2500 words
3. Include citations in APA format
4. Submit as PDF document
  `,
  criteria: [
    { id: 1, name: "Research Quality", description: "Use credible, relevant sources", max_score: 25 },
    { id: 2, name: "Argument Structure", description: "Clear thesis with supporting evidence", max_score: 25 },
    { id: 3, name: "Writing Clarity", description: "Grammar, spelling, and coherence", max_score: 25 },
    { id: 4, name: "Citations & Sources", description: "Proper APA format citations", max_score: 25 },
  ],
}

export default function StudentAssignmentSubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  const handleContentChange = (value: string) => {
    setContent(value)
    const words = value.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 1500))
    router.push("/student/assignments")
  }

  const progress = Math.min((wordCount / 2000) * 100, 100)

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/student/assignments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{mockAssignment.title}</h1>
              <Badge variant="outline">{mockAssignment.course}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Due {new Date(mockAssignment.due_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {mockAssignment.max_score} points
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Submission */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Submission</CardTitle>
                <CardDescription>Write or paste your essay content below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Essay Content</Label>
                    <span className={`text-sm ${wordCount >= 2000 ? "text-green-500" : "text-muted-foreground"}`}>
                      {wordCount.toLocaleString()} / 2,000 words
                    </span>
                  </div>
                  <Textarea
                    placeholder="Start writing your essay here..."
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="min-h-[400px] font-mono"
                  />
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex items-center gap-4">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <FileUp className="h-4 w-4" />
                    Upload File
                  </Button>
                  <span className="text-sm text-muted-foreground">or paste your content above</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/student/assignments">Save Draft</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || wordCount < 100} className="gap-2">
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{mockAssignment.description}</p>
                <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
                  {mockAssignment.instructions}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grading Criteria</CardTitle>
                <CardDescription>Your work will be evaluated on:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAssignment.criteria.map((criterion) => (
                    <div key={criterion.id} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{criterion.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {criterion.description} ({criterion.max_score} pts)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
