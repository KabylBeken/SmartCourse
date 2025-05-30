package main

import (
	"github.com/gin-gonic/gin"
	"rest-project/internal/db"
	"rest-project/internal/routes"
)

func main() {
	// Переключение в production режим
	gin.SetMode(gin.ReleaseMode)

	// Инициализация PostgreSQL
	db.InitDB()

	// Инициализация MongoDB будет выполнена в routes.SetupRoutes

	r := gin.Default()
	routes.SetupRoutes(r)
	r.Run(":8080")
}
