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

**2. Установка и первый запуск**

**Установка Gin**
Перед началом работы необходимо установить Gin с помощью go get:

```sh

go get -u github.com/gin-gonic/gin

