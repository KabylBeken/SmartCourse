"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import type { EventClickArg, DateSelectArg, EventDropArg, EventInput } from "@fullcalendar/core"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, CalendarDays, RefreshCw, Trash2, Plus } from "lucide-react"
import {
  listEvents, createEvent, updateEvent, deleteEvent, syncDeadlines,
  EVENT_COLORS, EVENT_LABELS,
  type ScheduleEvent, type EventType, type CreateEventRequest,
} from "@/lib/api/schedule"
import { getAllCourses, type Course } from "@/lib/api/courses"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toFC(ev: ScheduleEvent): EventInput {
  return {
    id: String(ev.id),
    title: ev.title,
    start: ev.start,
    end: ev.end,
    allDay: ev.all_day,
    backgroundColor: ev.color || EVENT_COLORS[ev.type as EventType] || "#6366f1",
    borderColor: ev.color || EVENT_COLORS[ev.type as EventType] || "#6366f1",
    extendedProps: { ...ev },
  }
}

const EVENT_TYPES: EventType[] = ["lesson", "deadline", "exam", "holiday", "meeting", "other"]

const defaultForm: CreateEventRequest = {
  title: "", description: "", start: "", end: "",
  all_day: false, type: "lesson", color: "", course_id: undefined,
}

// ─── Event Modal ──────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: CreateEventRequest) => Promise<void>
  onDelete?: () => Promise<void>
  initial: CreateEventRequest
  isEdit?: boolean
  courses: Course[]
  saving: boolean
}

function EventModal({ open, onClose, onSave, onDelete, initial, isEdit, courses, saving }: ModalProps) {
  const [form, setForm] = useState<CreateEventRequest>(initial)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { setForm(initial) }, [initial])

  const set = <K extends keyof CreateEventRequest>(k: K, v: CreateEventRequest[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim() || !form.start) return
    await onSave(form)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try { await onDelete() } finally { setDeleting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Оқиғаны өзгерту" : "Жаңа оқиға"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Title */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Атауы *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="мысалы: Алгебра сабағы" />
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Түрі</Label>
            <Select value={form.type} onValueChange={v => set("type", v as EventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: EVENT_COLORS[t] }} />
                      {EVENT_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course */}
          {courses.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Курс (міндетті емес)</Label>
              <Select
                value={form.course_id ? String(form.course_id) : "none"}
                onValueChange={v => set("course_id", v === "none" ? undefined : Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Таңдаңыз" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— жоқ —</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* All day */}
          <div className="flex items-center gap-3">
            <Switch id="allday" checked={!!form.all_day} onCheckedChange={v => set("all_day", v)} />
            <Label htmlFor="allday" className="text-sm">Бүкіл күн</Label>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Басталуы *</Label>
              <Input
                type={form.all_day ? "date" : "datetime-local"}
                value={form.start ? (form.all_day ? form.start.slice(0, 10) : form.start.slice(0, 16)) : ""}
                onChange={e => set("start", form.all_day ? e.target.value + "T00:00:00Z" : e.target.value + ":00Z")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Аяқталуы</Label>
              <Input
                type={form.all_day ? "date" : "datetime-local"}
                value={form.end ? (form.all_day ? form.end.slice(0, 10) : form.end.slice(0, 16)) : ""}
                onChange={e => set("end", form.all_day ? e.target.value + "T00:00:00Z" : e.target.value + ":00Z")}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Сипаттама</Label>
            <Textarea
              placeholder="Қосымша ақпарат…"
              rows={2}
              value={form.description}
              onChange={e => set("description", e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Түс (міндетті емес)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color || EVENT_COLORS[form.type as EventType] || "#6366f1"}
                onChange={e => set("color", e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border"
              />
              <span className="text-xs text-muted-foreground">{form.color || "(автоматты)"}</span>
              {form.color && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => set("color", "")}>Тазалау</Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEdit && onDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="mr-auto">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Болдырмау</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim() || !form.start}>
            {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            {isEdit ? "Сақтау" : "Жасау"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const router = useRouter()
  const calRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")
  const [syncMsg, setSyncMsg] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formInitial, setFormInitial] = useState<CreateEventRequest>(defaultForm)

  // Fetch courses
  useEffect(() => { getAllCourses().then(setCourses).catch(() => {}) }, [])

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listEvents()
      setEvents(data ?? [])
    } catch {
      setError("Кесте жүктелмеді")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleDateSelect = (sel: DateSelectArg) => {
    setEditingId(null)
    setFormInitial({
      ...defaultForm,
      start: sel.startStr,
      end: sel.endStr,
      all_day: sel.allDay,
    })
    setModalOpen(true)
  }

  const handleEventClick = (arg: EventClickArg) => {
    const ev = arg.event.extendedProps as ScheduleEvent
    if (ev.assignment_id) {
      router.push(`/assignments/${ev.assignment_id}`)
      return
    }
    setEditingId(ev.id)
    setFormInitial({
      title: ev.title,
      description: ev.description ?? "",
      start: ev.start,
      end: ev.end ?? "",
      all_day: ev.all_day,
      type: ev.type,
      color: ev.color ?? "",
      course_id: ev.course_id,
    })
    setModalOpen(true)
  }

  const handleDrop = async (arg: EventDropArg) => {
    const id = Number(arg.event.id)
    try {
      const updated = await updateEvent(id, {
        start: arg.event.startStr,
        end: arg.event.endStr || undefined,
        all_day: arg.event.allDay,
      })
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
    } catch {
      arg.revert()
    }
  }

  const handleResize = async (arg: EventResizeDoneArg) => {
    const id = Number(arg.event.id)
    try {
      const updated = await updateEvent(id, {
        start: arg.event.startStr,
        end: arg.event.endStr || undefined,
      })
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
    } catch {
      arg.revert()
    }
  }

  const handleSave = async (form: CreateEventRequest) => {
    setSaving(true)
    try {
      if (editingId) {
        const updated = await updateEvent(editingId, form)
        setEvents(prev => prev.map(e => e.id === editingId ? updated : e))
      } else {
        const created = await createEvent(form)
        setEvents(prev => [...prev, created])
      }
      setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Қате")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingId) return
    await deleteEvent(editingId)
    setEvents(prev => prev.filter(e => e.id !== editingId))
    setModalOpen(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg("")
    try {
      const { created } = await syncDeadlines()
      setSyncMsg(`${created} жаңа deadline event қосылды`)
      await fetchEvents()
    } catch {
      setError("Синхрондау қатесі")
    } finally {
      setSyncing(false)
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const fcEvents: EventInput[] = events.map(toFC)

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Сабақ кестесі
            </h1>
            <p className="text-muted-foreground">Drag-and-drop арқылы оқиғаларды жылжытыңыз</p>
          </div>
          <div className="flex items-center gap-2">
            {syncMsg && <span className="text-xs text-emerald-600">{syncMsg}</span>}
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              {syncing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Deadline sync
            </Button>
            <Button size="sm" onClick={() => { setEditingId(null); setFormInitial(defaultForm); setModalOpen(true) }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Оқиға қосу
            </Button>
          </div>
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {EVENT_TYPES.map(t => (
            <Badge key={t} variant="outline" className="gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: EVENT_COLORS[t] }} />
              {EVENT_LABELS[t]}
            </Badge>
          ))}
        </div>

        {/* Calendar */}
        <Card className="p-4 overflow-hidden">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              buttonText={{
                today: "Бүгін",
                month: "Ай",
                week: "Апта",
                day: "Күн",
                list: "Тізім",
              }}
              locale="ru"
              height="auto"
              selectable
              selectMirror
              editable
              droppable
              dayMaxEvents={3}
              events={fcEvents}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleDrop}
              eventResize={handleResize}
              eventContent={arg => (
                <div className="px-1 text-[11px] font-medium truncate">
                  {arg.event.title}
                </div>
              )}
            />
          )}
        </Card>
      </div>

      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={editingId ? handleDelete : undefined}
        initial={formInitial}
        isEdit={!!editingId}
        courses={courses}
        saving={saving}
      />
    </DashboardLayout>
  )
}
