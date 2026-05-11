package routes

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/gin-gonic/gin"

	"rest-project/internal/auth"
	"rest-project/internal/db"
	"rest-project/internal/delivery"
	"rest-project/internal/middleware"
	"rest-project/internal/models"
	"rest-project/internal/repository"
	"rest-project/internal/services"
	"rest-project/internal/services/ai"
	"rest-project/internal/services/analytics"
	"rest-project/internal/services/metrics"
	"rest-project/internal/services/schedule"
	"rest-project/internal/services/tutor"
	"rest-project/internal/services/notifier"
	"rest-project/internal/services/plagiarism"
	"rest-project/internal/services/queue"
	"rest-project/internal/services/storage"
	"rest-project/internal/utils"
)

func SetupRoutes(r *gin.Engine) {
	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Middleware для метрик (внутренние логи + Prometheus)
	r.Use(middleware.MetricMiddleware())
	metrics.Register()
	r.Use(metrics.Middleware())
	r.GET("/metrics", metrics.Handler())

	// Инициализация репозиториев PostgreSQL
	userRepo := repository.NewUserRepository(db.DB)
	courseRepo := repository.NewCourseRepository(db.DB)
	assignmentRepo := repository.NewAssignmentRepository(db.DB)
	gradeRepo := repository.NewGradeRepository(db.DB)
	submissionRepo := repository.NewAssignmentSubmissionRepository(db.DB)
	promptRepo := repository.NewPromptRepository(db.DB)

	// Логируем старт приложения
	utils.WriteInfoLog(0, "System", "Приложение Smart Course запущено")

	// Инициализация сервисов
	userService := services.NewUserService(userRepo)
	courseService := services.NewCourseService(courseRepo, userRepo)
	studentService := services.NewStudentService(userRepo)
	assignmentService := services.NewAssignmentService(assignmentRepo, courseRepo, userRepo)
	gradeService := services.NewGradeService(gradeRepo, assignmentRepo, courseRepo, userRepo)
	submissionService := services.NewAssignmentSubmissionService(submissionRepo, assignmentRepo, courseRepo, userRepo, gradeRepo)
	promptService := services.NewPromptService(promptRepo)

	// Инициализация обработчиков
	authHandler := auth.NewAuthHandler(userService)
	courseHandler := delivery.NewCourseHandler(courseService)
	studentHandler := delivery.NewStudentHandler(studentService)
	assignmentHandler := delivery.NewAssignmentHandler(assignmentService)
	gradeHandler := delivery.NewGradeHandler(gradeService)
	submissionHandler := delivery.NewAssignmentSubmissionHandler(submissionService)
	studentCourseHandler := delivery.NewStudentCourseHandler(courseService)
	promptHandler := delivery.NewPromptHandler(promptService)
	dashboardHandler := delivery.NewDashboardHandler()

	// ── Внешние сервисы (graceful degrade при отсутствии ENV) ─────────────
	storageSvc, err := storage.NewMinioStorageFromEnv()
	if err != nil {
		log.Printf("[routes] storage init error: %v", err)
	}
	queueSvc, err := queue.NewFromEnv()
	if err != nil {
		log.Printf("[routes] queue init error: %v", err)
	}
	wsHub := notifier.NewHub()

	// Воркер очереди — пример AI-обработчика (реальная логика подключается позже)
	if queueSvc != nil {
		worker := queue.NewWorker(queueSvc)
		worker.SetNotifier(func(userID uint, st queue.JobStatus) {
			wsHub.SendToUser(userID, "job_status", st)
		})
		worker.Register("echo", func(ctx context.Context, job *queue.Job, progress func(int)) (any, error) {
			progress(50)
			time.Sleep(500 * time.Millisecond)
			var payload map[string]any
			_ = json.Unmarshal(job.Payload, &payload)
			return map[string]any{"echo": payload}, nil
		})

		// Реальный AI-обработчик через OpenRouter (если задан OPENROUTER_API_KEY)
		if aiClient, aiErr := ai.NewOpenRouterFromEnv(); aiErr == nil {
			worker.Register("ai_evaluate", ai.MakeEvaluateHandler(aiClient))
			worker.Register("ai_lesson_plan", ai.MakeLessonPlanHandler(aiClient))
			worker.Register("ai_test_generate", ai.MakeTestGenerateHandler(aiClient))
			worker.Register("ai_improve_suggestion", ai.MakeImproveHandler(aiClient))
			log.Println("[routes] AI handlers зарегистрированы: evaluate, lesson_plan, test_generate, improve")
		} else {
			log.Printf("[routes] ai handlers отключены: %v", aiErr)
		}

		// Plagiarism (TF-IDF) worker
		plagiarismSvc := plagiarism.NewService(db.DB)
		worker.Register("plagiarism_scan", plagiarism.MakeScanHandler(plagiarismSvc))
		log.Println("[routes] plagiarism_scan handler зарегистрирован")

		go worker.Run(context.Background())
	}

	fileHandler := delivery.NewFileHandler(storageSvc)
	jobsHandler := delivery.NewJobsHandler(queueSvc)
	wsHandler := delivery.NewWSHandler(wsHub)
	pdfHandler := delivery.NewPDFHandler()
	attachmentHandler := delivery.NewAttachmentHandler(storageSvc)

	aiAssistantHandler := delivery.NewAIAssistantHandler(queueSvc)
	plagiarismSvcForHandler := plagiarism.NewService(db.DB)
	scheduleSvc := schedule.NewService(db.DB)
	scheduleHandler := delivery.NewScheduleHandler(scheduleSvc)

	// AI Tutor (student)
	tutorClient := ai.NewOpenRouterFromEnvSafe()
	tutorSvc := tutor.NewService(db.DB, tutorClient)
	tutorHandler := delivery.NewTutorHandler(tutorSvc)

	// Student Calendar
	calendarHandler := delivery.NewCalendarHandler(db.DB)
	plagiarismHandler := delivery.NewPlagiarismHandler(plagiarismSvcForHandler, queueSvc)
	analyticsSvc := analytics.NewService(db.DB)
	analyticsHandler := delivery.NewAnalyticsHandler(analyticsSvc)

	// Подключаем WS-нотификации к существующим обработчикам
	submissionHandler.SetHub(wsHub)
	gradeHandler.SetHub(wsHub)

	// WebSocket — без AuthMiddleware (токен идёт в query)
	r.GET("/ws", wsHandler.Connect)

	// Маршруты аутентификации
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
	}

	// API маршруты
	api := r.Group("/api")
	{
		// Маршруты для администратора
		adminRoutes := api.Group("/admin")
		adminRoutes.Use(auth.AuthMiddleware(), auth.RoleMiddleware(string(models.RoleAdmin)))
		{
			adminRoutes.GET("/courses", courseHandler.GetAllCourses)
			adminRoutes.POST("/courses", courseHandler.CreateCourse)
			adminRoutes.PUT("/courses/:id", courseHandler.UpdateCourse)
			adminRoutes.DELETE("/courses/:id", courseHandler.DeleteCourse)
			adminRoutes.POST("/courses/:id/students", courseHandler.AddStudentToCourse)
			adminRoutes.DELETE("/courses/:id/students/:student_id", courseHandler.RemoveStudentFromCourse)
		}

		// Маршруты для преподавателей
		teacherRoutes := api.Group("/teacher")
		teacherRoutes.Use(auth.AuthMiddleware(), auth.RoleMiddleware(string(models.RoleTeacher)))
		{
			teacherRoutes.GET("/dashboard", dashboardHandler.GetDashboard)
			teacherRoutes.GET("/courses", courseHandler.GetTeacherCourses)
			teacherRoutes.POST("/courses", courseHandler.CreateCourse)
			teacherRoutes.GET("/courses/:id", courseHandler.GetTeacherCourseByID)
			teacherRoutes.PUT("/courses/:id", courseHandler.UpdateCourse)
			teacherRoutes.DELETE("/courses/:id", courseHandler.DeleteCourse)
			teacherRoutes.POST("/courses/:id/students", courseHandler.AddStudentToCourse)
			teacherRoutes.DELETE("/courses/:id/students/:student_id", courseHandler.RemoveStudentFromCourse)
			teacherRoutes.GET("/courses/:id/assignments", assignmentHandler.GetCourseAssignments)
			teacherRoutes.POST("/courses/:id/assignments", assignmentHandler.CreateAssignment)
			teacherRoutes.GET("/assignments/:id", assignmentHandler.GetAssignment)
			teacherRoutes.PUT("/assignments/:id", assignmentHandler.UpdateAssignment)
			teacherRoutes.PUT("/assignments/:id/criteria", assignmentHandler.UpdateAssignmentCriteria)
			teacherRoutes.DELETE("/assignments/:id", assignmentHandler.DeleteAssignment)
			teacherRoutes.GET("/assignments/:id/grades", gradeHandler.GetAssignmentGrades)
			teacherRoutes.POST("/assignments/:id/grades", gradeHandler.CreateGrade)
			teacherRoutes.PUT("/grades/:id", gradeHandler.UpdateGrade)
			teacherRoutes.DELETE("/grades/:id", gradeHandler.DeleteGrade)

			// Prompt library (teacher-owned)
			teacherRoutes.GET("/prompts", promptHandler.List)
			teacherRoutes.POST("/prompts", promptHandler.Create)
			teacherRoutes.PUT("/prompts/:id", promptHandler.Update)
			teacherRoutes.DELETE("/prompts/:id", promptHandler.Delete)
			teacherRoutes.POST("/prompts/:id/clone", promptHandler.Clone)
			teacherRoutes.POST("/prompts/:id/favorite", promptHandler.ToggleFavorite)
			teacherRoutes.GET("/prompts/:id/versions", promptHandler.Versions)
			teacherRoutes.POST("/prompts/:id/revert/:version", promptHandler.Revert)
			teacherRoutes.POST("/prompts/import", promptHandler.Import)
			teacherRoutes.GET("/prompts/export", promptHandler.Export)

			// Файлы (MinIO)
			teacherRoutes.POST("/files/upload", fileHandler.Upload)
			teacherRoutes.GET("/files/:key/presign", fileHandler.Presign)
			teacherRoutes.DELETE("/files/:key", fileHandler.Delete)

			// Async задачи (Redis queue)
			teacherRoutes.POST("/jobs", jobsHandler.Enqueue)
			teacherRoutes.GET("/jobs/:id", jobsHandler.Status)

			// PDF отчёт по курсу
			teacherRoutes.GET("/courses/:id/report.pdf", pdfHandler.CourseReport)

			// Attachments (метаданные файлов, привязка к assignment/submission/course)
			teacherRoutes.GET("/attachments", attachmentHandler.List)
			teacherRoutes.POST("/attachments", attachmentHandler.Create)
			teacherRoutes.DELETE("/attachments/:id", attachmentHandler.Delete)

			// AI-Ассистент (lesson plan / test generator / submission improve)
			teacherRoutes.POST("/ai/lesson-plan", aiAssistantHandler.LessonPlan)
			teacherRoutes.POST("/ai/test-generate", aiAssistantHandler.TestGenerate)
			teacherRoutes.POST("/ai/improve", aiAssistantHandler.Improve)

			// Антиплагиат (TF-IDF)
			teacherRoutes.POST("/assignments/:id/plagiarism/scan", plagiarismHandler.StartScan)
			teacherRoutes.GET("/assignments/:id/plagiarism", plagiarismHandler.LatestReport)

			// Аналитика
			teacherRoutes.GET("/analytics/overview", analyticsHandler.Overview)
			teacherRoutes.GET("/analytics/grades-over-time", analyticsHandler.GradesOverTime)
			teacherRoutes.GET("/analytics/heatmap", analyticsHandler.Heatmap)
			teacherRoutes.GET("/analytics/at-risk", analyticsHandler.AtRisk)

			// Сабақ кестесі (Calendar)
			teacherRoutes.GET("/schedule", scheduleHandler.List)
			teacherRoutes.POST("/schedule", scheduleHandler.Create)
			teacherRoutes.PUT("/schedule/:id", scheduleHandler.Update)
			teacherRoutes.DELETE("/schedule/:id", scheduleHandler.Delete)
			teacherRoutes.POST("/schedule/sync", scheduleHandler.SyncDeadlines)
		}

		// Маршруты для студентов
		studentRoutes := api.Group("/student")
		studentRoutes.Use(auth.AuthMiddleware(), auth.RoleMiddleware(string(models.RoleStudent)))
		{
			studentRoutes.GET("/courses", studentCourseHandler.GetStudentCourses)
			studentRoutes.GET("/courses/:id", courseHandler.GetCourseByID)
			studentRoutes.GET("/courses/:id/assignments", assignmentHandler.GetCourseAssignmentsForStudent)
			studentRoutes.GET("/assignments/:id", assignmentHandler.GetAssignmentForStudent)
			studentRoutes.GET("/assignments/:id/submission", submissionHandler.GetStudentSubmission)
			studentRoutes.PUT("/assignments/:id/submission/draft", submissionHandler.SaveDraft)
			studentRoutes.POST("/assignments/:id/submission/submit", submissionHandler.Submit)
			studentRoutes.GET("/grades", gradeHandler.GetStudentGrades)

			// AI Репетитор (тапсырма бойынша чат)
			studentRoutes.GET("/assignments/:id/tutor", tutorHandler.GetSession)
			studentRoutes.POST("/assignments/:id/tutor/stream", tutorHandler.Stream)
			studentRoutes.DELETE("/assignments/:id/tutor", tutorHandler.ClearHistory)

			// Студент кестесі (deadline calendar)
			studentRoutes.GET("/calendar", calendarHandler.GetStudentCalendar)
		}

		// Общие маршруты prompts (листинг, просмотр и использование)
		promptsGroup := api.Group("/prompts")
		promptsGroup.Use(auth.AuthMiddleware())
		{
			promptsGroup.GET("", promptHandler.List)
			promptsGroup.GET(":id", promptHandler.Get)
			promptsGroup.POST(":id/use", promptHandler.Use)
		}

		// Курсы (для обратной совместимости)
		courseGroup := api.Group("/courses")
		courseGroup.Use(auth.AuthMiddleware())
		{
			courseGroup.GET("", courseHandler.GetAllCourses)
			courseGroup.GET("/:id", courseHandler.GetCourseByID)
			courseGroup.POST("", courseHandler.CreateCourse)
			courseGroup.PUT("/:id", courseHandler.UpdateCourse)
			courseGroup.DELETE("/:id", courseHandler.DeleteCourse)
			courseGroup.POST("/:id/students", courseHandler.AddStudentToCourse)
			courseGroup.DELETE("/:id/students/:student_id", courseHandler.RemoveStudentFromCourse)
		}

		// Студенты (для обратной совместимости)
		studentGroup := api.Group("/students")
		studentGroup.Use(auth.AuthMiddleware())
		{
			studentGroup.GET("", studentHandler.GetAllStudents)
			studentGroup.GET("/:id", studentHandler.GetStudent)
			studentGroup.POST("", studentHandler.CreateStudent)
			studentGroup.PUT("/:id", studentHandler.UpdateStudent)
			studentGroup.DELETE("/:id", studentHandler.DeleteStudent)
		}
	}
}
