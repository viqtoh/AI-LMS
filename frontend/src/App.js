import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Certificates from "./pages/Certificates";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("/")
      .then((response) => setMessage(response.data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const About = () => <h2>About Page</h2>;
  const Contact = () => <h2>Contact Page</h2>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/content-library" element={<Library />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/account/settings" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
