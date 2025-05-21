import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from '@/pages/student/StudentDashboard';
import CoursesPage from '@/pages/student/courses/CoursesPage';
import CourseDetailPage from '@/pages/student/courses/CourseDetailPage';
import AssignmentsPage from '@/pages/student/assignments/AssignmentsPage';
import GradesPage from '@/pages/student/GradesPage';

const StudentRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<StudentDashboard />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route path="/courses/:courseId/assignments" element={<AssignmentsPage />} />
      <Route path="/grades" element={<GradesPage />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
};

export default StudentRoutes;
