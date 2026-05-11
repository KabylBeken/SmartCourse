"use client"

import { useCallback, useState } from "react"
import { Bell, CheckCircle2, AlertCircle, Loader2, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useWebSocket, type WSEvent } from "@/lib/realtime/ws"

export interface Notification {
  id: string
  type: string
  title: string
  description?: string
  variant: "info" | "success" | "warning" | "error"
  at: string
}

function eventToNotification(ev: WSEvent): Notification | null {
  switch (ev.type) {
    case "job_status": {
      const p = ev.payload as { id: string; status: string; error?: string; progress?: number }
      if (p.status === "done") {
        return {
          id: p.id,
          type: ev.type,
          title: "Задача завершена",
          description: `Job ${p.id.slice(0, 8)} выполнен успешно`,
          variant: "success",
          at: ev.at,
        }
      }
      if (p.status === "failed") {
        return {
          id: p.id,
          type: ev.type,
          title: "Задача упала",
          description: p.error ?? "—",
          variant: "error",
          at: ev.at,
        }
      }
      return null // running/queued — не показываем как нотификации
    }
    case "submission_submitted": {
      const p = ev.payload as { student_name?: string; assignment_title?: string }
      return {
        id: `sub-${ev.at}`,
        type: ev.type,
        title: "Новая работа сдана",
        description: `${p.student_name ?? "Студент"} → ${p.assignment_title ?? ""}`,
        variant: "info",
        at: ev.at,
      }
    }
    case "grade_updated":
      return {
        id: `grade-${ev.at}`,
        type: ev.type,
        title: "Оценка обновлена",
        variant: "info",
        at: ev.at,
      }
    default:
      return null
  }
}

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const onEvent = useCallback((ev: WSEvent) => {
    const n = eventToNotification(ev)
    if (n) setItems((prev) => [n, ...prev].slice(0, 30))
  }, [])

  const { connected } = useWebSocket(onEvent)

  const unread = items.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full bg-red-500 px-1.5 text-[10px] text-white">
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <p className="font-semibold">Уведомления</p>
          <span
            className={
              "flex items-center gap-1 text-xs " +
              (connected ? "text-green-600" : "text-muted-foreground")
            }
          >
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? "online" : "offline"}
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Пока пусто</p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id + n.at} className="flex items-start gap-3 p-3">
                  <div className="mt-0.5">
                    {n.variant === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {n.variant === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {n.variant === "info" && <Loader2 className="h-4 w-4 text-blue-500" />}
                    {n.variant === "warning" && <AlertCircle className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.description && (
                      <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(n.at).toLocaleTimeString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setItems([])}
            >
              Очистить
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
