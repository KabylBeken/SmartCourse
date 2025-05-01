# Используем официальный образ Go как базовый образ для сборки
FROM golang:1.23-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы go.mod и go.sum для скачивания зависимостей
COPY go.mod go.sum ./

# Скачиваем зависимости
RUN go mod download

# Копируем исходный код приложения
COPY . .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/smart-course ./cmd/main.go

# Используем минимальный образ для запуска приложения
FROM alpine:latest

# Устанавливаем зависимости для миграций
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Копируем скомпилированное приложение из этапа сборки
COPY --from=builder /app/smart-course .
COPY --from=builder /app/internal/db/migrations /app/internal/db/migrations

# Открываем порт для API
EXPOSE 8080

# Запускаем приложение
CMD ["/app/smart-course"] 