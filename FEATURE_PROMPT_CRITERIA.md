# Функциональность: Система Промптов и Критериев Оценки

## Обзор
Добавление системы работы с AI-промптами для генерации заданий и критериев автоматической/полуавтоматической оценки работ студентов.

---

## 1. Backend (Go API)

### 1.1 Модели данных

\`\`\`go
// internal/models/prompt.go
type Prompt struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    Title       string    `json:"title" gorm:"not null"`
    Description string    `json:"description"`
    PromptText  string    `json:"prompt_text" gorm:"type:text;not null"`
    Category    string    `json:"category"` // "assignment", "quiz", "essay"
    TeacherID   uint      `json:"teacher_id" gorm:"not null"`
    IsPublic    bool      `json:"is_public" gorm:"default:false"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type GradingCriteria struct {
    ID              uint      `json:"id" gorm:"primaryKey"`
    AssignmentID    uint      `json:"assignment_id" gorm:"not null"`
    Name            string    `json:"name" gorm:"not null"`
    Description     string    `json:"description" gorm:"type:text"`
    MaxScore        int       `json:"max_score" gorm:"not null"`
    Weight          float64   `json:"weight" gorm:"default:1.0"` // Вес критерия
    AutoCheckable   bool      `json:"auto_checkable" gorm:"default:false"`
    CheckPrompt     string    `json:"check_prompt" gorm:"type:text"` // Промпт для AI проверки
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}

type SubmissionEvaluation struct {
    ID              uint      `json:"id" gorm:"primaryKey"`
    SubmissionID    uint      `json:"submission_id" gorm:"not null"`
    CriteriaID      uint      `json:"criteria_id" gorm:"not null"`
    Score           int       `json:"score" gorm:"not null"`
    AutoScore       int       `json:"auto_score"` // Оценка от AI
    ManualScore     int       `json:"manual_score"` // Ручная оценка преподавателя
    Feedback        string    `json:"feedback" gorm:"type:text"`
    AIFeedback      string    `json:"ai_feedback" gorm:"type:text"`
    IsAutomatic     bool      `json:"is_automatic" gorm:"default:false"`
    ReviewedByID    uint      `json:"reviewed_by_id"` // ID преподавателя
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}
\`\`\`

### 1.2 API Endpoints

#### Промпты
\`\`\`
GET    /api/teacher/prompts                  - Получить все промпты преподавателя
GET    /api/teacher/prompts/:id              - Получить промпт по ID
POST   /api/teacher/prompts                  - Создать новый промпт
PUT    /api/teacher/prompts/:id              - Обновить промпт
DELETE /api/teacher/prompts/:id              - Удалить промпт
POST   /api/teacher/prompts/:id/generate     - Сгенерировать задание из промпта
GET    /api/teacher/prompts/public           - Получить публичные промпты
\`\`\`

#### Критерии оценки
\`\`\`
GET    /api/teacher/assignments/:id/criteria           - Получить критерии задания
POST   /api/teacher/assignments/:id/criteria           - Создать критерий
PUT    /api/teacher/criteria/:id                       - Обновить критерий
DELETE /api/teacher/criteria/:id                       - Удалить критерий
POST   /api/teacher/criteria/:id/test                  - Протестировать AI проверку
\`\`\`

#### Оценка работ
\`\`\`
GET    /api/teacher/submissions/:id/evaluations        - Получить оценки по критериям
POST   /api/teacher/submissions/:id/auto-evaluate      - Автоматическая оценка AI
POST   /api/teacher/submissions/:id/evaluate           - Ручная оценка по критериям
PUT    /api/teacher/evaluations/:id                    - Обновить оценку по критерию
\`\`\`

#### Студенты
\`\`\`
GET    /api/student/assignments/:id/criteria           - Просмотр критериев задания
GET    /api/student/submissions/:id/evaluation         - Просмотр своей оценки с фидбеком
\`\`\`

### 1.3 Сервисы

\`\`\`go
// internal/services/prompt_service.go
type PromptService struct {
    promptRepo      PromptRepository
    assignmentRepo  AssignmentRepository
}

func (s *PromptService) CreatePrompt(prompt *Prompt) error
func (s *PromptService) GetTeacherPrompts(teacherID uint) ([]Prompt, error)
func (s *PromptService) GenerateAssignment(promptID uint, params map[string]interface{}) (*Assignment, error)
\`\`\`

\`\`\`go
// internal/services/criteria_service.go
type CriteriaService struct {
    criteriaRepo    CriteriaRepository
    assignmentRepo  AssignmentRepository
}

func (s *CriteriaService) CreateCriteria(criteria *GradingCriteria) error
func (s *CriteriaService) GetAssignmentCriteria(assignmentID uint) ([]GradingCriteria, error)
func (s *CriteriaService) ValidateCriteria(criteria *GradingCriteria) error
\`\`\`

\`\`\`go
// internal/services/evaluation_service.go
type EvaluationService struct {
    evaluationRepo  EvaluationRepository
    criteriaRepo    CriteriaRepository
    aiService       *AIService // Интеграция с AI API
}

func (s *EvaluationService) AutoEvaluateSubmission(submissionID uint) error
func (s *EvaluationService) ManualEvaluate(evaluation *SubmissionEvaluation) error
func (s *EvaluationService) GetSubmissionEvaluations(submissionID uint) ([]SubmissionEvaluation, error)
func (s *EvaluationService) CalculateFinalGrade(submissionID uint) (float64, error)
\`\`\`

---

## 2. Frontend (React + shadcn/ui)

### 2.1 Новые компоненты UI

#### Библиотека промптов
\`\`\`typescript
// src/pages/teacher/prompts/PromptLibraryPage.tsx
- Сетка карточек промптов (Card из shadcn/ui)
- Фильтрация по категориям (Select, Tabs)
- Поиск промптов (Input with icon)
- Кнопки действий (Button варианты: default, outline, ghost)
- Модальное окно создания/редактирования (Dialog)
\`\`\`

#### Редактор промптов
\`\`\`typescript
// src/features/prompt/ui/PromptEditor.tsx
- Форма с полями:
  * Название (Input)
  * Категория (Select с иконками)
  * Описание (Textarea)
  * Текст промпта (Textarea с подсветкой переменных)
  * Публичность (Switch)
- Preview панель (Card с Badge)
- Кнопка тестирования (Button with loading state)
- Список переменных (Badge группа)
\`\`\`

#### Генератор заданий из промпта
\`\`\`typescript
// src/features/prompt/ui/AssignmentGenerator.tsx
- Выбор промпта (Combobox searchable)
- Динамические поля для переменных (Form с shadcn/ui)
- Preview результата (Card с Accordion)
- Кнопка генерации (Button with Loader2 icon)
- История генераций (ScrollArea с Timeline)
\`\`\`

#### Конструктор критериев оценки
\`\`\`typescript
// src/features/criteria/ui/CriteriaBuilder.tsx
- Список критериев (Reorderable list с DnD)
- Карточка критерия:
  * Название и описание (Input, Textarea)
  * Максимальный балл (Input type="number")
  * Вес критерия (Slider)
  * Автопроверка (Switch)
  * Промпт проверки (Textarea collapsible)
- Добавление критерия (Button + Dialog)
- Валидация (Alert компонент)
- Сохранение шаблона (Button variant="outline")
\`\`\`

#### Панель оценки работы
\`\`\`typescript
// src/features/evaluation/ui/EvaluationPanel.tsx
- Разделение экрана:
  * Левая часть - работа студента (ScrollArea)
  * Правая часть - критерии оценки (Tabs)
- Карточки критериев:
  * Прогресс бар (Progress)
  * AI оценка vs Ручная (Badge с цветами)
  * Слайдер баллов (Slider)
  * Поле фидбека (Textarea)
  * Кнопка принять/изменить AI (Button group)
- Итоговая оценка (Card с большим числом)
- Кнопки действий (Button group: Сохранить, Опубликовать)
\`\`\`

#### Карточка критерия для студента
\`\`\`typescript
// src/entities/criteria/ui/CriteriaCard.tsx
- Компактный вид критерия:
  * Иконка категории (lucide-react)
  * Название (Typography)
  * Описание (Collapsible)
  * Баллы max/weight (Badge)
  * Полученная оценка (Progress bar)
  * Фидбек (Alert or Card)
\`\`\`

### 2.2 Дизайн система

#### Цветовая схема
\`\`\`css
/* Расширение палитры для новой функциональности */
:root {
  --prompt-primary: 200 70% 50%;      /* Синий для промптов */
  --criteria-success: 142 76% 36%;    /* Зеленый для критериев */
  --evaluation-warning: 38 92% 50%;   /* Оранжевый для ручной оценки */
  --ai-accent: 280 60% 55%;           /* Фиолетовый для AI */
  --feedback-info: 199 89% 48%;       /* Голубой для фидбека */
}
\`\`\`

#### Новые shadcn/ui компоненты для установки
\`\`\`bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add combobox
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add toast
\`\`\`

### 2.3 API Service слой

\`\`\`typescript
// src/shared/api/promptService.ts
export const promptService = {
  getPrompts: async (): Promise<Prompt[]> => {},
  getPromptById: async (id: number): Promise<Prompt> => {},
  createPrompt: async (data: CreatePromptDto): Promise<Prompt> => {},
  updatePrompt: async (id: number, data: UpdatePromptDto): Promise<Prompt> => {},
  deletePrompt: async (id: number): Promise<void> => {},
  generateAssignment: async (promptId: number, params: any): Promise<Assignment> => {},
  getPublicPrompts: async (): Promise<Prompt[]> => {},
}

// src/shared/api/criteriaService.ts
export const criteriaService = {
  getAssignmentCriteria: async (assignmentId: number): Promise<GradingCriteria[]> => {},
  createCriteria: async (assignmentId: number, data: CreateCriteriaDto): Promise<GradingCriteria> => {},
  updateCriteria: async (id: number, data: UpdateCriteriaDto): Promise<GradingCriteria> => {},
  deleteCriteria: async (id: number): Promise<void> => {},
  testAICheck: async (criteriaId: number, testText: string): Promise<TestResult> => {},
}

// src/shared/api/evaluationService.ts
export const evaluationService = {
  getSubmissionEvaluations: async (submissionId: number): Promise<SubmissionEvaluation[]> => {},
  autoEvaluate: async (submissionId: number): Promise<SubmissionEvaluation[]> => {},
  manualEvaluate: async (data: ManualEvaluationDto): Promise<SubmissionEvaluation> => {},
  updateEvaluation: async (id: number, data: UpdateEvaluationDto): Promise<SubmissionEvaluation> => {},
  getFinalGrade: async (submissionId: number): Promise<FinalGrade> => {},
}
\`\`\`

### 2.4 Store (State Management)

\`\`\`typescript
// src/shared/store/promptStore.tsx
export const usePromptStore = create<PromptStore>((set, get) => ({
  prompts: [],
  selectedPrompt: null,
  isLoading: false,
  
  fetchPrompts: async () => {},
  createPrompt: async (data) => {},
  updatePrompt: async (id, data) => {},
  deletePrompt: async (id) => {},
  selectPrompt: (prompt) => set({ selectedPrompt: prompt }),
}))

// src/shared/store/criteriaStore.tsx
export const useCriteriaStore = create<CriteriaStore>((set, get) => ({
  criteria: [],
  evaluations: [],
  isLoading: false,
  
  fetchCriteria: async (assignmentId) => {},
  createCriteria: async (assignmentId, data) => {},
  updateCriteria: async (id, data) => {},
  deleteCriteria: async (id) => {},
  reorderCriteria: (newOrder) => {},
}))

// src/shared/store/evaluationStore.tsx
export const useEvaluationStore = create<EvaluationStore>((set, get) => ({
  evaluations: [],
  currentSubmission: null,
  finalGrade: null,
  isAutoEvaluating: false,
  
  fetchEvaluations: async (submissionId) => {},
  autoEvaluate: async (submissionId) => {},
  updateEvaluation: async (id, data) => {},
  acceptAIScore: (evaluationId) => {},
  rejectAIScore: (evaluationId) => {},
  calculateFinal: async (submissionId) => {},
}))
\`\`\`

### 2.5 Маршруты

\`\`\`typescript
// Добавить в TeacherRoutes.tsx
<Route path="/prompts" element={<PromptLibraryPage />} />
<Route path="/prompts/create" element={<PromptEditorPage />} />
<Route path="/prompts/:id/edit" element={<PromptEditorPage />} />
<Route path="/prompts/:id/generate" element={<AssignmentGeneratorPage />} />

<Route path="/assignments/:id/criteria" element={<CriteriaBuilderPage />} />
<Route path="/submissions/:id/evaluate" element={<EvaluationPage />} />

// Добавить в StudentRoutes.tsx
<Route path="/assignments/:id/criteria" element={<StudentCriteriaViewPage />} />
<Route path="/submissions/:id/feedback" element={<StudentFeedbackPage />} />
\`\`\`

---

## 3. UI/UX Дизайн концепция

### 3.1 Стиль интерфейса

**Современный минималистичный дизайн:**
- Большие карточки с тенями и hover эффектами
- Градиентные акценты для важных элементов
- Плавные анимации (framer-motion)
- Иконки из lucide-react
- Glassmorphism эффекты для модальных окон

### 3.2 Макет страницы библиотеки промптов

\`\`\`
┌─────────────────────────────────────────────────┐
│  🎯 Библиотека Промптов                [+ Создать] │
├─────────────────────────────────────────────────┤
│  [Поиск...] [Категория ▼] [Мои/Публичные]      │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 📝 Essay  │  │ 🧪 Quiz   │  │ 💻 Code   │      │
│  │ Title... │  │ Title... │  │ Title... │      │
│  │ [Edit] [...] │ [Edit] [...] │ [Edit] [...] │  │
│  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ ...      │  │ ...      │  │ ...      │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
\`\`\`

### 3.3 Макет панели оценки

\`\`\`
┌───────────────────────────────────────────────────────┐
│  ← Назад  |  Студент: Иван Иванов  |  Задание: ТЗ №1  │
├─────────────────────┬─────────────────────────────────┤
│                     │  📊 Критерии оценки             │
│  Работа студента:   │  ┌─────────────────────────┐   │
│                     │  │ Структура кода          │   │
│  [Scroll Area       │  │ ⚙️ AI: 8/10  Manual: -  │   │
│   с текстом/кодом]  │  │ [■■■■■■■■□□] Slider     │   │
│                     │  │ Фидбек: [Textarea]      │   │
│                     │  │ [Принять AI] [Изменить] │   │
│                     │  └─────────────────────────┘   │
│                     │  ┌─────────────────────────┐   │
│                     │  │ Читаемость             │   │
│                     │  │ ⚙️ AI: 7/10  Manual: -  │   │
│                     │  │ ...                     │   │
│                     │  └─────────────────────────┘   │
│                     │  ─────────────────────────     │
│                     │  🎯 Итого: 85/100           │   │
│                     │  [Сохранить] [Опубликовать]│   │
└─────────────────────┴─────────────────────────────────┘
\`\`\`

### 3.4 Ключевые UX фишки

1. **Drag & Drop** для изменения порядка критериев
2. **Live Preview** при создании промпта
3. **Анимированные переходы** между шагами
4. **Toast уведомления** при действиях
5. **Skeleton загрузки** для лучшего UX
6. **Автосохранение** черновиков
7. **Keyboard shortcuts** для быстрых действий
8. **Темная тема** support из коробки (shadcn/ui)

---

## 4. Логика работы

### 4.1 Workflow создания задания с критериями

1. Преподаватель создает промпт или выбирает существующий
2. Генерирует задание из промпта с параметрами
3. Открывает конструктор критериев для задания
4. Добавляет критерии оценки:
   - Название, описание, максимальный балл
   - Устанавливает вес критерия
   - Если нужна автопроверка - пишет промпт для AI
5. Тестирует AI проверку на примерах
6. Сохраняет критерии
7. Публикует задание студентам

### 4.2 Workflow оценки работы

**Автоматическая оценка:**
1. Студент сдает работу
2. Система автоматически запускает AI оценку по критериям с `auto_checkable = true`
3. AI анализирует работу и выставляет баллы + фидбек
4. Результаты сохраняются как `auto_score` и `ai_feedback`
5. Преподаватель получает уведомление о готовности к проверке

**Ручная проверка:**
1. Преподаватель открывает работу в панели оценки
2. Видит AI оценки (если есть)
3. По каждому критерию может:
   - Принять AI оценку (копирует в `manual_score`)
   - Изменить оценку и написать свой фидбек
4. Финальная оценка рассчитывается по формуле:
   \`\`\`
   FinalScore = Σ(CriteriaScore * Weight) / Σ(MaxScore * Weight) * 100
   \`\`\`
5. Сохраняет и публикует оценку студенту

### 4.3 Формулы расчета

\`\`\`typescript
// Расчет финальной оценки
function calculateFinalGrade(evaluations: SubmissionEvaluation[], criteria: GradingCriteria[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  evaluations.forEach(eval => {
    const criterion = criteria.find(c => c.id === eval.criteria_id);
    if (criterion) {
      const score = eval.manual_score || eval.auto_score || 0;
      weightedSum += (score / criterion.max_score) * criterion.weight;
      totalWeight += criterion.weight;
    }
  });
  
  return (weightedSum / totalWeight) * 100;
}

// Валидация критериев
function validateCriteria(criteria: GradingCriteria[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Проверка суммы весов
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(totalWeight - criteria.length) > 0.01) {
    errors.push({ field: 'weight', message: 'Рекомендуется устанавливать вес критериев близко к 1.0' });
  }
  
  // Проверка наличия промпта для автопроверки
  criteria.forEach(c => {
    if (c.auto_checkable && !c.check_prompt) {
      errors.push({ field: 'check_prompt', message: `Критерий "${c.name}" требует промпт для автопроверки` });
    }
  });
  
  return errors;
}
\`\`\`

---

## 5. Интеграция с AI (будущее)

### 5.1 AI Service интерфейс

\`\`\`go
// internal/services/ai_service.go
type AIService interface {
    GenerateText(prompt string, params map[string]interface{}) (string, error)
    EvaluateSubmission(submission string, criteria GradingCriteria) (AIEvaluation, error)
    GenerateFeedback(submission string, score int, criteria GradingCriteria) (string, error)
}

// Можно интегрировать OpenAI, Anthropic, или локальные модели
type OpenAIService struct {
    apiKey string
    model  string
}
\`\`\`

### 5.2 Промпт шаблоны для AI

\`\`\`
// Шаблон для оценки
"Оцени следующую работу студента по критерию '{criteria_name}'.
Описание критерия: {criteria_description}
Максимальный балл: {max_score}

Работа студента:
{submission_text}

Выставь оценку от 0 до {max_score} и дай краткий конструктивный фидбек."
\`\`\`

---

## 6. Миграции БД

\`\`\`sql
-- Таблица промптов
CREATE TABLE prompts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    prompt_text TEXT NOT NULL,
    category VARCHAR(50),
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица критериев оценки
CREATE TABLE grading_criteria (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_score INTEGER NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.0,
    auto_checkable BOOLEAN DEFAULT FALSE,
    check_prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица оценок по критериям
CREATE TABLE submission_evaluations (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    criteria_id INTEGER NOT NULL REFERENCES grading_criteria(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    auto_score INTEGER,
    manual_score INTEGER,
    feedback TEXT,
    ai_feedback TEXT,
    is_automatic BOOLEAN DEFAULT FALSE,
    reviewed_by_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, criteria_id)
);

-- Индексы для производительности
CREATE INDEX idx_prompts_teacher ON prompts(teacher_id);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_criteria_assignment ON grading_criteria(assignment_id);
CREATE INDEX idx_evaluations_submission ON submission_evaluations(submission_id);
\`\`\`

---

## 7. Порядок реализации

### Фаза 1: Backend основа (3-4 дня)
1. Создать модели Prompt, GradingCriteria, SubmissionEvaluation
2. Создать репозитории и миграции
3. Реализовать CRUD сервисы
4. Добавить API endpoints
5. Тестирование в Postman/Thunder Client

### Фаза 2: Frontend базовый (3-4 дня)
1. Установить необходимые shadcn/ui компоненты
2. Создать API service слои
3. Создать stores (zustand)
4. Реализовать страницу библиотеки промптов
5. Реализовать редактор промптов

### Фаза 3: Критерии и оценка (4-5 дней)
1. Реализовать конструктор критериев (frontend)
2. Добавить backend логику валидации
3. Создать панель оценки работ
4. Реализовать расчет финальной оценки
5. Добавить представление для студентов

### Фаза 4: AI интеграция (будущее, 5-7 дней)
1. Создать AIService интерфейс
2. Интегрировать OpenAI API
3. Реализовать автоматическую оценку
4. Добавить тестирование промптов
5. Оптимизация и fine-tuning

### Фаза 5: Полировка (2-3 дня)
1. Добавить анимации (framer-motion)
2. Улучшить UX (loading states, errors)
3. Добавить keyboard shortcuts
4. Темная тема
5. Тестирование и исправление багов

---

## 8. Требования к дизайну

### 8.1 Визуальный стиль
- **Типографика**: Inter или Geist для основного текста, JetBrains Mono для кода
- **Spacing**: Использовать 8px grid систему
- **Border radius**: 8px для карточек, 6px для кнопок, 4px для inputs
- **Shadows**: Многоуровневые тени для глубины (sm, md, lg, xl)
- **Colors**: 
  - Primary: Blue-600 для основных действий
  - Success: Green-600 для AI оценок
  - Warning: Orange-500 для требующих внимания
  - Accent: Purple-500 для AI функций

### 8.2 Компоненты shadcn/ui стилизация

\`\`\`typescript
// Пример кастомизации Card для промпта
<Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary">
  <CardHeader className="space-y-2">
    <div className="flex items-center justify-between">
      <Badge variant="outline" className="text-xs">
        {prompt.category}
      </Badge>
      <DropdownMenu>...</DropdownMenu>
    </div>
    <CardTitle className="text-xl font-bold group-hover:text-primary">
      {prompt.title}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground line-clamp-3">
      {prompt.description}
    </p>
  </CardContent>
  <CardFooter className="flex gap-2">
    <Button variant="default" size="sm">Использовать</Button>
    <Button variant="ghost" size="sm">Редактировать</Button>
  </CardFooter>
</Card>
\`\`\`

### 8.3 Адаптивность
- **Desktop** (1280px+): 3-колоночная сетка для карточек
- **Tablet** (768px-1279px): 2-колоночная сетка
- **Mobile** (< 768px): 1-колоночная сетка, стэк вместо split-view

### 8.4 Анимации
\`\`\`typescript
// Использовать framer-motion для плавных переходов
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
\`\`\`

---

## 9. Тестирование

### 9.1 Backend тесты
- Unit тесты для сервисов
- Integration тесты для API endpoints
- Тесты валидации данных
- Тесты расчета оценок

### 9.2 Frontend тесты
- Component тесты (React Testing Library)
- E2E тесты (Playwright)
- Тесты stores (zustand)
- Тесты форм и валидации

---

## 10. Документация для пользователей

Создать внутри приложения:
- Интерактивный туториал для создания первого промпта
- Примеры промптов для разных типов заданий
- Руководство по настройке критериев
- FAQ по работе с AI оценкой

---

## Итого

Это масштабная фича, которая значительно расширит возможности платформы Smart Course:

✅ **Для преподавателей:**
- Библиотека переиспользуемых промптов
- Быстрая генерация заданий
- Структурированная система оценки
- AI помощник в проверке работ
- Единообразный фидбек студентам

✅ **Для студентов:**
- Прозрачные критерии оценки
- Быстрый фидбек (AI pre-check)
- Понимание за что получена оценка
- Возможность улучшить работу по критериям

✅ **Технологии:**
- Go (Gin) - надежный backend
- React + TypeScript - типобезопасный frontend  
- shadcn/ui - современные компоненты
- PostgreSQL - хранение данных
- (Опционально) OpenAI - AI функции
