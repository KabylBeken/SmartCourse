# 📋 Жоспар: Essay + Test Тапсырмалар жүйесі

## 🎯 Мақсат
Teacher курсқа 2 түрдегі тапсырма жасайды:
- **Essay** — мәтін жазу, AI критериялар жасайды
- **Test** — сұрақтар + 4 вариант, AI сұрақтар жасайды

---

## 📦 1. BACKEND (Go + PostgreSQL)

### 1.1 Деректер қорындағы өзгерістер

**`assignments` кестесіне жаңа өрістер:**
```sql
ALTER TABLE assignments ADD COLUMN type VARCHAR(10) DEFAULT 'essay'; -- 'essay' | 'test'
ALTER TABLE assignments ADD COLUMN criteria JSONB;       -- Essay критериялары
ALTER TABLE assignments ADD COLUMN questions JSONB;      -- Test сұрақтары
ALTER TABLE assignments ADD COLUMN word_count INT;       -- Test: сұрақ саны
```

**Criteria JSONB (Essay) мысалы:**
```json
[
  { "name": "Аргументация", "maxPoints": 30, "description": "Пікір дәлелдеу" },
  { "name": "Структура",    "maxPoints": 20, "description": "Кіріспе, негізгі бөлім, қорытынды" },
  { "name": "Грамматика",   "maxPoints": 10, "description": "Тіл дұрыстығы" }
]
```

**Questions JSONB (Test) мысалы:**
```json
[
  {
    "id": 1,
    "question": "Қазақстан астанасы қала?",
    "options": ["Алматы", "Астана", "Шымкент", "Атырау"],
    "correctIndex": 1
  }
]
```

---

### 1.2 Go Models

**`internal/models/assignment.go`** — type, criteria, questions өрістері қосылады:
```go
type AssignmentType string
const (
    AssignmentTypeEssay AssignmentType = "essay"
    AssignmentTypeTest  AssignmentType = "test"
)

type EssayCriterion struct {
    Name        string `json:"name"`
    MaxPoints   int    `json:"maxPoints"`
    Description string `json:"description"`
}

type TestQuestion struct {
    ID           int      `json:"id"`
    Question     string   `json:"question"`
    Options      []string `json:"options"`
    CorrectIndex int      `json:"correctIndex"`
}

type Assignment struct {
    gorm.Model
    Title       string
    Description string
    CourseID    uint
    TeacherID   uint
    DueDate     time.Time
    MaxScore    float64
    Type        AssignmentType  // жаңа
    Criteria    datatypes.JSON  // жаңа — Essay үшін
    Questions   datatypes.JSON  // жаңа — Test үшін
    WordCount   int             // жаңа — Test: сұрақ саны
}
```

---

### 1.3 Go API Endpoints

#### Жаңа/өзгертілген endpointтер:

| Method | URL | Роль | Сипаттама |
|--------|-----|------|-----------|
| `POST` | `/api/teacher/courses/:id/assignments` | Teacher | Тапсырма жасау (essay/test) |
| `PUT` | `/api/teacher/assignments/:id` | Teacher | Тапсырманы өңдеу |
| `GET` | `/api/teacher/courses/:id/assignments` | Teacher | Тапсырмалар тізімі (criteria + correctIndex КӨРСЕТІЛЕДІ) |
| `GET` | `/api/student/courses/:id/assignments` | Student | Тапсырмалар тізімі (correctIndex ЖАСЫРЫЛАДЫ) |

#### Жаңа Request body (POST/PUT):
```json
{
  "title": "Философия эссесі",
  "description": "...",
  "due_date": "2026-06-01T23:59:00Z",
  "max_score": 100,
  "type": "essay",
  "criteria": [
    { "name": "Аргументация", "maxPoints": 40, "description": "..." }
  ],
  "word_count": null,
  "questions": null
}
```

```json
{
  "title": "Тарих тесті",
  "type": "test",
  "word_count": 10,
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2
    }
  ]
}
```

---

## 🖥️ 2. FRONTEND (Next.js)

### 2.1 Жаңа компоненттер

```
components/
  assignments/
    CreateAssignmentModal.tsx    — Тапсырма жасау модалы
    EssayForm.tsx                — Essay форма + AI генерация
    TestForm.tsx                 — Test форма + AI генерация
    AssignmentCard.tsx           — Тізімдегі карточка
    EssayCriteriaList.tsx        — Критериялар тізімі
    TestQuestionList.tsx         — Сұрақтар тізімі (teacher: answer көрінеді)
```

---

### 2.2 CreateAssignmentModal — UI Flow

```
[Тапсырма жасау]
        │
    ┌───▼───┐
    │ Тип таңда │
    └───┬───┘
        │
   ┌────┴────┐
   ▼         ▼
[ESSAY]    [TEST]
   │           │
   │ Название  │ Название + Сұрақ саны
   │ жазады    │ жазады
   │           │
   ▼           ▼
[Генерировать с AI]  [Генерировать с AI]
   │                    │
   ▼                    ▼
Критериялар          Сұрақтар + 4 вариант
автоматты            автоматты жасалады
жасалады             (дұрыс жауап белгіленеді)
   │                    │
   ▼                    ▼
Teacher өңдей алады, қосып/өшіре алады
   │
   ▼
[Сақтау]
```

---

### 2.3 AI Generation — `lib/api/ai.ts` жаңа функциялар

**Essay критериялары:**
```typescript
generateEssayCriteria(title: string, description: string)
// → EssayCriterion[]
```

**Test сұрақтары:**
```typescript
generateTestQuestions(title: string, questionCount: number)
// → TestQuestion[] (correctIndex қосылған)
```

---

### 2.4 Teacher vs Student айырмашылығы

| Функция | Teacher | Student |
|---------|---------|---------|
| Тапсырма жасау | ✅ | ❌ |
| Критерияларды көру | ✅ (толық) | ✅ (толық) |
| Дұрыс жауапты көру | ✅ `correctIndex` | ❌ жасырылған |
| AI генерация | ✅ | ❌ |
| Тапсырманы өзгерту | ✅ | ❌ |

---

## 📝 3. ІСКЕ АСЫРУ КЕЗЕКТІЛІГІ

### Кезең 1 — Backend (Go)
1. `assignment.go` моделіне `Type`, `Criteria`, `Questions`, `WordCount` қосу
2. DB migration (ALTER TABLE немесе AutoMigrate)
3. `assignment_handler.go` — create/update request-ке жаңа өрістер
4. `assignment_service.go` — логика (student-та correctIndex жасыру)
5. `assignment_repo.go` — JSONB өрістерімен жұмыс

### Кезең 2 — AI функциялар
6. `lib/api/ai.ts` — `generateEssayCriteria()` функциясы
7. `lib/api/ai.ts` — `generateTestQuestions()` функциясы

### Кезең 3 — Frontend компоненттер
8. `EssayForm.tsx` — criteria форма + AI батырмасы
9. `TestForm.tsx` — questions форма + AI батырмасы
10. `CreateAssignmentModal.tsx` — essay/test switch
11. `AssignmentCard.tsx` — тип белгісімен карточка
12. Teacher беттерін жаңарту
13. Student беттерін жаңарту (correctIndex жоқ)

---

## ⚠️ Маңызды ескертпелер

> [!IMPORTANT]
> **Security:** Student API-да `correctIndex` сервер жағында жасырылуы керек — frontend-та ғана жасыру жеткіліксіз!

> [!NOTE]
> `gorm.io/datatypes` пакеті JSONB үшін қажет — `go get gorm.io/datatypes`

> [!TIP]
> JSONB өрістерін `datatypes.JSON` типімен сақтап, `json.Marshal/Unmarshal` арқылы оқу ең қарапайым тәсіл.
