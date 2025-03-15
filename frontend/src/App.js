import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Achievements from "./pages/Achievements";
import Live from "./pages/Live";

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
        <Route
          path="/"
          element={
            <div style={{ padding: "20px" }}>
              <Home />
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <div style={{ padding: "20px" }}>
              <Dashboard />
            </div>
          }
        />
        <Route
          path="/content-library"
          element={
            <div style={{ padding: "20px" }}>
              <Library />
            </div>
          }
        />
        <Route
          path="/achievements"
          element={
            <div style={{ padding: "20px" }}>
              <Achievements />
            </div>
          }
        />
        <Route
          path="/live-sessions"
          element={
            <div style={{ padding: "20px" }}>
              <Live />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
