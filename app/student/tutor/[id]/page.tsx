"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Bot, Send, Trash2, ArrowLeft, Loader2, User, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getTutorSession, streamTutorMessage, clearTutorHistory,
  type TutorMessage,
} from "@/lib/api/tutor"
import { getStudentAssignment, type Assignment } from "@/lib/api/assignments"

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: TutorMessage & { streaming?: boolean } }) {
  const isUser = msg.role === "user"
  return (
    <div className={cn("flex gap-3 py-2", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-muted text-foreground rounded-tl-sm"
      )}>
        {msg.content}
        {msg.streaming && (
          <span className="ml-1 inline-block animate-pulse text-base leading-none">▋</span>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TutorPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = Number(params.id)

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [clearing, setClearing] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom
  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 50)
  }, [])

  // Load session + assignment
  useEffect(() => {
    if (!assignmentId) return
    setLoading(true)
    Promise.all([
      getTutorSession(assignmentId),
      getStudentAssignment(assignmentId).catch(() => null),
    ]).then(([session, assign]) => {
      setMessages(session.messages ?? [])
      if (assign) setAssignment(assign)
    }).catch(e => {
      setError(e.message ?? "Жүктеу қатесі")
    }).finally(() => {
      setLoading(false)
      scrollBottom()
    })
  }, [assignmentId, scrollBottom])

  // Send message
  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || sending) return

    setInput("")
    setSending(true)
    setError("")

    // Add user message immediately
    const userMsg: TutorMessage = {
      id: Date.now(),
      session_id: 0,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    // Streaming assistant message placeholder
    const assistantId = Date.now() + 1
    const assistantMsg: TutorMessage & { streaming?: boolean } = {
      id: assistantId,
      session_id: 0,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      streaming: true,
    }
    setMessages(prev => [...prev, assistantMsg])
    scrollBottom()

    abortRef.current = new AbortController()
    try {
      await streamTutorMessage(
        assignmentId,
        content,
        (delta) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content + delta }
                : m
            )
          )
          scrollBottom()
        },
        abortRef.current.signal
      )
      // Mark streaming done
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      )
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message ?? "Stream қатесі")
        setMessages(prev => prev.filter(m => m.id !== assistantId))
      }
    } finally {
      setSending(false)
      scrollBottom()
      textareaRef.current?.focus()
    }
  }, [input, sending, assignmentId, scrollBottom])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearTutorHistory(assignmentId)
      setMessages([])
    } catch (e: unknown) {
      setError((e as Error).message ?? "Тазалау қатесі")
    } finally {
      setClearing(false)
    }
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout userRole="student">
      <div className="flex h-[calc(100vh-80px)] flex-col gap-0">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-base font-semibold leading-tight">AI Репетитор</h1>
                {assignment && (
                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {assignment.title}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {messages.filter(m => m.role === "user").length} сұрақ
            </Badge>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={clearing || messages.length === 0}>
                {clearing
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
                <span className="ml-1.5 hidden sm:inline">Тазалау</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Тарихты тазалау</AlertDialogTitle>
                <AlertDialogDescription>
                  Барлық хабарламалар жойылады. Бұл әрекетті кері қайтаруға болмайды.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Болдырмау</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear}>Жою</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* System note */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b px-4 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 shrink-0" />
            AI жауапты тікелей бермейді — тек түсіндіреді және бағыттайды. Өз ойыңмен жауап тауып көр!
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mx-4 mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef as never}>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Sparkles className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">AI Репетиторға сұрақ қой</p>
              <p className="mt-1 text-xs opacity-70">
                Тапсырма бойынша кез-келген сұрақты жаза аласың
              </p>
            </div>
          ) : (
            <div className="py-4">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background px-4 py-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Сұрақыңды жаз… (Enter — жіберу, Shift+Enter — жол салу)"
              className="min-h-[44px] max-h-[160px] flex-1 resize-none"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              rows={1}
            />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Тапсырма контексті автоматты жүктеледі
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
