import React, { useState } from "react";
import "../styles/home.css";
import { API_URL } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast2";

const Home = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    console.log(isSuccess);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  };
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  React.useEffect(() => {
    const error = localStorage.getItem("error");
    if (error) {
      showToast(error, false);
      localStorage.removeItem("error");
    }
  }, []);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setIsLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      showToast("All fields are required!", false);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!data.error && data.token) {
        localStorage.setItem("token", data.token);
        showToast("Login successful!", true);
        // Redirect to login page
        window.location.href = "/dashboard";
      } else {
        showToast(data.error || "Something went wrong", false);
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Server error, please try again later.", false);
    }

    setIsLoading(false);
  };

  return (
    <div className="limiter">
      {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
      <div className="container-login100">
        <div className="wrap-login100">
          <form
            className="login100-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <span className="login100-form-title">Welcome</span>
            <span className="login100-form-avatar">
              <img src="images/avatar-01.jpg" alt="AVATAR" />
            </span>

            <div className="wrap-input100 validate-input" data-validate="Enter eail">
              <input
                className="input100"
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <span className="focus-input100" data-placeholder="Email"></span>
            </div>

            <div className="wrap-input100 validate-input" data-validate="Enter password">
              <input
                className="input100"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <span className="focus-input100" data-placeholder="Password"></span>
            </div>

            <div className="container-login100-form-btn">
              <button className="login100-form-btn" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  "Login"
                )}
              </button>
            </div>

            <a href="/" className="txt2">
              Forgot Password?
            </a>
            <br />

            <span className="txt1 me-2">Don’t have an account?</span>
            <a href="/register" className="txt2">
              Sign up
            </a>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
