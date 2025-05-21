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

type EventRepository struct {
	collection *mongo.Collection
}

func NewEventRepository() *EventRepository {
	collection := db.MongoDatabase.Collection("events")
	
	// Создаем индексы
	indexModels := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "timestamp", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(7776000), // 90 дней TTL
		},
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "type", Value: 1}},
		},
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	_, err := collection.Indexes().CreateMany(ctx, indexModels)
	if err != nil {
		panic(err)
	}
	
	return &EventRepository{
		collection: collection,
	}
}

func (r *EventRepository) CreateEvent(event *models.Event) error {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	_, err := r.collection.InsertOne(ctx, event)
	return err
}

func (r *EventRepository) FindEvents(filter bson.M, limit int64, skip int64) ([]models.Event, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	opts := options.Find().
		SetLimit(limit).
		SetSkip(skip).
		SetSort(bson.D{{Key: "timestamp", Value: -1}})
	
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	
	var events []models.Event
	if err = cursor.All(ctx, &events); err != nil {
		return nil, err
	}
	
	return events, nil
}

// CountEvents подсчитывает количество событий по фильтру
func (r *EventRepository) CountEvents(filter bson.M) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	return r.collection.CountDocuments(ctx, filter)
}

// GetUserEvents получает события пользователя
func (r *EventRepository) GetUserEvents(userID uint, limit int64, skip int64) ([]models.Event, error) {
	filter := bson.M{"user_id": userID}
	return r.FindEvents(filter, limit, skip)
} 