package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/golang-migrate/migrate/v4"
	migratepg "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

var DB *gorm.DB

func InitDB() {
	// Получаем параметры подключения из переменных окружения или используем значения по умолчанию
	dbHost := getEnv("DB_HOST", "localhost")
	dbName := getEnv("DB_NAME", "smartcourse")
	dbUser := getEnv("DB_USER", "myuser")
	dbPass := getEnv("DB_PASSWORD", "mypassword")
	dbPort := getEnv("DB_PORT", "5432") // Для Docker используем 5432, для локального доступа - 5444
	sslmode := "disable"
	dbUrl := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", dbUser, dbPass, dbHost, dbPort, dbName, sslmode)

	sqlDB, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	driver, err := migratepg.WithInstance(sqlDB, &migratepg.Config{})
	if err != nil {
		log.Fatal(err)
	}

	m, err := migrate.NewWithDatabaseInstance("file://internal/db/migrations", "postgres", driver)
	if err != nil {
		log.Fatal(err)
	}

	// Применяем миграции и игнорируем ошибку, если миграции уже применены
	if err := m.Up(); err != nil && err.Error() != "no change" && err != migrate.ErrNoChange {
		log.Fatal("Ошибка применения миграций:", err)
	}

	gormDB, err := gorm.Open(postgres.New(postgres.Config{
		Conn: sqlDB,
	}), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}
	DB = gormDB
}

// getEnv получает значение из переменной окружения или возвращает значение по умолчанию
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
