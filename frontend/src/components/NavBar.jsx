import React, { useState } from "react";
import "../styles/navbar.css";
import { API_URL, IMAGE_HOST } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { useEffect } from "react";
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
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/details`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await response.json();

        if (data.error) {
          throw new Error("Failed to fetch user details");
        }
        console.log(data);

        setUserData(data);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

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
            <span>
              Hi, {userData.first_name} {userData.last_name}
            </span>
            {userData && userData.image ? (
              <div className="profileImage mx-2 s-35">
                <img
                  src={`${IMAGE_HOST}${userData.image}`}
                  className="s-35"
                  id="editimage"
                  alt="Profile"
                />
              </div>
            ) : (
              <div className="profileImage mx-2 s-35">
                <img
                  src="/images/default_profile.png"
                  className="s-35"
                  id="editimage"
                  alt="Profile"
                />
              </div>
            )}
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
