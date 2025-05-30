package routes

import (
	"github.com/gin-gonic/gin"

	"rest-project/internal/auth"
	"rest-project/internal/db"
	"rest-project/internal/delivery"
	"rest-project/internal/middleware"
	"rest-project/internal/models"
	"rest-project/internal/repository"
	"rest-project/internal/services"
	"rest-project/internal/utils"
)

func SetupRoutes(r *gin.Engine) {
	// Middleware для CORS - разрешаем только запросы с http://localhost:5173
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true") // Для передачи cookie
		
		// Обрабатываем preflight запросы
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Добавляем middleware для метрик
	r.Use(middleware.MetricMiddleware())

	// Инициализация репозиториев PostgreSQL
	userRepo := repository.NewUserRepository(db.DB)
	courseRepo := repository.NewCourseRepository(db.DB)
	studentRepo := repository.NewStudentRepository(db.DB)
	assignmentRepo := repository.NewAssignmentRepository(db.DB)
	gradeRepo := repository.NewGradeRepository(db.DB)

	// Инициализация MongoDB
	db.InitMongoDB()

	// Логируем старт приложения
	utils.WriteInfoLog(0, "System", "Приложение Smart Course запущено")

	// Инициализация репозиториев MongoDB и сервисов, если MongoDB доступна
	var loggerService *services.LoggerService
	var eventService *services.EventService 
	var metricService *services.MetricService
	var logHandler *delivery.LogHandler
	var eventHandler *delivery.EventHandler
	var metricHandler *delivery.MetricHandler

	if db.MongoDatabase != nil {
		logRepo := repository.NewLogRepository()
		eventRepo := repository.NewEventRepository()
		metricRepo := repository.NewMetricRepository()
		
		// Инициализация сервисов MongoDB
		loggerService = services.NewLoggerService(logRepo)
		eventService = services.NewEventService(eventRepo)
		metricService = services.NewMetricService(metricRepo)
		
		// MongoDB обработчики
		logHandler = delivery.NewLogHandler(loggerService) 
		eventHandler = delivery.NewEventHandler(eventService)
		metricHandler = delivery.NewMetricHandler(metricService)
	}

	// Инициализация сервисов
	userService := services.NewUserService(userRepo)
	courseService := services.NewCourseService(courseRepo, userRepo)
	studentService := services.NewStudentService(studentRepo)
	// Инициализация сервисов
	assignmentService := services.NewAssignmentService(assignmentRepo, courseRepo, userRepo)
	gradeService := services.NewGradeService(gradeRepo, assignmentRepo, courseRepo, userRepo)
	
	// Инициализация обработчиков
	authHandler := auth.NewAuthHandler(userService, eventService)
	courseHandler := delivery.NewCourseHandler(courseService, eventService)
	studentHandler := delivery.NewStudentHandler(studentService)
	assignmentHandler := delivery.NewAssignmentHandler(assignmentService, eventService)
	gradeHandler := delivery.NewGradeHandler(gradeService, eventService)
	studentCourseHandler := delivery.NewStudentCourseHandler(courseService, eventService)

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
			// Управление курсами
			adminRoutes.GET("/courses", courseHandler.GetAllCourses)
			adminRoutes.POST("/courses", courseHandler.CreateCourse)
			adminRoutes.PUT("/courses/:id", courseHandler.UpdateCourse)
			adminRoutes.DELETE("/courses/:id", courseHandler.DeleteCourse)
			
			// Управление студентами на курсах
			adminRoutes.POST("/courses/:id/students", courseHandler.AddStudentToCourse)
			adminRoutes.DELETE("/courses/:id/students/:student_id", courseHandler.RemoveStudentFromCourse)
			
			// MongoDB маршруты для администратора
			if db.MongoDatabase != nil {
				// Маршруты для логов
				adminRoutes.GET("/logs", logHandler.GetLogs)
				
				// Маршруты для событий
				adminRoutes.GET("/events", eventHandler.GetEvents)
				adminRoutes.GET("/users/:user_id/events", eventHandler.GetUserEvents)
				
				// Маршруты для метрик
				adminRoutes.GET("/metrics", metricHandler.GetMetrics)
			}
		}
		
		// Маршруты для преподавателей
		teacherRoutes := api.Group("/teacher")
		teacherRoutes.Use(auth.AuthMiddleware(), auth.RoleMiddleware(string(models.RoleTeacher)))
		{
			// Получение курсов преподавателя
			teacherRoutes.GET("/courses", courseHandler.GetAllCourses) // Нужно реализовать GetTeacherCourses
			
			// Управление заданиями на курсах
			teacherRoutes.GET("/courses/:id/assignments", assignmentHandler.GetCourseAssignments)
			teacherRoutes.POST("/courses/:id/assignments", assignmentHandler.CreateAssignment)
			teacherRoutes.PUT("/assignments/:id", assignmentHandler.UpdateAssignment)
			teacherRoutes.DELETE("/assignments/:id", assignmentHandler.DeleteAssignment)
			
			// Управление оценками
			teacherRoutes.GET("/assignments/:id/grades", gradeHandler.GetAssignmentGrades)
			teacherRoutes.POST("/assignments/:id/grades", gradeHandler.CreateGrade)
			teacherRoutes.PUT("/grades/:id", gradeHandler.UpdateGrade)
			teacherRoutes.DELETE("/grades/:id", gradeHandler.DeleteGrade)
		}
		
		// Маршруты для студентов
		studentRoutes := api.Group("/student")
		studentRoutes.Use(auth.AuthMiddleware(), auth.RoleMiddleware(string(models.RoleStudent)))
		{
			// Получение курсов студента
			studentRoutes.GET("/courses", studentCourseHandler.GetStudentCourses)
			
			// Просмотр информации о курсе
			studentRoutes.GET("/courses/:id", courseHandler.GetCourseByID)
			
			// Просмотр заданий курса
			studentRoutes.GET("/courses/:id/assignments", assignmentHandler.GetCourseAssignments)
			
			// Просмотр своих оценок
			studentRoutes.GET("/grades", gradeHandler.GetStudentGrades)
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