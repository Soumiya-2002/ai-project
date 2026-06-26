import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login/Login';
import LessonPlanLogin from './pages/LessonPlanLogin/LessonPlanLogin';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import VideoUpload from './pages/VideoUpload/VideoUpload';
import SchoolList from './pages/SchoolList/SchoolList';
import TeacherList from './pages/TeacherList/TeacherList';
import UserList from './pages/UserList/UserList';
import AnswerSheetUpload from './pages/AnswerSheetUpload/AnswerSheetUpload';
import './App.css';

import Reports from './pages/Reports';
import Rubrics from './pages/Rubrics/Rubrics';

import LessonPlanAdminLayout from './layouts/LessonPlanAdminLayout/LessonPlanAdminLayout';
import LessonPlanDashboard from './pages/LessonPlanDashboard/LessonPlanDashboard';
import LessonPlanSchoolList from './pages/LessonPlanSchoolList/LessonPlanSchoolList';
import LessonPlanTeacherList from './pages/LessonPlanTeacherList/LessonPlanTeacherList';
import LessonPlanUserList from './pages/LessonPlanUserList/LessonPlanUserList';
import LessonPlanVideoUpload from './pages/LessonPlanVideoUpload/LessonPlanVideoUpload';
import LessonPlanReports from './pages/LessonPlanReports/LessonPlanReports';
import LessonPlanRubrics from './pages/LessonPlanRubrics/LessonPlanRubrics';
import LessonPlanAnswerSheetUpload from './pages/LessonPlanAnswerSheetUpload/LessonPlanAnswerSheetUpload';


function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/lesson-plan/login" element={<LessonPlanLogin />} />

        {/* Protected Routes wrapped in AdminLayout */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schools" element={<SchoolList />} />
            <Route path="/teachers" element={<TeacherList />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/upload" element={<VideoUpload />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/rubrics" element={<Rubrics />} />
          </Route>

          {/* Standalone Route without Sidebar */}
          <Route path="/answer-sheet" element={<AnswerSheetUpload />} />
        </Route>

        {/* Protected Routes wrapped in LessonPlanAdminLayout */}
        <Route path="/lesson-plan" element={<PrivateRoute redirectTo="/lesson-plan/login" />}>
          <Route element={<LessonPlanAdminLayout />}>
            <Route path="dashboard" element={<LessonPlanDashboard />} />
            <Route path="schools" element={<LessonPlanSchoolList />} />
            <Route path="teachers" element={<LessonPlanTeacherList />} />
            <Route path="users" element={<LessonPlanUserList />} />
            <Route path="upload" element={<LessonPlanVideoUpload />} />
            <Route path="reports" element={<LessonPlanReports />} />
            <Route path="rubrics" element={<LessonPlanRubrics />} />
          </Route>

          <Route path="answer-sheet" element={<LessonPlanAnswerSheetUpload />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
