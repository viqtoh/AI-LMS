import React, { useState } from "react";
import "../styles/navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faHouseChimneyWindow, faSpinner, faRoute } from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ title = "Dashboard" }) => {
  const [isOpen, setIsOpen] = useState(false);

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
          <li className={`${title == "Dashboard" ? "active" : ""}`}>
            <a href="/dashboard">
              <FontAwesomeIcon icon={faHouseChimneyWindow} /> Home
            </a>
          </li>
          <li className={`${title == "Course Journey" ? "active" : ""}`}>
            <a href="/content-library">
              <FontAwesomeIcon icon={faRoute} /> Course Journey
            </a>
          </li>
          <li className={`${title == "Certificates" ? "active" : ""}`}>
            <a href="/certificates">
              <FontAwesomeIcon icon={faSpinner} /> Progress & Certificates
            </a>
          </li>
          <li className={`${title == "Profile" ? "active" : ""}`}>
            <a href="/account/settings">
              <FontAwesomeIcon icon={faCog} /> Profile
            </a>
          </li>
        </ul>
      </div>
      <div className={`desktop-sidebar`}>
        <ul>
          <li className={`${title == "Dashboard" ? "active" : ""}`}>
            <a href="/dashboard">
              <FontAwesomeIcon icon={faHouseChimneyWindow} /> Home
            </a>
          </li>
          <li className={`${title == "Course Journey" ? "active" : ""}`}>
            <a href="/content-library">
              <FontAwesomeIcon icon={faRoute} /> Course Journey
            </a>
          </li>
          <li className={`${title == "Certificates" ? "active" : ""}`}>
            <a href="/certificates">
              <FontAwesomeIcon icon={faSpinner} /> Progress & Certificates
            </a>
          </li>
          <li className={`${title == "Profile" ? "active" : ""}`}>
            <a href="/account/settings">
              <FontAwesomeIcon icon={faCog} /> Profile
            </a>
          </li>
        </ul>
      </div>
      {/* Overlay when Sidebar is Open */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default NavBar;
