import React, { useState } from "react";
import "../styles/home.css";
import { API_URL } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast2";
import { useNavigate } from "react-router-dom";

const AdminHome = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const showToast = (message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  };
  const [formData, setFormData] = useState({
    email: localStorage.getItem("email") || "",
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
      const response = await fetch(`${API_URL}/api/admin/login`, {
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
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("email", formData.email);
        showToast("Login successful!", true);
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        window.location.href = next || "/admin/dashboard";
      } else {
        showToast(data.error || "Something went wrong", false);
      }
    } catch (error) {
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
            <span className="login100-form-logo">
              <img src="/images/ailms.png" alt="LOGO" />
            </span>

            <div className="wrap-input100 validate-input" data-validate="Enter eail">
              <input
                className="input100"
                type="text"
                name="email"
                placeholder="  "
                value={formData.email}
                onChange={handleChange}
              />
              <label>Email</label>
            </div>

            <div className="wrap-input100 validate-input" data-validate="Enter password">
              <input
                className="input100"
                type="password"
                name="password"
                placeholder="  "
                value={formData.password}
                onChange={handleChange}
              />
              <label>Password</label>
            </div>

            <div className="container-login100-form-btn">
              <button className="login100-form-btn" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <span className="first-letter-cap">Login as Admin</span>
                )}
              </button>
            </div>

            <a onClick={() => navigate("/")} href="#" className="txt2">
              Forgot Password?
            </a>
            <br />
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
