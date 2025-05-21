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

type MetricRepository struct {
	collection *mongo.Collection
}

func NewMetricRepository() *MetricRepository {
	collection := db.MongoDatabase.Collection("metrics")
	
	// Создаем индексы
	indexModels := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "timestamp", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(2592000), // 30 дней TTL
		},
		{
			Keys: bson.D{{Key: "name", Value: 1}},
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
	
	return &MetricRepository{
		collection: collection,
	}
}

func (r *MetricRepository) CreateMetric(metric *models.Metric) error {
	if metric.Timestamp.IsZero() {
		metric.Timestamp = time.Now()
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	_, err := r.collection.InsertOne(ctx, metric)
	return err
}

func (r *MetricRepository) FindMetrics(filter bson.M, limit int64, skip int64) ([]models.Metric, error) {
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
	
	var metrics []models.Metric
	if err = cursor.All(ctx, &metrics); err != nil {
		return nil, err
	}
	
	return metrics, nil
}

// IncrementCounter увеличивает значение счетчика
func (r *MetricRepository) IncrementCounter(name string, labels map[string]string, value float64) error {
	now := time.Now()
	
	metric := models.Metric{
		Name:      name,
		Type:      models.MetricTypeCounter,
		Value:     value,
		Labels:    labels,
		Timestamp: now,
	}
	
	return r.CreateMetric(&metric)
}

// SetGauge устанавливает значение для gauge метрики
func (r *MetricRepository) SetGauge(name string, labels map[string]string, value float64) error {
	now := time.Now()
	
	metric := models.Metric{
		Name:      name,
		Type:      models.MetricTypeGauge,
		Value:     value,
		Labels:    labels,
		Timestamp: now,
	}
	
	return r.CreateMetric(&metric)
}

// GetLatestMetric получает последнее значение метрики по имени
func (r *MetricRepository) GetLatestMetric(name string) (*models.Metric, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	filter := bson.M{"name": name}
	opts := options.FindOne().SetSort(bson.D{{Key: "timestamp", Value: -1}})
	
	var metric models.Metric
	err := r.collection.FindOne(ctx, filter, opts).Decode(&metric)
	if err != nil {
		return nil, err
	}
	
	return &metric, nil
}

// CountMetrics подсчитывает количество метрик по фильтру
func (r *MetricRepository) CountMetrics(filter bson.M) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	return r.collection.CountDocuments(ctx, filter)
} 