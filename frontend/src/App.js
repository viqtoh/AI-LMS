import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";

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
          path="/about"
          element={
            <>
              <NavBar />
              <div style={{ padding: "20px" }}>
                <About />
              </div>
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <NavBar />
              <div style={{ padding: "20px" }}>
                <Contact />
              </div>
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
