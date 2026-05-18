"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import listPlugin from "@fullcalendar/list"
import type { EventClickArg, EventInput } from "@fullcalendar/core"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CalendarDays } from "lucide-react"
import { getStudentCalendar, type StudentCalendarEvent } from "@/lib/api/student-calendar"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  lesson:   "Сабақ",
  deadline: "Deadline",
  exam:     "Емтихан",
  holiday:  "Демалыс",
  meeting:  "Кездесу",
  other:    "Басқа",
}

const EVENT_COLORS: Record<string, string> = {
  lesson:   "#6366f1",
  deadline: "#ef4444",
  exam:     "#f97316",
  holiday:  "#22c55e",
  meeting:  "#3b82f6",
  other:    "#8b5cf6",
}

function toFC(ev: StudentCalendarEvent): EventInput {
  return {
    id: String(ev.id),
    title: ev.title,
    start: ev.start,
    end: ev.end,
    allDay: ev.all_day,
    backgroundColor: ev.color || EVENT_COLORS[ev.type] || "#6366f1",
    borderColor: ev.color || EVENT_COLORS[ev.type] || "#6366f1",
    extendedProps: { ...ev },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentCalendarPage() {
  const router = useRouter()
  const calRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<StudentCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getStudentCalendar()
      setEvents(data ?? [])
    } catch {
      setError("Кесте жүктелмеді")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleEventClick = (arg: EventClickArg) => {
    const ev = arg.event.extendedProps as StudentCalendarEvent
    if (ev.assignment_id) {
      router.push(`/student/assignments/${ev.assignment_id}`)
    }
  }

  const fcEvents: EventInput[] = events.map(toFC)

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Менің кестем
            </h1>
            <p className="text-muted-foreground text-sm">
              Тапсырма deadline-дары · Оқиғаны басу → тапсырмаға өту
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(EVENT_LABELS).map(([type, label]) => (
            <Badge key={type} variant="outline" className="gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: EVENT_COLORS[type] }} />
              {label}
            </Badge>
          ))}
          <Badge variant="outline" className="gap-1.5 text-xs text-muted-foreground">
            Тапсырма оқиғасын басу → ашылады
          </Badge>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card className="overflow-hidden p-2">
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left:   "prev,next today",
                center: "title",
                right:  "dayGridMonth,listWeek",
              }}
              buttonText={{
                today:    "Бүгін",
                month:    "Ай",
                listWeek: "Тізім",
              }}
              locale="kk"
              firstDay={1}
              height="auto"
              events={fcEvents}
              eventClick={handleEventClick}
              eventMouseEnter={(arg) => {
                arg.el.style.cursor = "pointer"
              }}
              eventMouseLeave={(arg) => {
                arg.el.style.cursor = ""
              }}
              noEventsContent="Жақын арада deadline жоқ 🎉"
              eventContent={(arg) => (
                <div className="flex flex-col px-1 py-0.5 text-white overflow-hidden">
                  <span className="truncate text-xs font-semibold leading-tight">
                    {arg.event.title}
                  </span>
                  {arg.event.extendedProps.course_title && (
                    <span className="truncate text-[10px] opacity-80 leading-tight">
                      {arg.event.extendedProps.course_title}
                    </span>
                  )}
                </div>
              )}
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
