import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import VideoUpload from './pages/VideoUpload/VideoUpload';
import SchoolList from './pages/SchoolList/SchoolList';
import TeacherList from './pages/TeacherList/TeacherList';
import UserList from './pages/UserList/UserList';
import './App.css';

import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes wrapped in AdminLayout */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schools" element={<SchoolList />} />
            <Route path="/teachers" element={<TeacherList />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/upload" element={<VideoUpload />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
