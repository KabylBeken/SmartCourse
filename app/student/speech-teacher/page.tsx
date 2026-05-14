"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Mic,
  MicOff,
  Volume2,
  Send,
  Trash2,
  Bot,
  User,
  Loader2,
  Languages,
  Square,
  Keyboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  sendSpeechChat,
  playAudioBase64,
  textToSpeech,
  type SpeechMessage,
  type ChatHistoryItem,
} from "@/lib/api/speech-teacher"

// ─── Status type ────────────────────────────────────────────────────────────

type ConversationStatus =
  | "idle"
  | "recording"
  | "processing"
  | "speaking"
  | "error"

const statusLabels: Record<ConversationStatus, string> = {
  idle: "Тайын — сөйлеңіз немесе жазыңыз",
  recording: "Жазылып жатыр...",
  processing: "AI өңдеп жатыр...",
  speaking: "AI сөйлеп жатыр...",
  error: "Қате орын алды",
}

// ─── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onReplay,
  replaying,
}: {
  msg: SpeechMessage
  onReplay?: () => void
  replaying?: boolean
}) {
  const isUser = msg.role === "user"
  return (
    <div
      className={cn(
        "flex gap-3 py-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-violet-100 dark:bg-violet-900/50"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        {msg.content}
        {!isUser && msg.audioBase64 && onReplay && (
          <button
            onClick={onReplay}
            disabled={replaying}
            className="ml-2 inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 dark:text-violet-400 disabled:opacity-50"
          >
            {replaying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
            Тыңдау
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Animated microphone pulse ──────────────────────────────────────────────

function MicPulse({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute h-20 w-20 animate-ping rounded-full bg-red-400/30" />
      <div className="absolute h-16 w-16 animate-pulse rounded-full bg-red-400/20" />
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SpeechTeacherPage() {
  const [messages, setMessages] = useState<SpeechMessage[]>([])
  const [status, setStatus] = useState<ConversationStatus>("idle")
  const [language, setLanguage] = useState("en")
  const [error, setError] = useState("")
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice")
  const [textInput, setTextInput] = useState("")
  const [replayingId, setReplayingId] = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 50)
  }, [])

  // Build history for API
  const buildHistory = useCallback((): ChatHistoryItem[] => {
    return messages.map((m) => ({ role: m.role, content: m.content }))
  }, [messages])

  // ── Start recording ────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })

      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        handleAudioSend(blob)
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setStatus("recording")
    } catch {
      setError("Микрофонға рұқсат берілмеді")
      setStatus("error")
    }
  }, [])

  // ── Stop recording ─────────────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // ── Send audio ─────────────────────────────────────────────────────────────

  const handleAudioSend = useCallback(
    async (blob: Blob) => {
      setStatus("processing")

      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(blob)

      reader.onloadend = async () => {
        const base64Full = reader.result as string
        // Strip data:audio/webm;base64, prefix
        const base64 = base64Full.split(",")[1]

        try {
          const response = await sendSpeechChat({
            audio: base64,
            audioMimeType: "audio/webm",
            language,
            history: buildHistory(),
          })

          // Add user message
          const userMsg: SpeechMessage = {
            id: Date.now(),
            role: "user",
            content: response.userTranscription,
            timestamp: new Date().toISOString(),
          }

          // Add assistant message
          const assistantMsg: SpeechMessage = {
            id: Date.now() + 1,
            role: "assistant",
            content: response.assistantText,
            audioBase64: response.assistantAudio,
            audioMimeType: response.audioMimeType,
            timestamp: new Date().toISOString(),
          }

          setMessages((prev) => [...prev, userMsg, assistantMsg])
          scrollBottom()

          // Auto-play response
          if (response.assistantAudio) {
            setStatus("speaking")
            try {
              await playAudioBase64(
                response.assistantAudio,
                response.audioMimeType ?? "audio/L16;rate=24000"
              )
            } catch {
              // Playback failed, continue silently
            }
          }

          setStatus("idle")
        } catch (e) {
          setError(e instanceof Error ? e.message : "Қате орын алды")
          setStatus("error")
          setTimeout(() => setStatus("idle"), 3000)
        }
      }
    },
    [language, buildHistory, scrollBottom]
  )

  // ── Send text ──────────────────────────────────────────────────────────────

  const handleTextSend = useCallback(async () => {
    const text = textInput.trim()
    if (!text) return

    setTextInput("")
    setError("")
    setStatus("processing")

    // Add user message immediately
    const userMsg: SpeechMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    scrollBottom()

    try {
      const response = await sendSpeechChat({
        text,
        language,
        history: buildHistory(),
      })

      const assistantMsg: SpeechMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.assistantText,
        audioBase64: response.assistantAudio,
        audioMimeType: response.audioMimeType,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])
      scrollBottom()

      // Auto-play response
      if (response.assistantAudio) {
        setStatus("speaking")
        try {
          await playAudioBase64(
            response.assistantAudio,
            response.audioMimeType ?? "audio/L16;rate=24000"
          )
        } catch {
          // Playback failed
        }
      }

      setStatus("idle")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате орын алды")
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }, [textInput, language, buildHistory, scrollBottom])

  // ── Replay audio ───────────────────────────────────────────────────────────

  const handleReplay = useCallback(
    async (msg: SpeechMessage) => {
      if (!msg.audioBase64) {
        // Generate TTS on the fly
        try {
          setReplayingId(msg.id)
          const { audioBase64, mimeType } = await textToSpeech(
            msg.content,
            language
          )
          await playAudioBase64(audioBase64, mimeType)
        } catch {
          // ignore
        } finally {
          setReplayingId(null)
        }
        return
      }

      setReplayingId(msg.id)
      try {
        await playAudioBase64(
          msg.audioBase64,
          msg.audioMimeType ?? "audio/L16;rate=24000"
        )
      } catch {
        // ignore
      } finally {
        setReplayingId(null)
      }
    },
    [language]
  )

  // ── Clear ──────────────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setMessages([])
    setError("")
    setStatus("idle")
  }, [])

  // ── Keyboard shortcut ─────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleTextSend()
    }
  }

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  const isRecording = status === "recording"
  const isProcessing = status === "processing"
  const isSpeaking = status === "speaking"
  const isBusy = isProcessing || isSpeaking

  return (
    <DashboardLayout userRole="student">
      <div className="flex h-[calc(100vh-80px)] flex-col gap-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
              <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                The Patient Teacher
              </h1>
              <p className="text-xs text-muted-foreground">
                Шыдамды және қолдаушы тіл мұғалімі
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isRecording && "border-red-300 text-red-600",
                isProcessing && "border-amber-300 text-amber-600",
                isSpeaking && "border-violet-300 text-violet-600"
              )}
            >
              {statusLabels[status]}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Language selector */}
            <div className="flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={messages.length === 0}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="ml-1.5 hidden sm:inline">Тазалау</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Тарихты тазалау</AlertDialogTitle>
                  <AlertDialogDescription>
                    Барлық хабарламалар жойылады. Бұл әрекетті кері қайтаруға
                    болмайды.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Болдырмау</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear}>
                    Тазалау
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <Bot className="h-10 w-10 text-violet-500" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">
                The Patient Teacher
              </h2>
              <p className="mb-1 max-w-md text-sm text-muted-foreground">
                {language === "ru"
                  ? "Здравствуйте! Я ваш терпеливый учитель. Нажмите на микрофон и начните говорить, или напишите текст. Я помогу вам практиковать язык!"
                  : "Hello! I'm your patient teacher. Click the microphone and start speaking, or type a message. I'll help you practice your language skills!"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  🎤 Голос
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  ⌨️ Текст
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  🔊 TTS ответы
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  🌍{" "}
                  {language === "ru" ? "English / Русский" : "English / Russian"}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-1 py-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onReplay={
                    msg.role === "assistant"
                      ? () => handleReplay(msg)
                      : undefined
                  }
                  replaying={replayingId === msg.id}
                />
              ))}
              {isProcessing && (
                <div className="flex gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
                    <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Ойланып жатыр...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="px-4 pb-2">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Input area */}
        <div className="border-t bg-card px-4 py-4">
          {inputMode === "voice" ? (
            /* Voice mode */
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <MicPulse active={isRecording} />
                <Button
                  size="lg"
                  className={cn(
                    "relative z-10 h-16 w-16 rounded-full shadow-lg transition-all",
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white scale-110"
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  )}
                  disabled={isBusy}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <Square className="h-6 w-6" />
                  ) : isBusy ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRecording
                  ? "Тоқтату үшін басыңыз"
                  : isBusy
                    ? statusLabels[status]
                    : "Микрофонды басып сөйлеңіз"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setInputMode("text")}
              >
                <Keyboard className="mr-1.5 h-3.5 w-3.5" />
                Клавиатураға ауысу
              </Button>
            </div>
          ) : (
            /* Text mode */
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    language === "ru"
                      ? "Напишите сообщение..."
                      : "Type a message..."
                  }
                  className="min-h-[44px] max-h-[120px] resize-none"
                  disabled={isBusy}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  onClick={handleTextSend}
                  disabled={!textInput.trim() || isBusy}
                >
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInputMode("voice")}
                  title="Микрофонға ауысу"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
