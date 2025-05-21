package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// MetricType представляет тип метрики
type MetricType string

const (
	MetricTypeCounter   MetricType = "COUNTER"
	MetricTypeGauge     MetricType = "GAUGE"
	MetricTypeHistogram MetricType = "HISTOGRAM"
)

// Metric представляет собой структуру для метрик в MongoDB
type Metric struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	Name        string             `bson:"name"`
	Type        MetricType         `bson:"type"`
	Value       float64            `bson:"value"`
	Labels      map[string]string  `bson:"labels,omitempty"`
	Description string             `bson:"description,omitempty"`
	Timestamp   time.Time          `bson:"timestamp"`
} 