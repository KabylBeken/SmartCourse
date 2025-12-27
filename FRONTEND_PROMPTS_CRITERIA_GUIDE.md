# 🎨 Frontend Design & Implementation Guide
## SmartCourse - AI-Powered Learning Management System

---

## 📋 Table of Contents

1. [Design System](#design-system)
2. [Component Architecture](#component-architecture)
3. [Feature Prompts](#feature-prompts)
4. [Evaluation Criteria](#evaluation-criteria)
5. [API Integration](#api-integration)
6. [UI/UX Best Practices](#uiux-best-practices)

---

## 🎨 Design System

### Color Palette

**Primary Colors:**
- **Brand Blue**: `oklch(0.55 0.18 250)` - Primary actions, links, focus states
- **Success Green**: `oklch(0.65 0.15 145)` - Completed tasks, positive feedback
- **Warning Amber**: `oklch(0.75 0.15 75)` - Pending reviews, attention needed
- **AI Purple**: `oklch(0.60 0.20 285)` - AI-powered features, automation

**Neutral Colors:**
- **Background**: `oklch(0.98 0 0)` Light / `oklch(0.15 0 0)` Dark
- **Foreground**: `oklch(0.20 0 0)` Light / `oklch(0.95 0 0)` Dark
- **Muted**: `oklch(0.50 0 0)` - Secondary text, disabled states
- **Border**: `oklch(0.85 0 0)` Light / `oklch(0.30 0 0)` Dark

**Feature-Specific Colors:**
- **Prompt Blue**: `oklch(0.55 0.18 230)` - Prompt library, templates
- **Criteria Teal**: `oklch(0.60 0.15 180)` - Grading criteria, rubrics
- **Evaluation Orange**: `oklch(0.65 0.18 50)` - Manual evaluation, feedback
- **Student Indigo**: `oklch(0.58 0.16 270)` - Student views, submissions

### Typography

**Font Family:**
- **Sans**: Geist - Headings, body text, UI elements
- **Mono**: Geist Mono - Code snippets, technical content

**Font Sizes:**
- **Display**: 3.5rem (56px) - Hero headings
- **H1**: 2.5rem (40px) - Page titles
- **H2**: 2rem (32px) - Section headers
- **H3**: 1.5rem (24px) - Card headers
- **Body**: 1rem (16px) - Main content
- **Small**: 0.875rem (14px) - Captions, metadata
- **Tiny**: 0.75rem (12px) - Labels, badges

**Line Heights:**
- **Tight**: 1.25 - Headings
- **Normal**: 1.5 - Body text
- **Relaxed**: 1.75 - Long-form content

### Spacing Scale

```
2px  → gap-0.5
4px  → gap-1
8px  → gap-2
12px → gap-3
16px → gap-4
24px → gap-6
32px → gap-8
48px → gap-12
64px → gap-16
```

### Border Radius

```
--radius: 0.75rem (12px) - Default
--radius-sm: 0.5rem (8px) - Small elements
--radius-md: 0.75rem (12px) - Cards, inputs
--radius-lg: 1rem (16px) - Modals, panels
--radius-xl: 1.5rem (24px) - Hero sections
```

### Shadows

```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.15)
xl: 0 20px 25px rgba(0,0,0,0.2)
```

---

## 🏗️ Component Architecture

### Atomic Design Structure

```
components/
├── ui/                    # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── slider.tsx
│   ├── tabs.tsx
│   └── ...
├── features/              # Feature-specific components
│   ├── prompts/
│   │   ├── prompt-card.tsx
│   │   ├── prompt-editor.tsx
│   │   └── prompt-library.tsx
│   ├── criteria/
│   │   ├── criteria-builder.tsx
│   │   ├── criteria-item.tsx
│   │   └── rubric-preview.tsx
│   └── evaluations/
│       ├── evaluation-panel.tsx
│       ├── score-slider.tsx
│       └── feedback-editor.tsx
└── layouts/               # Page layouts
    ├── dashboard-layout.tsx
    ├── teacher-layout.tsx
    └── student-layout.tsx
```

---

## 🎯 Feature Prompts

### 1. Prompt Library Interface

**User Story:**
> As a teacher, I want to browse, search, and manage AI prompts so that I can quickly generate high-quality assignments.

**Design Prompt:**
```
Create a modern prompt library interface with:
- Grid layout of prompt cards (3 columns on desktop, 2 on tablet, 1 on mobile)
- Each card displays: icon, title, category badge, description preview, action buttons
- Top filters: search input, category dropdown, "My Prompts / Public" tabs
- Hover effects: card lift with shadow, button highlights
- Empty state with illustration and "Create your first prompt" CTA
- Color scheme: Primary blue for cards, purple accents for AI features
```

**Key Components:**
- `PromptCard` - Individual prompt display with actions
- `PromptFilters` - Search and filter controls
- `PromptGrid` - Responsive grid layout with loading states
- `EmptyPromptState` - Onboarding for new users

**Interactions:**
1. Search filters prompts in real-time (debounced 300ms)
2. Category filter with multi-select support
3. "Create Prompt" button opens modal dialog
4. Card actions: Edit (modal), Delete (confirmation), Use (navigate)
5. Infinite scroll or pagination (show 12 per page)

---

### 2. Prompt Editor Dialog

**User Story:**
> As a teacher, I want to create and edit AI prompts with variable support so that I can generate customized assignments.

**Design Prompt:**
```
Design a multi-step prompt editor modal:
- Step 1: Basic Info (title, category, description)
- Step 2: Prompt Text (large textarea with variable highlighting {{variable}})
- Step 3: Preview (rendered prompt with detected variables)
- Variable detection: automatically extract {{variable_name}} patterns
- Live preview panel showing final prompt with sample data
- Color scheme: Blue primary, purple for AI suggestions
- Validation: required fields, character limits, variable syntax check
```

**Key Components:**
- `PromptEditorDialog` - Multi-step modal form
- `PromptTextarea` - Text editor with syntax highlighting
- `VariableList` - Detected variables with sample inputs
- `PromptPreview` - Rendered output preview

**Validation Rules:**
- Title: 3-100 characters, required
- Category: must select from predefined list
- Prompt text: 20-5000 characters, required
- Variables: must use {{variable}} format, alphanumeric + underscore only

---

### 3. Criteria Builder Interface

**User Story:**
> As a teacher, I want to define grading criteria with weights and AI automation so that students understand expectations and grading is consistent.

**Design Prompt:**
```
Create a criteria builder page with:
- Header: Assignment title, total points, criteria count
- List of criteria items (reorderable with drag handles)
- Each criterion shows: name, description, max score, weight slider, AI toggle
- Add criterion button with inline form
- Weight distribution visualization (pie chart or progress bars)
- AI automation toggle with conditional prompt field
- Validation warnings (e.g., weights don't sum to 100%)
- Color scheme: Teal for criteria, purple for AI features
```

**Key Components:**
- `CriteriaBuilder` - Main container with state management
- `CriterionCard` - Individual criterion with inline editing
- `WeightVisualizer` - Chart showing weight distribution
- `AIPromptInput` - Collapsible AI check configuration

**Criterion Fields:**
- Name: 3-100 characters, required
- Description: 0-500 characters, optional
- Max Score: 1-100 points, required
- Weight: 0.1-5.0 multiplier, default 1.0
- Auto-checkable: boolean toggle
- Check Prompt: conditional on auto-checkable, 50-2000 characters

**Business Rules:**
- Minimum 1 criterion required per assignment
- Total weight recommendation: close to number of criteria
- AI prompts required if auto-checkable is enabled
- Can test AI check before saving

---

### 4. Evaluation Panel (Split View)

**User Story:**
> As a teacher, I want to review student submissions side-by-side with grading criteria so that I can provide detailed, fair feedback efficiently.

**Design Prompt:**
```
Design a split-screen evaluation interface:
- Left panel (60%): Student submission (scrollable, syntax highlighting for code)
- Right panel (40%): Grading criteria with score inputs
- Each criterion shows: name, description, AI score, manual score slider, feedback textarea
- AI score badge (purple) vs Manual score (orange)
- "Accept AI" and "Override" buttons for each criterion
- Bottom sticky bar: Total score (large), Save draft, Publish buttons
- Responsive: stacks vertically on mobile
- Color scheme: Orange for manual input, purple for AI scores
```

**Key Components:**
- `EvaluationPanel` - Split layout container
- `SubmissionViewer` - Formatted student work display
- `CriterionEvaluator` - Score input with AI comparison
- `FeedbackEditor` - Rich text feedback input
- `ScoreSummary` - Calculated total with breakdown

**Evaluation Workflow:**
1. Load submission and criteria
2. Optionally run AI auto-evaluation (loading state)
3. Review each criterion:
   - See AI score and feedback (if available)
   - Adjust score with slider (0 to max_score)
   - Accept AI or write custom feedback
4. Calculate weighted total score
5. Save as draft or publish to student

**Score Calculation:**
```typescript
finalScore = Σ(criterionScore × weight) / Σ(maxScore × weight) × 100
```

---

### 5. Student Criteria View

**User Story:**
> As a student, I want to see the grading criteria before starting an assignment so that I understand what's expected.

**Design Prompt:**
```
Create a read-only criteria display for students:
- Header: Assignment title, due date, total points
- Accordion list of criteria (expand/collapse each)
- Each criterion shows: name, description, max points, weight indicator
- Visual weight representation (progress bar or dot size)
- Summary card: total points, number of criteria, AI-assisted notice
- Color scheme: Indigo primary, muted for inactive states
- Mobile-optimized with touch-friendly accordions
```

**Key Components:**
- `StudentCriteriaView` - Read-only criteria list
- `CriterionAccordion` - Expandable criterion details
- `WeightIndicator` - Visual weight representation
- `CriteriaSummary` - Overview card

---

### 6. Student Feedback View

**User Story:**
> As a student, I want to see my detailed feedback and scores per criterion so that I can understand my grade and improve.

**Design Prompt:**
```
Design a feedback results page:
- Hero section: Final grade (large number), percentage bar, grade letter
- Criterion breakdown: list of criteria with scores and feedback
- Each criterion card: name, earned/max points, feedback text, AI badge if applicable
- Strengths/weaknesses summary (AI-generated if available)
- Color coding: green for full marks, yellow for partial, red for low scores
- Download feedback button (PDF export)
- Color scheme: Indigo primary, semantic colors for scores
```

**Key Components:**
- `FeedbackHero` - Large grade display
- `CriterionFeedbackCard` - Individual feedback item
- `FeedbackSummary` - Overall strengths/weaknesses
- `FeedbackExport` - PDF generation

---

## ✅ Evaluation Criteria

### Frontend Quality Criteria

#### 1. Design Consistency (Max: 20 points, Weight: 1.5)
**Description:** Adherence to design system, consistent spacing, colors, typography

**Evaluation Points:**
- [ ] Uses design tokens from globals.css (5 pts)
- [ ] Consistent spacing scale (gap-4, p-6, etc.) (5 pts)
- [ ] Proper color usage (semantic colors for states) (5 pts)
- [ ] Typography hierarchy (heading sizes, font weights) (5 pts)

**AI Check Prompt:**
```
Review this component code for design consistency:
- Check if it uses CSS variables from the design system
- Verify spacing uses Tailwind's spacing scale (gap-X, p-X, m-X)
- Confirm semantic color usage (bg-primary, text-foreground, etc.)
- Validate typography classes (text-xl, font-semibold, leading-relaxed)
Score: 0-20 points based on adherence to design system.
```

---

#### 2. Responsive Design (Max: 15 points, Weight: 1.2)
**Description:** Works seamlessly across mobile, tablet, and desktop

**Evaluation Points:**
- [ ] Mobile-first approach (base styles for mobile) (4 pts)
- [ ] Tablet breakpoint (md:) implemented correctly (4 pts)
- [ ] Desktop breakpoint (lg:) with optimal layout (4 pts)
- [ ] Touch-friendly UI (buttons 44px+, spacing) (3 pts)

**AI Check Prompt:**
```
Analyze responsive design implementation:
- Identify responsive Tailwind classes (sm:, md:, lg:, xl:)
- Check for mobile-first base styles
- Verify grid/flex layouts adapt to screen sizes
- Confirm touch target sizes (min 44x44px for buttons)
Score: 0-15 points based on responsive coverage.
```

---

#### 3. Component Reusability (Max: 15 points, Weight: 1.0)
**Description:** Clean, modular components with proper props and composition

**Evaluation Points:**
- [ ] Single responsibility principle (5 pts)
- [ ] Proper TypeScript interfaces for props (4 pts)
- [ ] Composition over duplication (4 pts)
- [ ] Documented with JSDoc comments (2 pts)

**AI Check Prompt:**
```
Evaluate component architecture:
- Check if component has single, clear purpose
- Verify TypeScript prop interfaces are defined
- Look for code duplication vs. reusable sub-components
- Check for JSDoc comments describing component usage
Score: 0-15 points based on code quality.
```

---

#### 4. Accessibility (Max: 15 points, Weight: 1.3)
**Description:** WCAG 2.1 AA compliance, keyboard navigation, screen reader support

**Evaluation Points:**
- [ ] Semantic HTML (header, main, nav, article) (4 pts)
- [ ] ARIA labels and roles where needed (4 pts)
- [ ] Keyboard navigation support (focus states, tab order) (4 pts)
- [ ] Color contrast ratios (4.5:1 minimum) (3 pts)

**AI Check Prompt:**
```
Audit accessibility compliance:
- Check for semantic HTML5 elements
- Verify ARIA attributes (aria-label, role, aria-describedby)
- Identify keyboard event handlers and focus management
- Flag potential color contrast issues (light text on light bg)
Score: 0-15 points based on accessibility standards.
```

---

#### 5. Performance (Max: 10 points, Weight: 1.0)
**Description:** Fast rendering, optimized images, code splitting

**Evaluation Points:**
- [ ] Lazy loading for images and heavy components (3 pts)
- [ ] Memoization (useMemo, React.memo) where appropriate (3 pts)
- [ ] Optimized re-renders (avoid unnecessary state updates) (2 pts)
- [ ] Code splitting with dynamic imports (2 pts)

**AI Check Prompt:**
```
Assess performance optimizations:
- Look for lazy loading (React.lazy, next/image)
- Check for memoization (useMemo, useCallback, React.memo)
- Identify potential unnecessary re-renders
- Verify code splitting with dynamic imports
Score: 0-10 points based on performance best practices.
```

---

#### 6. Error Handling & UX (Max: 10 points, Weight: 1.1)
**Description:** Graceful error states, loading indicators, user feedback

**Evaluation Points:**
- [ ] Loading states (skeletons, spinners) (3 pts)
- [ ] Error boundaries and error messages (3 pts)
- [ ] Form validation with helpful messages (2 pts)
- [ ] Toast notifications for actions (2 pts)

**AI Check Prompt:**
```
Review error handling and UX polish:
- Check for loading states (Skeleton, Spinner components)
- Verify error handling (try-catch, error boundaries)
- Look for form validation and error messages
- Identify toast/notification usage for user feedback
Score: 0-10 points based on UX completeness.
```

---

#### 7. API Integration (Max: 10 points, Weight: 1.0)
**Description:** Proper data fetching, state management, type safety

**Evaluation Points:**
- [ ] TypeScript types match API responses (3 pts)
- [ ] Error handling for API calls (3 pts)
- [ ] Loading/success/error states managed (2 pts)
- [ ] Proper use of SWR or React Query (2 pts)

**AI Check Prompt:**
```
Evaluate API integration quality:
- Verify TypeScript interfaces for API data
- Check error handling in fetch/axios calls
- Confirm loading/error state management
- Look for SWR or React Query usage
Score: 0-10 points based on API integration practices.
```

---

#### 8. Code Style & Best Practices (Max: 5 points, Weight: 0.8)
**Description:** Clean code, consistent formatting, no console errors

**Evaluation Points:**
- [ ] No ESLint warnings/errors (2 pts)
- [ ] Consistent naming conventions (camelCase, PascalCase) (1 pt)
- [ ] No unused imports or variables (1 pt)
- [ ] Proper file structure and naming (1 pt)

**AI Check Prompt:**
```
Check code style and conventions:
- Identify potential ESLint issues
- Verify naming conventions (components PascalCase, functions camelCase)
- Look for unused imports or dead code
- Assess file naming and structure organization
Score: 0-5 points based on code cleanliness.
```

---

## 🔗 API Integration

### Go Backend Endpoints

#### Prompts API
```typescript
// GET /api/teacher/prompts
interface PromptListResponse {
  prompts: Prompt[];
  total: number;
}

// POST /api/teacher/prompts
interface CreatePromptRequest {
  title: string;
  description?: string;
  prompt_text: string;
  category: string;
  is_public: boolean;
}

// PUT /api/teacher/prompts/:id
interface UpdatePromptRequest {
  title?: string;
  description?: string;
  prompt_text?: string;
  category?: string;
  is_public?: boolean;
}
```

#### Criteria API
```typescript
// GET /api/teacher/assignments/:id/criteria
interface CriteriaListResponse {
  criteria: GradingCriteria[];
  total_weight: number;
  total_points: number;
}

// POST /api/teacher/assignments/:id/criteria
interface CreateCriteriaRequest {
  name: string;
  description?: string;
  max_score: number;
  weight: number;
  auto_checkable: boolean;
  check_prompt?: string;
}
```

#### Evaluation API
```typescript
// GET /api/teacher/submissions/:id/evaluations
interface EvaluationListResponse {
  evaluations: SubmissionEvaluation[];
  final_score: number;
  final_grade: string; // A, B, C, D, F
}

// POST /api/teacher/submissions/:id/auto-evaluate
interface AutoEvaluateResponse {
  evaluations: SubmissionEvaluation[];
  ai_summary: string;
}

// POST /api/teacher/submissions/:id/evaluate
interface ManualEvaluateRequest {
  criteria_id: number;
  score: number;
  feedback: string;
}
```

### Frontend Service Layer

```typescript
// lib/api/prompts.ts
export const promptsApi = {
  getAll: async (): Promise<Prompt[]> => {
    const res = await fetch('/api/teacher/prompts');
    if (!res.ok) throw new Error('Failed to fetch prompts');
    return res.json();
  },
  
  create: async (data: CreatePromptRequest): Promise<Prompt> => {
    const res = await fetch('/api/teacher/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create prompt');
    return res.json();
  },
  
  // ... other methods
};

// lib/api/criteria.ts
export const criteriaApi = {
  getByAssignment: async (assignmentId: number): Promise<GradingCriteria[]> => {
    const res = await fetch(`/api/teacher/assignments/${assignmentId}/criteria`);
    if (!res.ok) throw new Error('Failed to fetch criteria');
    return res.json();
  },
  
  // ... other methods
};

// lib/api/evaluations.ts
export const evaluationsApi = {
  autoEvaluate: async (submissionId: number): Promise<EvaluationListResponse> => {
    const res = await fetch(`/api/teacher/submissions/${submissionId}/auto-evaluate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Auto-evaluation failed');
    return res.json();
  },
  
  // ... other methods
};
```

---

## 💡 UI/UX Best Practices

### 1. Loading States
**Always show loading feedback:**
```tsx
// Skeleton for content loading
<Card className="p-6 space-y-4">
  <Skeleton className="h-8 w-2/3" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
</Card>

// Spinner for actions
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save Changes
</Button>
```

### 2. Error Handling
**Show actionable error messages:**
```tsx
{error && (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      {error.message}. <Button variant="link" onClick={retry}>Try again</Button>
    </AlertDescription>
  </Alert>
)}
```

### 3. Form Validation
**Real-time validation with helpful messages:**
```tsx
<FormField
  name="title"
  control={form.control}
  render={({ field }) => (
    <FormItem>
      <FormLabel>Prompt Title</FormLabel>
      <FormControl>
        <Input {...field} placeholder="e.g., Essay Topic Generator" />
      </FormControl>
      <FormDescription>
        Choose a descriptive title (3-100 characters)
      </FormDescription>
      <FormMessage /> {/* Shows validation errors */}
    </FormItem>
  )}
/>
```

### 4. Confirmation Dialogs
**Prevent accidental destructive actions:**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Prompt</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this prompt. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 5. Toast Notifications
**Provide feedback for user actions:**
```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

const handleSave = async () => {
  try {
    await savePrompt(data);
    toast({
      title: "Success!",
      description: "Prompt saved successfully.",
    });
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to save prompt. Please try again.",
    });
  }
};
```

### 6. Keyboard Shortcuts
**Power user efficiency:**
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Escape to close dialog
    if (e.key === 'Escape') {
      handleClose();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### 7. Optimistic Updates
**Instant feedback with rollback on error:**
```tsx
const { mutate } = useSWR('/api/prompts', fetcher);

const handleTogglePublic = async (promptId: number, isPublic: boolean) => {
  // Optimistically update UI
  mutate(
    (data) => data.map(p => p.id === promptId ? { ...p, is_public: !isPublic } : p),
    false // don't revalidate yet
  );
  
  try {
    await updatePrompt(promptId, { is_public: !isPublic });
    mutate(); // revalidate on success
  } catch (error) {
    mutate(); // rollback on error
    toast({ variant: "destructive", title: "Update failed" });
  }
};
```

---

## 🎓 Learning Resources

### shadcn/ui Documentation
- Components: https://ui.shadcn.com/docs/components
- Themes: https://ui.shadcn.com/themes
- Examples: https://ui.shadcn.com/examples

### Tailwind CSS
- Core Concepts: https://tailwindcss.com/docs/utility-first
- Customization: https://tailwindcss.com/docs/theme
- Responsive Design: https://tailwindcss.com/docs/responsive-design

### Next.js
- App Router: https://nextjs.org/docs/app
- Data Fetching: https://nextjs.org/docs/app/building-your-application/data-fetching
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## 📊 Success Metrics

### Frontend Quality Goals

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Lighthouse Score** | 90+ | Performance, Accessibility, Best Practices, SEO |
| **First Contentful Paint** | < 1.5s | Page load speed |
| **Time to Interactive** | < 3s | When page becomes fully interactive |
| **Bundle Size** | < 250KB | Main JavaScript bundle (gzipped) |
| **Accessibility Score** | 100 | WCAG 2.1 AA compliance |
| **Mobile Usability** | 100% | Google Mobile-Friendly Test |
| **Test Coverage** | > 80% | Unit + Integration tests |
| **Zero Console Errors** | ✅ | Production build |

---

## 🚀 Implementation Checklist

### Phase 1: Design System Setup
- [ ] Configure globals.css with design tokens
- [ ] Install required shadcn/ui components
- [ ] Create component documentation
- [ ] Build Storybook for component library

### Phase 2: Core Features
- [ ] Implement Prompt Library page
- [ ] Create Prompt Editor modal
- [ ] Build Criteria Builder interface
- [ ] Develop Evaluation Panel

### Phase 3: Integration
- [ ] Connect to Go API endpoints
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Set up toast notifications

### Phase 4: Polish
- [ ] Add animations with framer-motion
- [ ] Optimize performance (code splitting, lazy loading)
- [ ] Conduct accessibility audit
- [ ] Write E2E tests with Playwright

### Phase 5: Deployment
- [ ] Build production bundle
- [ ] Run Lighthouse audits
- [ ] Deploy to Vercel
- [ ] Monitor with Vercel Analytics

---

## 📝 Conclusion

This guide provides comprehensive prompts, criteria, and best practices for building the SmartCourse frontend. Follow the design system strictly, use shadcn/ui components consistently, and ensure every feature meets the evaluation criteria for production-quality code.

**Key Takeaways:**
1. **Design Consistency** - Use design tokens, maintain spacing/color standards
2. **Accessibility First** - Semantic HTML, ARIA labels, keyboard navigation
3. **Performance Matters** - Lazy load, code split, optimize re-renders
4. **User Experience** - Loading states, error handling, feedback
5. **Code Quality** - TypeScript, reusable components, clean architecture

---

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Maintainer:** SmartCourse Development Team
