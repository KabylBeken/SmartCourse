package repository

import (
	"context"
	"time"

	"rest-project/internal/db"
	"rest-project/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type LogRepository struct {
	collection *mongo.Collection
}

func NewLogRepository() *LogRepository {
	collection := db.MongoDatabase.Collection("logs")
	
	// Создаем индекс по полю created_at для более быстрого поиска
	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "created_at", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(2592000), // 30 дней TTL
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	_, err := collection.Indexes().CreateOne(ctx, indexModel)
	if err != nil {
		// Логируем ошибку, но продолжаем работу
		// В продакшене лучше обработать более gracefully
		panic(err)
	}
	
	return &LogRepository{
		collection: collection,
	}
}

func (r *LogRepository) CreateLog(log *models.Log) error {
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now()
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	_, err := r.collection.InsertOne(ctx, log)
	return err
}

func (r *LogRepository) FindLogs(filter bson.M, limit int64, skip int64) ([]models.Log, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	opts := options.Find().
		SetLimit(limit).
		SetSkip(skip).
		SetSort(bson.D{{Key: "created_at", Value: -1}})
	
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	
	var logs []models.Log
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, err
	}
	
	return logs, nil
}

// CountLogs подсчитывает количество логов по фильтру
func (r *LogRepository) CountLogs(filter bson.M) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	return r.collection.CountDocuments(ctx, filter)
} 