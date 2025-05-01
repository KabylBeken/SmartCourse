# - фреймворка Gin!
Разработка приложения для регистрации на курсы с использованием  ​GORM+(Gin)+PostgreSQL
SmartCourse – система управления курсами
Описание:
Мобильное приложение с REST API, использующее GORM и PostgreSQL для регистрации студентов на курсы. В системе три роли: Admin, Teacher, Student, каждая из которых имеет чётко определённые возможности.

upd all dependencies:

go mod init rest-project
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/golang-jwt/jwt/v5
go get github.com/golang-migrate/migrate/v4
go get github.com/golang-migrate/migrate/v4/database/postgres
go get github.com/golang-migrate/migrate/v4/source/file

# REST API

REST API (**Representational State Transfer API**) — это **архитектурный стиль** взаимодействия клиента и сервера через
HTTP, в котором данные передаются в виде ресурсов, а операции над ними выполняются стандартными методами HTTP (**GET,
POST, PUT, PATCH, DELETE**).

# Gin легковесный фреймворк для создания api

**1. Что такое Gin и зачем он нужен?**

Gin — это легковесный и высокопроизводительный HTTP-фреймворк на Go, созданный для удобной разработки веб-приложений и
API.

**Преимущества Gin:**

- Высокая скорость (использует net/http и эффективную маршрутизацию)
- Удобный API и middleware
- Автоматическая обработка JSON

---
✅ Маршруттар жұмыс істеп тұр:
🔐 /api/v1/auth/login және /register – аутентификация маршруттары.

🎓 /api/v1/admin/courses – курстарды басқару.

👨‍🏫 /api/v1/teacher/... – мұғалімдерге арналған маршруттар.

👨‍🎓 /api/v1/student/... – студенттерге арналған маршруттар.

**2. Установка и первый запуск**

**Установка Gin**
Перед началом работы необходимо установить Gin с помощью go get:

```sh
go get -u github.com/gin-gonic/gin
```

# Smart Course

Учебная платформа для регистрации студентов на курсы.

## Возможности

- Реализация ролей: Admin, Teacher, Student
- Управление курсами
- Управление заданиями
- Оценивание студентов
- Аутентификация с использованием JWT

## Требования

### Локальный запуск
- Go 1.23+
- PostgreSQL

### Docker
- Docker
- Docker Compose

## Запуск приложения

### С использованием Docker

Самый простой способ запустить приложение:

```bash
# Запуск всего приложения (база данных и API)
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка приложения
docker-compose down
```

### Локальный запуск

```bash
# Запуск только PostgreSQL в Docker
docker-compose up -d postgres

# Запуск API локально
go run cmd/main.go
```

## API Endpoints

### Аутентификация

- `POST /api/v1/auth/register` - Регистрация пользователя
- `POST /api/v1/auth/login` - Вход в систему

### Администратор

- `GET /api/v1/admin/courses` - Получение всех курсов
- `POST /api/v1/admin/courses` - Создание курса
- `PUT /api/v1/admin/courses/:id` - Обновление курса
- `DELETE /api/v1/admin/courses/:id` - Удаление курса
- `POST /api/v1/admin/courses/:id/students` - Добавление студента на курс
- `DELETE /api/v1/admin/courses/:id/students` - Удаление студента с курса
- `POST /api/v1/admin/courses/:id/teacher` - Назначение преподавателя на курс

### Преподаватель

- `GET /api/v1/teacher/courses/all` - Получение всех курсов
- `GET /api/v1/teacher/courses` - Получение курсов преподавателя
- Управление заданиями и оценками

### Студент

- `GET /api/v1/student/courses/all` - Получение всех курсов
- `GET /api/v1/student/courses/mine` - Получение курсов студента
- `GET /api/v1/student/courses/:id` - Получение информации о курсе
- `GET /api/v1/student/grades` - Получение оценок студента


