import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import TeacherList from "./pages/TeacherList/TeacherList";
import VideoUpload from "./pages/VideoUpload/VideoUpload";
import VideoPlayer from "./pages/VideoPlayer/VideoPlayer";
import SchoolList from "./pages/SchoolList/SchoolList";
import Analytics from "./pages/Analytics/Analytics";
import Settings from "./pages/Settings/Settings";

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="schools" element={<SchoolList />} />
        <Route path="teachers" element={<TeacherList />} />
        <Route path="videos" element={<VideoUpload />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      {/* Standalone Route for Player to have more screen real estate, or could be nested if preferred. 
          Keeping it standalone for "Viewer" mode. */}
      <Route path="/video/:id" element={<VideoPlayer />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
