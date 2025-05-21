FROM golang:1.23-alpine AS builder

WORKDIR /app


COPY go.mod go.sum ./
RUN go mod download


COPY . .


RUN CGO_ENABLED=0 GOOS=linux go build -o smart-course ./cmd/main.go

# образ
FROM alpine:3.19

WORKDIR /app

# Устанавливаем необходимые пакеты
RUN apk add --no-cache curl 

COPY --from=builder /app/smart-course .
# Копируем миграции
COPY --from=builder /app/internal/db/migrations ./internal/db/migrations

# Настраиваем healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENV GIN_MODE=release
ENV PORT=8080

EXPOSE 8080

CMD ["./smart-course"]