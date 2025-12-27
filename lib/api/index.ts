/**
 * Экспорт всех API сервисов
 * 
 * Маршруты Go Backend:
 * 
 * Auth:
 * - POST /auth/register
 * - POST /auth/login
 * 
 * Admin (/api/admin):
 * - GET/POST /courses
 * - PUT/DELETE /courses/:id
 * - POST /courses/:id/students
 * - DELETE /courses/:id/students/:student_id
 * - GET /logs (MongoDB)
 * - GET /events (MongoDB)
 * - GET /metrics (MongoDB)
 * 
 * Teacher (/api/teacher):
 * - GET /courses
 * - GET/POST /courses/:id/assignments
 * - PUT/DELETE /assignments/:id
 * - GET/POST /assignments/:id/grades
 * - PUT/DELETE /grades/:id
 * 
 * Student (/api/student):
 * - GET /courses
 * - GET /courses/:id
 * - GET /courses/:id/assignments
 * - GET /grades
 * 
 * Legacy (для совместимости):
 * - /api/courses
 * - /api/students
 */

export * from "./courses"
export * from "./assignments"
export * from "./grades"
export * from "./students"
export * from "./ai"
