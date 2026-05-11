"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { AttachmentsManager } from "@/components/features/attachments/attachments-manager"
import { FolderOpen } from "lucide-react"

export default function FilesPage() {
  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <FolderOpen className="h-7 w-7 text-primary" /> Файлы
          </h1>
          <p className="text-muted-foreground">
            Объектное хранилище MinIO + индекс в Postgres. Файлы сохраняются между сессиями.
          </p>
        </div>

        <AttachmentsManager targetType="free" title="Моя библиотека файлов" />
      </div>
    </DashboardLayout>
  )
}
