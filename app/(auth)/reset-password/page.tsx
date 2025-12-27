import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
