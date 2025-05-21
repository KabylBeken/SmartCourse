import { Routes, Route } from 'react-router-dom';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import CoursesPage from '@/pages/admin/courses/CoursesPage';
import CourseForm from '@/pages/admin/courses/CourseForm';
import CourseStudentsPage from '@/pages/admin/courses/CourseStudentsPage';
import LogsPage from '@/pages/admin/monitoring/LogsPage';
import EventsPage from '@/pages/admin/monitoring/EventsPage';
import MetricsPage from '@/pages/admin/monitoring/MetricsPage';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      
      {/* Маршруты для управления курсами */}
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/new" element={<CourseForm />} />
      <Route path="/courses/:id" element={<CourseForm />} />
      <Route path="/courses/:id/students" element={<CourseStudentsPage />} />
      
      {/* Маршруты для мониторинга */}
      <Route path="/logs" element={<LogsPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/metrics" element={<MetricsPage />} />
    </Routes>
  );
};

export default AdminRoutes;
