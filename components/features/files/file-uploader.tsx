"use client"

import { useRef, useState } from "react"
import { Upload, Loader2, X, FileIcon, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { uploadFile, type UploadedFile } from "@/lib/api/files"
import { useToast } from "@/components/ui/use-toast"

interface FileUploaderProps {
  onUploaded?: (file: UploadedFile) => void
  accept?: string
  className?: string
}

export function FileUploader({ onUploaded, accept, className }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const { toast } = useToast()

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    setBusy(true)
    setProgress(20)
    try {
      const res = await uploadFile(file)
      setProgress(100)
      onUploaded?.(res)
      toast({ title: "Файл загружен", description: file.name })
    } catch (e) {
      toast({
        title: "Ошибка загрузки",
        description: e instanceof Error ? e.message : "unknown",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
      setTimeout(() => setProgress(0), 600)
    }
  }

  return (
    <Card
      className={
        "relative overflow-hidden border-2 border-dashed p-6 transition-colors " +
        (dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20") +
        " " + (className ?? "")
      }
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-2xl bg-primary/10 p-3">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Перетащите файл сюда</p>
          <p className="text-sm text-muted-foreground">или выберите вручную · до 25 МБ</p>
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-1"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка…
            </>
          ) : (
            <>
              <FileIcon className="mr-2 h-4 w-4" /> Выбрать файл
            </>
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {busy && <Progress value={progress} className="mt-2 w-full max-w-xs" />}
      </div>
    </Card>
  )
}

/** Preview-карточка одного загруженного файла. */
export function UploadedFileCard({
  file,
  onDelete,
}: {
  file: UploadedFile
  onDelete?: (key: string) => void
}) {
  const isImage = file.content_type.startsWith("image/")
  const sizeKb = (file.size / 1024).toFixed(1)
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 w-full bg-muted">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt={file.filename} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={() => onDelete(file.key)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{file.filename}</p>
        <p className="text-xs text-muted-foreground">{sizeKb} KB · {file.content_type}</p>
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ImageIcon className="h-3 w-3" /> Открыть
        </a>
      </div>
    </Card>
  )
}
