import React, { useState } from "react";
import "../styles/navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-regular-svg-icons";

import {
  faCog,
  faHouseChimneyWindow,
  faSpinner,
  faAngleDown,
  faRoute,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ title = "Dashboard" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setIsOpen(false)}>
          ×
        </button>
        <ul>
          <li className={`${title === "Dashboard" ? "active" : ""}`}>
            <a href="/dashboard">
              <FontAwesomeIcon icon={faHouseChimneyWindow} /> Dashboard
            </a>
          </li>
          <li className={`${title === "Course Journey" ? "active" : ""}`}>
            <a href="/content-library">
              <FontAwesomeIcon icon={faRoute} /> Course Journey
            </a>
          </li>
          <li className={`${title === "Certificates" ? "active" : ""}`}>
            <a href="/certificates">
              <FontAwesomeIcon icon={faSpinner} /> Progress & Certificates
            </a>
          </li>
          <li className={`${title === "Profile" ? "active" : ""}`}>
            <a href="/account/settings">
              <FontAwesomeIcon icon={faCog} /> Profile
            </a>
          </li>
          <li className="navlogout">
            <button onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </button>
          </li>
        </ul>
      </div>
      <div className={`desktop-sidebar`}>
        <ul>
          <li className={`${title === "Dashboard" ? "active" : ""}`}>
            <a href="/dashboard">
              <FontAwesomeIcon icon={faHouseChimneyWindow} /> Dashboard
            </a>
          </li>
          <li className={`${title === "Course Journey" ? "active" : ""}`}>
            <a href="/content-library">
              <FontAwesomeIcon icon={faRoute} /> Course Journey
            </a>
          </li>
          <li className={`${title === "Certificates" ? "active" : ""}`}>
            <a href="/certificates">
              <FontAwesomeIcon icon={faSpinner} /> Progress & Certificates
            </a>
          </li>
          <li className={`${title === "Profile" ? "active" : ""}`}>
            <a href="/account/settings">
              <FontAwesomeIcon icon={faCog} /> Profile
            </a>
          </li>
          <li className="navlogout">
            <a href="/">
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </a>
          </li>
        </ul>
      </div>
      <div class="preNav">
        <div className="NavBar">
          <div></div>
          <div className="nav-right">
            <a href="/" className="nav-noti">
              <FontAwesomeIcon icon={faBell} />
            </a>
            <div className="nav-divider">
              <span className="vertical-line"></span>
            </div>
            <span>Hi, John Kuy</span>
            <a href="/account/settings" className="nav-profile">
              <img src="https://i.pravatar.cc/150?img=1" alt="Profile" />
            </a>
            <FontAwesomeIcon icon={faAngleDown} />
          </div>
        </div>
        <div className="navbar-title">
          <h3>{title}</h3>
        </div>
      </div>
      {/* Overlay when Sidebar is Open */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default NavBar;
