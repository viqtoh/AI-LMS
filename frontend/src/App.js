import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Achievements from "./pages/Achievements";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import LearnPath from "./pages/LearnPath";
import Course from "./pages/Course";
import AdminHome from "./adminPages/Home";
import AdminDashboard from "./adminPages/Dashboard";
import UserManagement from "./adminPages/UserManagement";
import StaffManagement from "./adminPages/StaffManagement";
import ContentManagement from "./adminPages/ContentManagement";
import CreateContent from "./adminPages/CreateContent";
import CategoryManagement from "./adminPages/CategoryManagement";
import AdminLearnPath from "./adminPages/LearnPath";
import AdminProfile from "./adminPages/Profile";
import AdminCourse from "./adminPages/Course";

function App() {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/content-library" element={<Library />} />
        <Route path="/content-library/path/:id" element={<LearnPath />} />
        <Route path="/content-library/course/:id" element={<Course />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/account/settings" element={<Profile />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/content-management" element={<ContentManagement />} />
        <Route path="/admin/content-management/create" element={<CreateContent />} />
        <Route path="/admin/content-management/course/:id" element={<AdminCourse />} />
        <Route path="/admin/content-managment/path/:id" element={<AdminLearnPath />} />
        <Route path="/admin/category-management" element={<CategoryManagement />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
        <Route path="/admin/staff-management" element={<StaffManagement />} />
        <Route path="/admin/account/settings" element={<AdminProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
