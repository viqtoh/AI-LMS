import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Certificates from "./pages/Certificates";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import LearnPath from "./pages/LearnPath";

function App() {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/content-library" element={<Library />} />
        <Route path="/content-library/path/:id" element={<LearnPath />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/account/settings" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
