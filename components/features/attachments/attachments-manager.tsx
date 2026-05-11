"use client"

import { useEffect, useState } from "react"
import { FileIcon, Trash2, ExternalLink, Loader2, Eye, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { FileUploader } from "@/components/features/files/file-uploader"
import {
  listAttachments,
  createAttachment,
  deleteAttachment,
  type Attachment,
  type AttachmentTarget,
} from "@/lib/api/attachments"

const isImage = (ct: string) => ct.startsWith("image/")
const isPDF = (ct: string) => ct === "application/pdf"
const isVideo = (ct: string) => ct.startsWith("video/")
const isAudio = (ct: string) => ct.startsWith("audio/")
const isText = (ct: string) =>
  ct.startsWith("text/") || ct === "application/json" || ct === "application/xml"

interface Props {
  targetType: AttachmentTarget
  targetId?: number | null
  title?: string
}

const formatSize = (b: number) => {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentsManager({ targetType, targetId, title }: Props) {
  const [items, setItems] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Attachment | null>(null)
  const { toast } = useToast()

  const refresh = async () => {
    try {
      setLoading(true)
      const params: { target_type: AttachmentTarget; target_id?: number } = {
        target_type: targetType,
      }
      if (targetId) params.target_id = targetId
      const list = await listAttachments(params)
      setItems(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId])

  const handleDelete = async (id: number) => {
    try {
      await deleteAttachment(id)
      setItems((x) => x.filter((a) => a.id !== id))
      toast({ title: "Файл удалён" })
    } catch (e) {
      toast({
        title: "Ошибка удаления",
        description: e instanceof Error ? e.message : "unknown",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title ?? "Прикреплённые файлы"}</h3>
        <Badge variant="outline">{items.length}</Badge>
      </div>

      <FileUploader
        onUploaded={async (f) => {
          try {
            const attached = await createAttachment({
              target_type: targetType,
              target_id: targetId ?? null,
              object_key: f.key,
              filename: f.filename,
              content_type: f.content_type,
              size_bytes: f.size,
            })
            setItems((x) => [attached, ...x])
          } catch (e) {
            toast({
              title: "Не удалось привязать файл",
              description: e instanceof Error ? e.message : "unknown",
              variant: "destructive",
            })
          }
        }}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка списка…
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Файлов пока нет.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((a) => {
            const previewable = isImage(a.content_type) || isPDF(a.content_type) || isVideo(a.content_type) || isAudio(a.content_type) || isText(a.content_type)
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/40"
              >
                <button
                  type="button"
                  onClick={() => previewable && setPreview(a)}
                  disabled={!previewable}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  title={previewable ? "Посмотреть" : "Просмотр недоступен — скачайте файл"}
                >
                  {isImage(a.content_type) && a.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.url}
                      alt={a.filename}
                      className="h-12 w-12 shrink-0 rounded-lg border bg-muted object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(a.size_bytes)} · {a.content_type}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {previewable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreview(a)}
                      title="Посмотреть"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {a.url && (
                    <Button asChild variant="ghost" size="icon" title="Открыть в новой вкладке">
                      <a href={a.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {a.url && (
                    <Button asChild variant="ghost" size="icon" title="Скачать">
                      <a href={a.url} download={a.filename}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(a.id)}
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Preview модалка */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="!max-w-5xl gap-0 overflow-hidden p-0 sm:!max-w-5xl">
          <DialogHeader className="space-y-1 border-b px-5 py-3 pr-12">
            <DialogTitle className="truncate text-base">
              {preview?.filename}
            </DialogTitle>
            <p className="truncate text-xs text-muted-foreground">
              {preview ? `${formatSize(preview.size_bytes)} · ${preview.content_type}` : ""}
            </p>
          </DialogHeader>
          <div className="relative flex min-h-[60vh] items-center justify-center overflow-auto bg-muted/30 p-2">
            {preview && !preview.url && (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                <FileIcon className="h-12 w-12 opacity-40" />
                <p className="font-medium text-foreground">URL не получен от сервера</p>
                <p className="text-xs">Backend вернул пустой `url`. Перезапустите контейнер: <code>docker-compose up -d --build app</code></p>
              </div>
            )}
            {preview && isImage(preview.content_type) && preview.url && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.filename}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                  onError={(e) => {
                    const t = e.currentTarget
                    t.style.display = "none"
                    const sib = t.nextElementSibling as HTMLElement | null
                    if (sib) sib.style.display = "flex"
                  }}
                />
                <div className="hidden flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                  <FileIcon className="h-12 w-12 opacity-40" />
                  <p className="font-medium text-foreground">Не удалось загрузить превью</p>
                  <p className="break-all text-[10px] font-mono text-muted-foreground">{preview.url}</p>
                  <p className="text-xs">Попробуйте «Открыть в новой вкладке» или «Скачать».</p>
                </div>
              </>
            )}
            {preview && isPDF(preview.content_type) && preview.url && (
              <iframe
                src={preview.url}
                title={preview.filename}
                className="h-[70vh] w-full bg-white"
              />
            )}
            {preview && isVideo(preview.content_type) && preview.url && (
              <video src={preview.url} controls className="max-h-[70vh] w-full" />
            )}
            {preview && isAudio(preview.content_type) && preview.url && (
              <audio src={preview.url} controls className="w-full" />
            )}
            {preview && isText(preview.content_type) && preview.url && (
              <iframe
                src={preview.url}
                title={preview.filename}
                className="h-[70vh] w-full bg-white"
              />
            )}
          </div>
          {preview?.url && (
            <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
              <Button asChild variant="outline" size="sm">
                <a href={preview.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Открыть в новой вкладке
                </a>
              </Button>
              <Button asChild size="sm">
                <a href={preview.url} download={preview.filename}>
                  <Download className="mr-2 h-4 w-4" /> Скачать
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
