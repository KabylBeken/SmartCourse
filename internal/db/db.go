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
	dbHost := getEnv("DB_HOST", "localhost")
	dbName := getEnv("DB_NAME", "smartcourse")
	dbUser := getEnv("DB_USER", "myuser")
	dbPass := getEnv("DB_PASSWORD", "mypassword")
	dbPort := getEnv("DB_PORT", "5444")
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

	//if err := m.Down(); err != nil && err.Error() != "no change" && err != migrate.ErrNoChange {
	//	log.Println("Ошибка сброса миграций:", err)
	//}

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

// getEnv получает значение переменной окружения с возможностью задать значение по умолчанию
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
