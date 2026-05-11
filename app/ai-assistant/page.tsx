"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, Sparkles, BookOpen, FileQuestion, Lightbulb, Copy, Check, ClipboardList } from "lucide-react"
import {
  runLessonPlan, runTestGenerate, runImprove,
  type LessonPlanResult, type TestGenerateResult, type ImproveResult,
} from "@/lib/api/ai-assistant"
import { type JobStatus } from "@/lib/api/jobs"
import { motion, AnimatePresence } from "framer-motion"

// ─── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Көшіру">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

// ─── Progress hint ─────────────────────────────────────────────────────────────

function JobProgress({ status, progress }: { status: JobStatus | null; progress: number }) {
  if (!status) return null
  return (
    <div className="space-y-1">
      <Progress value={progress} className="h-1.5" />
      <p className="text-xs text-muted-foreground">{status.status === "running" ? "AI жауап өңдеп жатыр…" : "Кезекте…"} {progress}%</p>
    </div>
  )
}

// ─── LESSON PLAN TAB ───────────────────────────────────────────────────────────

function LessonPlanTab() {
  const [topic, setTopic] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [duration, setDuration] = useState("45")
  const [bloomLevel, setBloomLevel] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [result, setResult] = useState<LessonPlanResult | null>(null)
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true); setError(""); setResult(null); setProgress(5)
    try {
      const r = await runLessonPlan(
        { topic, gradeLevel, duration: Number(duration), bloomLevel },
        s => { setJobStatus(s); setProgress(s.progress ?? 50) },
      )
      setResult(r); setProgress(100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Қате")
    } finally {
      setLoading(false); setJobStatus(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Тақырып *</label>
          <Input placeholder="мысалы: Фотосинтез" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Сынып / деңгей</label>
          <Input placeholder="мысалы: 9-сынып" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ұзақтығы (мин)</label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["30", "40", "45", "60", "80", "90"].map(v => (
                <SelectItem key={v} value={v}>{v} мин</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Блум деңгейі</label>
          <Select value={bloomLevel} onValueChange={setBloomLevel}>
            <SelectTrigger><SelectValue placeholder="Таңдаңыз (міндетті емес)" /></SelectTrigger>
            <SelectContent>
              {["Білу", "Түсіну", "Қолдану", "Талдау", "Бағалау", "Жасау"].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full sm:w-auto">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {loading ? "Генерацияланып жатыр…" : "Жоспар жасау"}
      </Button>
      {loading && <JobProgress status={jobStatus} progress={progress} />}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{result.title}</h3>
              <CopyBtn text={JSON.stringify(result, null, 2)} />
            </div>
            {/* Objectives */}
            <Card className="border-0 bg-blue-50 dark:bg-blue-950/30">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm text-blue-700 dark:text-blue-400">Мақсаттар</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3">
                <ul className="space-y-1">
                  {result.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="mt-0.5 text-blue-500">•</span>{o}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            {/* Outline */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm">Сабақ жоспары</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {result.outline.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start rounded-lg p-2.5 bg-muted/40">
                    <Badge variant="outline" className="shrink-0 mt-0.5">{step.duration} мин</Badge>
                    <div>
                      <div className="text-sm font-medium">{step.stage}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{step.activity}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* Materials + Assessment + Homework */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-0 bg-violet-50 dark:bg-violet-950/30">
                <CardContent className="p-3">
                  <div className="text-xs font-semibold text-violet-700 mb-1">Материалдар</div>
                  <ul className="text-xs space-y-0.5">
                    {result.materials.map((m, i) => <li key={i}>• {m}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-0 bg-emerald-50 dark:bg-emerald-950/30">
                <CardContent className="p-3">
                  <div className="text-xs font-semibold text-emerald-700 mb-1">Бағалау</div>
                  <p className="text-xs">{result.assessment}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-orange-50 dark:bg-orange-950/30">
                <CardContent className="p-3">
                  <div className="text-xs font-semibold text-orange-700 mb-1">Үй тапсырмасы</div>
                  <p className="text-xs">{result.homework}</p>
                </CardContent>
              </Card>
            </div>
            {result.reflection && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-xs">{result.reflection}</AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── TEST GENERATE TAB ────────────────────────────────────────────────────────

function TestGenerateTab() {
  const [topic, setTopic] = useState("")
  const [count, setCount] = useState("5")
  const [difficulty, setDifficulty] = useState("medium")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [result, setResult] = useState<TestGenerateResult | null>(null)
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true); setError(""); setResult(null); setProgress(5)
    try {
      const r = await runTestGenerate(
        { topic, count: Number(count), difficulty },
        s => { setJobStatus(s); setProgress(s.progress ?? 50) },
      )
      setResult(r); setProgress(100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Қате")
    } finally {
      setLoading(false); setJobStatus(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Тақырып *</label>
          <Input placeholder="мысалы: Теңдеулер" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Сұрақ саны</label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["3", "5", "7", "10"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Қиындық</label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Жеңіл</SelectItem>
              <SelectItem value="medium">Орташа</SelectItem>
              <SelectItem value="hard">Қиын</SelectItem>
              <SelectItem value="mixed">Аралас</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleGenerate} disabled={loading || !topic.trim()}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileQuestion className="mr-2 h-4 w-4" />}
        {loading ? "Жасалып жатыр…" : "Тест жасау"}
      </Button>
      {loading && <JobProgress status={jobStatus} progress={progress} />}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{result.topic} · {result.questions.length} сұрақ</h3>
              <CopyBtn text={result.questions.map((q, i) => `${i + 1}. ${q.question}\n${q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}) ${o}`).join("\n")}\nДұрыс жауап: ${String.fromCharCode(65 + q.correct_index)}`).join("\n\n")} />
            </div>
            <div className="space-y-3">
              {result.questions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{i + 1}. {q.question}</p>
                        <Badge variant="outline" className="shrink-0 capitalize text-[10px]">{q.difficulty}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {q.options.map((opt, j) => (
                          <div
                            key={j}
                            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${j === q.correct_index ? "bg-emerald-50 border border-emerald-300 text-emerald-800" : "bg-muted/40"}`}
                          >
                            <span className="font-bold text-xs">{String.fromCharCode(65 + j)}</span>
                            <span>{opt}</span>
                            {j === q.correct_index && <Check className="ml-auto h-3.5 w-3.5 text-emerald-600" />}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1">{q.explanation}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── IMPROVE TAB ──────────────────────────────────────────────────────────────

function ImproveTab() {
  const [submissionText, setSubmissionText] = useState("")
  const [assignmentName, setAssignmentName] = useState("")
  const [currentFeedback, setCurrentFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [result, setResult] = useState<ImproveResult | null>(null)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!submissionText.trim()) return
    setLoading(true); setError(""); setResult(null); setProgress(5)
    try {
      const r = await runImprove(
        { submissionText, assignmentName, currentFeedback },
        s => { setJobStatus(s); setProgress(s.progress ?? 50) },
      )
      setResult(r); setProgress(100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Қате")
    } finally {
      setLoading(false); setJobStatus(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Тапсырма атауы</label>
          <Input placeholder="мысалы: Экология эссесі" value={assignmentName} onChange={e => setAssignmentName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Бар пікір (міндетті емес)</label>
          <Input placeholder="Жалпы пікіріңіз" value={currentFeedback} onChange={e => setCurrentFeedback(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Студент жұмысы *</label>
        <Textarea
          placeholder="Студенттің жіберген мәтінін осында қойыңыз…"
          className="min-h-[140px] font-mono text-xs"
          value={submissionText}
          onChange={e => setSubmissionText(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground text-right">{submissionText.length} символ</p>
      </div>
      <Button onClick={handleAnalyze} disabled={loading || !submissionText.trim()}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
        {loading ? "Талдануда…" : "AI пікірі"}
      </Button>
      {loading && <JobProgress status={jobStatus} progress={progress} />}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">AI Пікір нәтижесі</h3>
                <Badge>{result.overall_score}/10</Badge>
                <Badge variant="outline" className="capitalize">{result.tone}</Badge>
              </div>
              <CopyBtn text={`Күшті жақтары:\n${result.strengths.join("\n")}\n\nӘлсіз жақтары:\n${result.weaknesses.join("\n")}\n\nҰсыныстар:\n${result.suggestions.join("\n")}`} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-0 bg-emerald-50 dark:bg-emerald-950/30">
                <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-sm text-emerald-700">Күшті жақтары</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3">
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => <li key={i} className="text-sm flex gap-1.5"><span className="text-emerald-500">✓</span>{s}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-0 bg-red-50 dark:bg-red-950/30">
                <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-sm text-red-700">Жетіспейтіні</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3">
                  <ul className="space-y-1">
                    {result.weaknesses.map((w, i) => <li key={i} className="text-sm flex gap-1.5"><span className="text-red-400">✗</span>{w}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-sm">Ұсыныстар</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3">
                <ul className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold h-5 w-5 flex items-center justify-center mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            {result.examples.length > 0 && (
              <Card className="border-0 bg-amber-50 dark:bg-amber-950/30">
                <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-sm text-amber-700">Мысалдар</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3 space-y-1">
                  {result.examples.map((e, i) => <p key={i} className="text-xs italic">{e}</p>)}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Көмекші
          </h1>
          <p className="text-muted-foreground">Сабақ жоспарлау, тест жасау және жұмысты талдау</p>
        </div>

        <Tabs defaultValue="lesson">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="lesson" className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />Сабақ жоспары
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-1.5">
              <FileQuestion className="h-3.5 w-3.5" />Тест
            </TabsTrigger>
            <TabsTrigger value="improve" className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />AI Пікір
            </TabsTrigger>
          </TabsList>

          <Card className="mt-4">
            <CardContent className="pt-5">
              <TabsContent value="lesson" className="mt-0"><LessonPlanTab /></TabsContent>
              <TabsContent value="test" className="mt-0"><TestGenerateTab /></TabsContent>
              <TabsContent value="improve" className="mt-0"><ImproveTab /></TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
