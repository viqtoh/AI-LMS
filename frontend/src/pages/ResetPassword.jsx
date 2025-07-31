// src/pages/ResetPassword.js (create this file)
import React, { useState, useEffect } from "react";
import "../styles/home.css"; // Reuse existing styles
import { API_URL } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast2";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);
  const [toast, setToast] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState(null);

  const navigate = useNavigate();
  const location = useLocation(); // To get URL query parameters

  const showToast = (message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    setTimeout(() => setToast(null), 5000);
  };

  // Extract token from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      showToast("No reset token found in the URL. Please use the link from your email.", false);
      // Optionally redirect after a delay
      setTimeout(() => navigate("/forgot-password"), 3000);
    }
  }, [location.search, navigate]); // Depend on location.search to re-run if URL changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!token) {
      showToast("Missing password reset token.", false);
      setIsLoading(false);
      return;
    }

    if (!password || !confirmPassword) {
      showToast("Please enter and confirm your new password.", false);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", false);
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      // Basic password length validation
      showToast("Password must be at least 6 characters long.", false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(
          data.message || "Password has been reset successfully. You can now log in.",
          true
        );
        setPassword("");
        setConfirmPassword("");
        // Redirect to login page after successful reset
        setTimeout(() => navigate("/"), 2000);
      } else {
        showToast(
          data.error || "Failed to reset password. The link might be expired or invalid.",
          false
        );
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

            <span className="login100-form-title p-b-20 p-t-20">Set New Password</span>
            <p className="text-center m-b-20 text-muted">Enter your new password below.</p>

            <div className="wrap-input100 validate-input" data-validate="Enter new password">
              <input
                className="input100"
                type="password"
                name="password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>New Password</label>
            </div>

            <div className="wrap-input100 validate-input" data-validate="Confirm new password">
              <input
                className="input100"
                type="password"
                name="confirmPassword"
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <label>Confirm Password</label>
            </div>

            <div className="container-login100-form-btn">
              <button className="login100-form-btn" type="submit" disabled={isLoading || !token}>
                {isLoading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  "Reset Password"
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

export default ResetPassword;
