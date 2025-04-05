package routes

import (
	"github.com/gin-gonic/gin"
	"rest-project/internal/auth"
	"rest-project/internal/db"
	"rest-project/internal/delivery"
	"rest-project/internal/models"
	"rest-project/internal/repository"
	"rest-project/internal/services"
)

func SetupRoutes(r *gin.Engine) {
	// Инициализация репозиториев
	userRepo := repository.NewUserRepository(db.DB)
	courseRepo := repository.NewCourseRepository(db.DB)
	assignmentRepo := repository.NewAssignmentRepository(db.DB)
	gradeRepo := repository.NewGradeRepository(db.DB)
	
	// Инициализация сервисов
	userService := service.NewUserService(userRepo)
	courseService := service.NewCourseService(courseRepo, userRepo)
	assignmentService := service.NewAssignmentService(assignmentRepo, courseRepo, userRepo)
	gradeService := service.NewGradeService(gradeRepo, assignmentRepo, courseRepo, userRepo)
	
	// Инициализация обработчиков
	courseHandler := delivery.NewCourseHandler(courseService)
	
	// Публичные маршруты для аутентификации
	authRoutes := r.Group("/api/v1/auth")
	{
		authRoutes.POST("/login", auth.Login)
		authRoutes.POST("/register", auth.Register)
	}
	
	// Маршруты для администратора
	adminRoutes := r.Group("/api/v1/admin")
	adminRoutes.Use(auth.AuthMiddleware(), auth.RoleMiddleware(models.RoleAdmin))
	{
		// Управление курсами
		adminRoutes.GET("/courses", courseHandler.GetAllCourses)
		adminRoutes.POST("/courses", courseHandler.CreateCourse)
		adminRoutes.PUT("/courses/:id", courseHandler.UpdateCourse)
		adminRoutes.DELETE("/courses/:id", courseHandler.DeleteCourse)
		
		// Управление студентами на курсах
		adminRoutes.POST("/courses/:id/students", courseHandler.AddStudentToCourse)
		adminRoutes.DELETE("/courses/:id/students", courseHandler.RemoveStudentFromCourse)
		
		// Назначение преподавателей на курсы
		adminRoutes.POST("/courses/:id/teacher", courseHandler.AssignTeacherToCourse)
	}
	
	// Маршруты для преподавателей
	teacherRoutes := r.Group("/api/v1/teacher")
	teacherRoutes.Use(auth.AuthMiddleware(), auth.RoleMiddleware(models.RoleTeacher))
	{
		// Получение курсов преподавателя
		teacherRoutes.GET("/courses", courseHandler.GetTeacherCourses)
		
		// Управление заданиями на курсах
		teacherRoutes.GET("/courses/:id/assignments", nil) // Получение заданий курса
		teacherRoutes.POST("/courses/:id/assignments", nil) // Создание нового задания
		teacherRoutes.PUT("/assignments/:id", nil) // Обновление задания
		teacherRoutes.DELETE("/assignments/:id", nil) // Удаление задания
		
		// Управление оценками
		teacherRoutes.GET("/assignments/:id/grades", nil) // Получение оценок по заданию
		teacherRoutes.POST("/assignments/:id/grades", nil) // Выставление оценки студенту
		teacherRoutes.PUT("/grades/:id", nil) // Обновление оценки
		teacherRoutes.DELETE("/grades/:id", nil) // Удаление оценки
	}
	
	// Маршруты для студентов
	studentRoutes := r.Group("/api/v1/student")
	studentRoutes.Use(auth.AuthMiddleware(), auth.RoleMiddleware(models.RoleStudent))
	{
		// Получение курсов студента
		studentRoutes.GET("/courses", courseHandler.GetStudentCourses)
		
		// Просмотр информации о курсе
		studentRoutes.GET("/courses/:id", courseHandler.GetCourseByID)
		
		// Просмотр заданий курса
		studentRoutes.GET("/courses/:id/assignments", nil)
		
		// Просмотр своих оценок
		studentRoutes.GET("/grades", nil) // Получение всех оценок студента
	}
}
