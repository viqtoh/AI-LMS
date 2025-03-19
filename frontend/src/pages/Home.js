import React from "react";
import "../styles/home.css"; // Make sure to create and import the corresponding CSS file
import { css } from "aphrodite";

const Home = () => {
  const handleLogin = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="limiter">
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
              <input className="input100" type="text" name="email" />
              <span className="focus-input100" data-placeholder="Email"></span>
            </div>

            <div className="wrap-input100 validate-input" data-validate="Enter password">
              <input className="input100" type="password" name="pass" />
              <span className="focus-input100" data-placeholder="Password"></span>
            </div>

            <div className="container-login100-form-btn">
              <button className="login100-form-btn" type="submit">
                Login
              </button>
            </div>

            <ul className="login-more">
              <li className="m-b-8">
                <span className="txt1">Forgot</span>
                <a href="#" className="txt2">
                  Password?
                </a>
              </li>

              <li>
                <span className="txt1">Don’t have an account?</span>
                <a href="/register" className="txt2">
                  Sign up
                </a>
              </li>
            </ul>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
