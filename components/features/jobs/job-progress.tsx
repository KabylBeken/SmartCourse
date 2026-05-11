"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { getJobStatus, type JobStatus } from "@/lib/api/jobs"

interface JobProgressProps {
  jobId: string
  intervalMs?: number
  onDone?: (s: JobStatus) => void
}

const STATUS_LABEL: Record<JobStatus["status"], string> = {
  queued: "В очереди",
  running: "Выполняется",
  done: "Готово",
  failed: "Ошибка",
}

export function JobProgress({ jobId, intervalMs = 1000, onDone }: JobProgressProps) {
  const [status, setStatus] = useState<JobStatus | null>(null)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      try {
        const st = await getJobStatus(jobId)
        if (stopped) return
        setStatus(st)
        if (st.status === "done" || st.status === "failed") {
          onDone?.(st)
          return
        }
      } catch {
        // ignore — повторим
      }
      if (!stopped) timer = setTimeout(tick, intervalMs)
    }

    tick()
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }, [jobId, intervalMs, onDone])

  if (!status) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Получение статуса задачи…</span>
      </Card>
    )
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {status.status === "failed" && <AlertCircle className="h-4 w-4 text-red-500" />}
          {(status.status === "queued" || status.status === "running") && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
          <span className="text-sm font-medium">{STATUS_LABEL[status.status]}</span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {jobId.slice(0, 8)}
        </Badge>
      </div>
      <Progress value={status.progress} />
      {status.error && <p className="text-xs text-red-500">{status.error}</p>}
    </Card>
  )
}
