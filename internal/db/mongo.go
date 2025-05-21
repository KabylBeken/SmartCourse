package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoDB *mongo.Client
var MongoDatabase *mongo.Database

// InitMongoDB инициализирует подключение к MongoDB Atlas
func InitMongoDB() {
	uri := getEnv("MONGO_URI", "mongodb://localhost:27017/smartcourse")
	dbName := getEnv("MONGO_DB_NAME", "smartcourse")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Printf("Ошибка подключения к MongoDB: %v", err)
		return
	}

	// Проверка подключения
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Printf("Ошибка проверки подключения к MongoDB: %v", err)
		return
	}

	log.Println("Успешное подключение к MongoDB Atlas")
	
	MongoDB = client
	MongoDatabase = client.Database(dbName)
} 