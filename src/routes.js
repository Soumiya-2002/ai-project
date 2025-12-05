import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import TeacherList from "./pages/TeacherList/TeacherList";
import VideoUpload from "./pages/VideoUpload/VideoUpload";

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="teachers" element={<TeacherList />} />
        <Route path="videos" element={<VideoUpload />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
