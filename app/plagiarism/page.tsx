"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Shield, ScanSearch, AlertTriangle, Users, Loader2, CheckCircle2, ChevronRight } from "lucide-react"
import { getAllCourses, type Course } from "@/lib/api/courses"
import { getTeacherCourseAssignments, type Assignment } from "@/lib/api/assignments"
import {
  runPlagiarismScan, getLatestPlagiarismReport,
  type PlagiarismReport, type PlagiarismPair,
} from "@/lib/api/plagiarism"
import { type JobStatus } from "@/lib/api/jobs"
import { motion } from "framer-motion"

function similarityBadge(score: number) {
  if (score >= 0.85) return <Badge variant="destructive">{(score * 100).toFixed(0)}%</Badge>
  if (score >= 0.70) return <Badge className="bg-orange-500 hover:bg-orange-600">{(score * 100).toFixed(0)}%</Badge>
  return <Badge variant="secondary">{(score * 100).toFixed(0)}%</Badge>
}

function SimilarityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? "bg-red-500" : pct >= 70 ? "bg-orange-400" : "bg-yellow-400"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

function PairDialog({ pair, open, onClose }: { pair: PlagiarismPair | null; open: boolean; onClose: () => void }) {
  if (!pair) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {similarityBadge(pair.similarity)}
            {pair.student_a_name} vs {pair.student_b_name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1.5 text-sm font-semibold text-muted-foreground">{pair.student_a_name}</div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {pair.snippet_a || "Мәтін жоқ"}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-sm font-semibold text-muted-foreground">{pair.student_b_name}</div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {pair.snippet_b || "Мәтін жоқ"}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <SimilarityBar value={pair.similarity} />
          <p className="mt-2 text-xs text-muted-foreground text-center">
            TF-IDF cosine similarity · жоғары = ұқсас мәтін
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function PlagiarismPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedAssignment, setSelectedAssignment] = useState("")

  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState<PlagiarismReport | null>(null)
  const [error, setError] = useState("")

  const [selectedPair, setSelectedPair] = useState<PlagiarismPair | null>(null)

  useEffect(() => {
    getAllCourses().then(setCourses).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCourse) { setAssignments([]); return }
    getTeacherCourseAssignments(Number(selectedCourse)).then(setAssignments).catch(() => {})
    setSelectedAssignment("")
    setReport(null)
  }, [selectedCourse])

  useEffect(() => {
    if (!selectedAssignment) { setReport(null); return }
    // Соңғы есепті жүктеп аламыз (болса)
    getLatestPlagiarismReport(Number(selectedAssignment))
      .then(setReport)
      .catch(() => setReport(null))
  }, [selectedAssignment])

  const handleScan = useCallback(async () => {
    if (!selectedAssignment) return
    setScanning(true)
    setError("")
    setProgress(5)
    try {
      const result = await runPlagiarismScan(
        Number(selectedAssignment),
        (st: JobStatus) => {
          setProgress(st.progress ?? 50)
        },
      )
      setReport(result)
      setProgress(100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Тексеру қатесі")
    } finally {
      setScanning(false)
    }
  }, [selectedAssignment])

  const suspiciousPairs = report?.pairs?.filter(p => p.similarity >= 0.55) ?? []

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Антиплагиат
          </h1>
          <p className="text-muted-foreground">Студенттердің жұмыстарын TF-IDF косинустық ұқсастық арқылы тексеру</p>
        </div>

        {/* Selector + Scan button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 flex-1 min-w-40">
                <label className="text-xs font-medium text-muted-foreground">Курс</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger><SelectValue placeholder="Курс таңдаңыз" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-40">
                <label className="text-xs font-medium text-muted-foreground">Тапсырма</label>
                <Select value={selectedAssignment} onValueChange={setSelectedAssignment} disabled={!selectedCourse}>
                  <SelectTrigger><SelectValue placeholder="Тапсырма таңдаңыз" /></SelectTrigger>
                  <SelectContent>
                    {assignments.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleScan}
                disabled={!selectedAssignment || scanning}
                className="shrink-0"
              >
                {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
                {scanning ? "Тексерілуде…" : "Тексеруді бастау"}
              </Button>
            </div>
            {scanning && (
              <div className="mt-4 space-y-1">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">Submission-дар салыстырылуда… {progress}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Results */}
        {report && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Тексерілген", value: report.doc_count, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Күдікті жұптар", value: suspiciousPairs.length, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Макс. ұқсастық", value: `${(report.max_similarity * 100).toFixed(0)}%`, icon: Shield, color: "text-red-600", bg: "bg-red-50" },
                { label: "Орташа ұқсастық", value: `${(report.avg_similarity * 100).toFixed(0)}%`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((s, i) => (
                <Card key={i} className="p-4">
                  <div className={`inline-flex rounded-lg p-2 ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="mt-2 text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </Card>
              ))}
            </div>

            {/* Pairs list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Күдікті жұптар (ұқсастық ≥ 55%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suspiciousPairs.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Күдікті жұптар табылмады
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suspiciousPairs.map((pair, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedPair(pair)}
                      >
                        <div className="w-7 text-center text-xs font-bold text-muted-foreground">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-sm">
                            <span className="truncate">{pair.student_a_name}</span>
                            <span className="text-muted-foreground shrink-0">vs</span>
                            <span className="truncate">{pair.student_b_name}</span>
                          </div>
                          <div className="mt-1">
                            <SimilarityBar value={pair.similarity} />
                          </div>
                        </div>
                        <div className="shrink-0">{similarityBadge(pair.similarity)}</div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />
            <p className="text-xs text-muted-foreground text-center">
              Тексеру уақыты: {new Date(report.created_at).toLocaleString("ru-RU")} · {report.doc_count} submission
            </p>
          </motion.div>
        )}

        {!report && !scanning && selectedAssignment && (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <ScanSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium">Тексеруді бастауды ұмытпаңыз</p>
            <p className="text-sm text-muted-foreground mt-1">Немесе бұл тапсырма бойынша ертерек тексеру жасалмаған</p>
          </Card>
        )}
      </div>

      <PairDialog pair={selectedPair} open={!!selectedPair} onClose={() => setSelectedPair(null)} />
    </DashboardLayout>
  )
}
