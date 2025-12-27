"use client"

import { use } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, Edit, Target, Users, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

const mockAssignment = {
  id: 1,
  title: "Climate Change Research Essay",
  description: "Write a comprehensive research essay analyzing the impacts of climate change on global ecosystems.",
  course: "Environmental Science",
  due_date: "2024-02-15",
  max_score: 100,
  created_at: "2024-01-01",
  instructions: `
    1. Research at least 5 credible sources
    2. Write 2000-2500 words
    3. Include citations in APA format
    4. Submit as PDF document
  `,
  criteria: [
    { id: 1, name: "Research Quality", max_score: 25, weight: 25 },
    { id: 2, name: "Argument Structure", max_score: 25, weight: 25 },
    { id: 3, name: "Writing Clarity", max_score: 25, weight: 25 },
    { id: 4, name: "Citations & Sources", max_score: 25, weight: 25 },
  ],
  submissions: [
    { id: 1, student: "Alice Johnson", status: "graded", score: 92, submitted_at: "2024-02-14" },
    { id: 2, student: "Bob Smith", status: "graded", score: 85, submitted_at: "2024-02-14" },
    { id: 3, student: "Carol Williams", status: "pending", score: null, submitted_at: "2024-02-15" },
    { id: 4, student: "David Brown", status: "pending", score: null, submitted_at: "2024-02-15" },
  ],
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const assignment = mockAssignment

  const gradedCount = assignment.submissions.filter((s) => s.status === "graded").length
  const pendingCount = assignment.submissions.filter((s) => s.status === "pending").length
  const avgScore =
    assignment.submissions.filter((s) => s.score !== null).reduce((acc, s) => acc + (s.score || 0), 0) / gradedCount ||
    0

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/assignments">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{assignment.title}</h1>
              <p className="text-muted-foreground">{assignment.course}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/criteria?assignment=${id}`}>
                <Target className="mr-2 h-4 w-4" />
                Criteria
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/assignments/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/evaluations?assignment=${id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Grade Submissions
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{assignment.submissions.length}</div>
                <div className="text-sm text-muted-foreground">Submissions</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{gradedCount}</div>
                <div className="text-sm text-muted-foreground">Graded</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{avgScore.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Avg Score</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="criteria">Criteria</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium">Description</h4>
                  <p className="text-muted-foreground">{assignment.description}</p>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Instructions</h4>
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{assignment.instructions}</pre>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>Max Score: {assignment.max_score}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignment.submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{submission.student.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{submission.student}</div>
                          <div className="text-sm text-muted-foreground">
                            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {submission.status === "graded" ? (
                          <>
                            <div className="text-right">
                              <div className="font-bold">{submission.score}/100</div>
                              <Progress value={submission.score || 0} className="mt-1 h-1.5 w-20" />
                            </div>
                            <Badge className="bg-green-500">Graded</Badge>
                          </>
                        ) : (
                          <>
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          </>
                        )}
                        <Button size="sm" asChild>
                          <Link href={`/evaluations?submission=${submission.id}`}>
                            {submission.status === "graded" ? "Review" : "Grade"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="criteria" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Grading Criteria</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/criteria?assignment=${id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Criteria
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignment.criteria.map((criterion) => (
                    <div key={criterion.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">{criterion.name}</div>
                        <div className="text-sm text-muted-foreground">Weight: {criterion.weight}%</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{criterion.max_score} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
