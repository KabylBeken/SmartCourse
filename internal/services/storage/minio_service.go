package storage

import (
	"context"
	"errors"
	"io"
	"log"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// StorageService — абстракция объектного хранилища (MinIO/S3-совместимое).
type StorageService interface {
	PutObject(ctx context.Context, objectName string, data io.Reader, size int64, contentType string) error
	PresignGet(ctx context.Context, objectName string, expiry time.Duration) (string, error)
	RemoveObject(ctx context.Context, objectName string) error
	GetBucket() string
}

type MinioStorage struct {
	client       *minio.Client // внутренний клиент (для Put/Remove) — внутрисетевой endpoint
	presignCli   *minio.Client // клиент с публичным endpoint для генерации URL, доступных из браузера
	bucket       string
}

// NewMinioStorageFromEnv создаёт клиент из MINIO_* env. Возвращает (nil, nil) если ENV не задан,
// чтобы приложение работало без MinIO (graceful degrade).
//
// Важно: для презайн-ссылок используется отдельный endpoint MINIO_PUBLIC_ENDPOINT
// (например, localhost:9000), чтобы браузер мог открыть ссылку.
// Если MINIO_PUBLIC_ENDPOINT не задан — используется тот же endpoint, что и для внутренних операций.
func NewMinioStorageFromEnv() (*MinioStorage, error) {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	bucket := os.Getenv("MINIO_BUCKET")
	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		log.Println("[storage] MinIO ENV не задан — модуль файлов отключён")
		return nil, nil
	}
	useSSL, _ := strconv.ParseBool(os.Getenv("MINIO_USE_SSL"))

	cli, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, err
	}

	// Публичный клиент: для PresignedGetObject нужен endpoint, доступный браузеру.
	publicEndpoint := os.Getenv("MINIO_PUBLIC_ENDPOINT")
	publicSSL := useSSL
	if v := os.Getenv("MINIO_PUBLIC_USE_SSL"); v != "" {
		publicSSL, _ = strconv.ParseBool(v)
	}
	if publicEndpoint == "" {
		publicEndpoint = endpoint
	}
	presignCli, err := minio.New(publicEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: publicSSL,
	})
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	exists, err := cli.BucketExists(ctx, bucket)
	if err != nil {
		return nil, err
	}
	if !exists {
		if err := cli.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, err
		}
		log.Printf("[storage] bucket %q создан", bucket)
	}
	log.Printf("[storage] MinIO готов: internal=%s public=%s bucket=%s", endpoint, publicEndpoint, bucket)
	return &MinioStorage{client: cli, presignCli: presignCli, bucket: bucket}, nil
}

func (s *MinioStorage) GetBucket() string { return s.bucket }

func (s *MinioStorage) PutObject(ctx context.Context, objectName string, data io.Reader, size int64, contentType string) error {
	if s == nil {
		return errors.New("storage disabled")
	}
	_, err := s.client.PutObject(ctx, s.bucket, objectName, data, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	return err
}

func (s *MinioStorage) PresignGet(ctx context.Context, objectName string, expiry time.Duration) (string, error) {
	if s == nil {
		return "", errors.New("storage disabled")
	}
	cli := s.presignCli
	if cli == nil {
		cli = s.client
	}
	u, err := cli.PresignedGetObject(ctx, s.bucket, objectName, expiry, url.Values{})
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

func (s *MinioStorage) RemoveObject(ctx context.Context, objectName string) error {
	if s == nil {
		return errors.New("storage disabled")
	}
	return s.client.RemoveObject(ctx, s.bucket, objectName, minio.RemoveObjectOptions{})
}
