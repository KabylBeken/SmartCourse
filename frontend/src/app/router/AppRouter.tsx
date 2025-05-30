import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/shared/auth/ProtectedRoute';
import { UserRole } from '@/shared/api/types';

// Страницы авторизации
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Страницы администратора
import AdminDashboard from '@/pages/admin/AdminDashboard';

// Маршруты преподавателя
import TeacherRoutes from '@/app/router/TeacherRoutes';

// Маршруты студента
import StudentRoutes from '@/app/router/StudentRoutes';

// Домашняя страница и страница 404
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';

const AppRouter = () => {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Маршруты администратора */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Маршруты преподавателя */}
      <Route 
        path="/teacher/*" 
        element={
          <ProtectedRoute requiredRole={UserRole.TEACHER}>
            <TeacherRoutes />
          </ProtectedRoute>
        } 
      />

      {/* Маршруты студента */}
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <StudentRoutes />
          </ProtectedRoute>
        } 
      />

      {/* Обработка несуществующих маршрутов */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRouter;
