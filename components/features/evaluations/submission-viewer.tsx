"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Submission, Student } from "@/lib/types"

interface SubmissionViewerProps {
  submission: Submission
  student: Student
}

export function SubmissionViewer({ submission, student }: SubmissionViewerProps) {
  const formattedDate = new Date(submission.submitted_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={student.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{student.name}</h3>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
        </div>
        <Badge
          variant={submission.status === "graded" ? "default" : "secondary"}
          className={submission.status === "graded" ? "bg-[var(--criteria-success)]" : ""}
        >
          {submission.status}
        </Badge>
      </div>

      <div className="border-b bg-muted/30 px-4 py-2 text-sm text-muted-foreground">Submitted: {formattedDate}</div>

      <ScrollArea className="flex-1 p-4">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{submission.content}</div>
        </div>
      </ScrollArea>
    </Card>
  )
}
