"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Brain,
  Sparkles,
  Target,
  FileCheck,
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  BookOpen,
  GraduationCap,
  MessageSquare,
  FolderOpen,
  Shield,
  BarChart3,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { NotificationBell } from "@/components/features/notifications/notification-bell"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { AuthStatus } from "@/components/auth/auth-status"
import { AuthGuard } from "@/components/auth/auth-guard"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: "teacher" | "student"
}

const teacherNavItems = [
  { href: "/dashboard", label: "Панель управления", icon: LayoutDashboard },
  { href: "/prompts", label: "Библиотека промптов", icon: Brain },
  { href: "/courses", label: "Курсы", icon: FolderOpen },
  { href: "/assignments", label: "Задания", icon: BookOpen },
  { href: "/criteria", label: "Критерии оценки", icon: Target },
  { href: "/evaluations", label: "Оценивание", icon: FileCheck },
  { href: "/files", label: "Файлы", icon: FolderOpen },
  { href: "/ai-demo", label: "AI оценивание", icon: Sparkles },
  { href: "/ai-assistant", label: "AI Көмекші", icon: Brain },
  { href: "/plagiarism", label: "Антиплагиат", icon: Shield },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/schedule", label: "Кесте", icon: CalendarDays },
  { href: "/students", label: "Студенты", icon: Users },
  { href: "/settings", label: "Настройки", icon: Settings },
]

const studentNavItems = [
  { href: "/student/dashboard", label: "Панель управления", icon: LayoutDashboard },
  { href: "/student/assignments", label: "Мои задания", icon: BookOpen },
  { href: "/student/calendar", label: "Кесте / Дедлайндар", icon: CalendarDays },
  { href: "/student/criteria", label: "Критерии", icon: Target },
  { href: "/student/feedback", label: "Обратная связь", icon: MessageSquare },
  { href: "/settings", label: "Настройки", icon: Settings },
]

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  const role = (userRole || user?.role || "teacher") as "teacher" | "student"
  const navItems = role === "teacher" ? teacherNavItems : studentNavItems

  const NavContent = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <AuthGuard requiredRole={role}>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-card lg:block">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">SmartCourse</span>
          </div>
          <div className="flex h-[calc(100vh-4rem)] flex-col justify-between p-4">
            <NavContent />
            <div className="border-t pt-4">
              <AuthStatus />
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">SmartCourse</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <AuthStatus />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="mb-6 flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <span className="text-lg font-bold">SmartCourse</span>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Floating Notification Bell (desktop) */}
        <div className="fixed right-4 top-4 z-30 hidden lg:block">
          <NotificationBell />
        </div>

        {/* Main Content */}
        <main className="min-h-screen pt-16 lg:pl-64 lg:pt-0">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
