"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  BookOpen,
  Brain,
  GraduationCap,
  Sparkles,
  Search,
  FileText,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Lightbulb,
  Target,
  Users,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { AuthStatus } from "@/components/auth/auth-status"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { isAuthenticated, user } = useAuth()

  const features = [
    {
      icon: Brain,
      title: "AI-промпты",
      description: "Создавайте качественные задания с помощью умных AI-промптов",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      textColor: "text-purple-600",
    },
    {
      icon: Target,
      title: "Умные критерии",
      description: "Определяйте четкие критерии оценки с весами баллов",
      color: "bg-gradient-to-br from-teal-500 to-teal-600",
      textColor: "text-teal-600",
    },
    {
      icon: CheckCircle,
      title: "Авто-оценивание",
      description: "AI-помощник для оценки с возможностью ручной проверки",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      textColor: "text-orange-600",
    },
  ]

  const stats = [
    { label: "Активных курсов", value: "1,200+", icon: BookOpen },
    { label: "Студентов", value: "50,000+", icon: Users },
    { label: "Оценено заданий", value: "2M+", icon: FileText },
    { label: "AI-оценок", value: "500K+", icon: Brain },
  ]

  const dashboardLink = user?.role === "student" ? "/student/dashboard" : "/dashboard"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SmartCourse</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Возможности
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
              Как это работает
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Button asChild variant="outline">
                  <Link href={dashboardLink}>Панель управления</Link>
                </Button>
                <AuthStatus />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Войти</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Регистрация</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20" variant="outline">
              <Sparkles className="mr-1 h-3 w-3" />
              AI-платформа для образования
            </Badge>

            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Трансформируйте образование с{" "}
              <span className="bg-gradient-to-r from-primary via-purple-600 to-teal-600 bg-clip-text text-transparent">
                SmartCourse
              </span>
            </h1>

            <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
              Создавайте интеллектуальные задания, определяйте четкие критерии оценивания и используйте AI для повышения
              эффективности преподавания и улучшения результатов студентов.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isAuthenticated ? (
                <Button asChild size="lg" className="group gap-2">
                  <Link href={dashboardLink}>
                    Перейти к работе
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="group gap-2">
                    <Link href="/register">
                      Начать бесплатно
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent">
                    <Link href="/login">
                      <Lightbulb className="h-4 w-4" />
                      Войти в систему
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-12 max-w-2xl"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск курсов, заданий или ресурсов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 text-base shadow-lg"
              />
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Мощные инструменты для современного образования
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
              Всё необходимое для создания, управления и оценивания заданий с помощью AI
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="group relative overflow-hidden border-2 p-6 transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>

                  <Button variant="link" className={`mt-4 p-0 ${feature.textColor}`}>
                    Подробнее <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <div className="mb-1 text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Как работает SmartCourse
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
              Простой и интеллектуальный процесс создания и оценивания заданий
            </p>
          </motion.div>

          <Tabs defaultValue="teacher" className="mx-auto max-w-4xl">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teacher" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Для преподавателей
              </TabsTrigger>
              <TabsTrigger value="student" className="gap-2">
                <Users className="h-4 w-4" />
                Для студентов
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teacher" className="mt-6 space-y-6">
              {[
                {
                  step: "01",
                  title: "Создайте промпты",
                  description: "Сформируйте библиотеку AI-промптов для быстрой генерации разнообразных заданий",
                  icon: Brain,
                },
                {
                  step: "02",
                  title: "Определите критерии",
                  description: "Установите четкие критерии оценивания с весами и включите AI-проверку",
                  icon: Target,
                },
                {
                  step: "03",
                  title: "Проверяйте и оценивайте",
                  description: "Позвольте AI помочь с оцениванием, затем проверьте и опубликуйте обратную связь",
                  icon: CheckCircle,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="flex gap-6 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="student" className="mt-6 space-y-6">
              {[
                {
                  step: "01",
                  title: "Изучите критерии",
                  description: "Поймите, что именно от вас ожидается, благодаря четким критериям оценивания",
                  icon: FileText,
                },
                {
                  step: "02",
                  title: "Отправьте работу",
                  description: "Загрузите своё задание и получите мгновенную обратную связь от AI",
                  icon: BookOpen,
                },
                {
                  step: "03",
                  title: "Учитесь и улучшайтесь",
                  description: "Изучите детальную обратную связь по каждому критерию для развития навыков",
                  icon: MessageSquare,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="flex gap-6 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xl font-bold text-white">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-purple-600" />
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-teal-500/5 p-12 text-center">
              <div className="relative z-10">
                <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  Готовы трансформировать преподавание?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground">
                  Присоединяйтесь к тысячам преподавателей, использующих SmartCourse для создания лучших заданий и
                  предоставления содержательной обратной связи студентам.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  {isAuthenticated ? (
                    <Button asChild size="lg" className="gap-2">
                      <Link href={dashboardLink}>
                        Перейти к работе
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild size="lg" className="gap-2">
                        <Link href="/register">
                          Начать бесплатно
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                        <Link href="/login">Войти</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">SmartCourse</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SmartCourse. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}
