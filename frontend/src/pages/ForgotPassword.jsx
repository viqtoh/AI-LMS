// src/pages/ForgotPassword.js (create this file)
import React, { useState } from "react";
import "../styles/home.css"; // Reuse existing styles
import { API_URL } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast2";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);
  const [toast, setToast] = useState(null);
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  const showToast = (message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      showToast("Please enter your email address.", false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(
          data.message ||
            "If an account with that email exists, a password reset link has been sent.",
          true
        );
        setEmail(""); // Clear email field after sending
      } else {
        showToast(data.error || "Failed to send password reset link.", false);
      }
    } catch (error) {
      showToast("Server error, please try again later.", false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="limiter">
      {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
      <div className="container-login100">
        <div className="wrap-login100">
          <form className="login100-form" onSubmit={handleSubmit}>
            <span className="login100-form-logo">
              <img src="images/ailms.png" alt="LOGO" />
            </span>

            <span className="login100-form-title p-b-20 p-t-20">Forgot Password?</span>
            <p className="text-center m-b-20 text-muted">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <div
              className="wrap-input100 validate-input"
              data-validate="Valid email is required: ex@abc.xyz"
            >
              <input
                className="input100"
                type="email"
                name="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label>Email</label>
            </div>

            <div className="container-login100-form-btn">
              <button className="login100-form-btn" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>

            <div className="text-center p-t-30">
              <a onClick={() => navigate("/")} className="txt2" style={{ cursor: "pointer" }}>
                Back to Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
