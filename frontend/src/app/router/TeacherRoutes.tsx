import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import CoursesPage from '@/pages/teacher/courses/CoursesPage';
import AssignmentsPage from '@/pages/teacher/assignments/AssignmentsPage';
import AssignmentForm from '@/pages/teacher/assignments/AssignmentForm';
import GradesPage from '@/pages/teacher/assignments/GradesPage';
import GradeForm from '@/pages/teacher/assignments/GradeForm';

const TeacherRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<TeacherDashboard />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:courseId/assignments" element={<AssignmentsPage />} />
      <Route path="/courses/:courseId/assignments/new" element={<AssignmentForm />} />
      <Route path="/assignments/:assignmentId" element={<AssignmentForm />} />
      <Route path="/assignments/:assignmentId/grades" element={<GradesPage />} />
      <Route path="/grades/:gradeId" element={<GradeForm />} />
      <Route path="*" element={<Navigate to="/teacher" replace />} />
    </Routes>
  );
};

export default TeacherRoutes;
