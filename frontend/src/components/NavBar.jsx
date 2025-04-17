import React, { useState } from "react";
import "../styles/navbar.css";
import { API_URL, IMAGE_HOST } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faFolderClosed, faFolderOpen } from "@fortawesome/free-regular-svg-icons";
import { useEffect } from "react";
import {
  faCog,
  faSignOutAlt,
  faTrophy,
  faHouse,
  faSearch,
  faCarSide,
  faBoltLightning
} from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ title = "Dashboard", subTitle = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [uimage, setUimage] = useState("");
  const [isloaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const isAdmin = localStorage.getItem("isAdmin");
      if (isAdmin === "true") {
        window.location.href = `/?next=${window.location.pathname}`;
        localStorage.setItem("error", "Login as a User");
        localStorage.removeItem("token");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/user/details`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await response.json();

        if (data.error) {
          if (data.error === "Invalid token") {
            localStorage.setItem("error", "session expired");
            localStorage.removeItem("token");
            window.location.href = `/?next=${window.location.pathname}`;
          } else if (data.error === "User not found" || data.error === "Account Disabled") {
            localStorage.setItem("error", data.error);
            localStorage.removeItem("token");
            window.location.href = `/?next=${window.location.pathname}`;
          } else {
            setFirstName(localStorage.getItem("first_name"));
            setLastName(localStorage.getItem("last_name"));
            setUimage(localStorage.getItem("image"));
          }
          throw new Error("Failed to fetch user details");
        }

        setFirstName(data.first_name);
        setLastName(data.last_name);
        setUimage(data.image);
        localStorage.setItem("image", data.image);
        localStorage.setItem("first_name", data.first_name);
        localStorage.setItem("last_name", data.last_name);
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
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

        <div className="sidebarIcon">
          <img src="/images/ailms_icon.png" id="logoIcon" alt="AILMS" />
          <img src="/images/ai-lms.png" alt="AI-LMS" />
        </div>
        <ul>
          <li className={`${title === "Dashboard" ? "active" : ""}`}>
            <a href="/dashboard" className="d-flex align-items-center">
              {title === "Dashboard" ? (
                <div className="homeIconDiv">
                  <FontAwesomeIcon icon={faHouse} id="homeIcon" />
                  <FontAwesomeIcon icon={faCarSide} id="carIcon" />
                </div>
              ) : (
                <FontAwesomeIcon icon={faHouse} />
              )}
              Dashboard
            </a>
          </li>
          <li className={`${title === "Content Library" ? "active" : ""}`}>
            <a href="/content-library">
              {title === "Content Library" ? (
                <FontAwesomeIcon icon={faFolderOpen} id="folderIcon" />
              ) : (
                <FontAwesomeIcon icon={faFolderClosed} />
              )}
              Content Library
            </a>
          </li>
          <li className={`${title === "Achievements" ? "active" : ""}`}>
            <a href="/achievements">
              <FontAwesomeIcon
                icon={faTrophy}
                className="mtrophy"
                id={`${title === "Achievements" ? "trophyIcon" : ""}`}
              />
              Achievements
            </a>
          </li>
          <li className={`${title === "Profile" ? "active" : ""}`}>
            <a href="/account/settings" className="d-flex align-items-center">
              {title === "Profile" ? (
                <div className="cogIconDiv">
                  <div className="lighteningDiv">
                    <FontAwesomeIcon icon={faBoltLightning} id="lightIcon1" />
                    <FontAwesomeIcon icon={faBoltLightning} id="lightIcon2" />
                    <FontAwesomeIcon icon={faBoltLightning} id="lightIcon3" />
                    <FontAwesomeIcon icon={faBoltLightning} id="lightIcon4" />
                  </div>
                  <FontAwesomeIcon icon={faCog} id="cogIcon" />
                </div>
              ) : (
                <FontAwesomeIcon icon={faCog} />
              )}
              Profile
            </a>
          </li>
          <li className="navlogout">
            <button onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} id="logoutIcon" /> <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
      <div className={`desktop-sidebar`}>
        <div className="sidebarIcon">
          <img src="/images/ailms_icon.png" id="logoIcon" alt="AILMS" />
          <img src="/images/ai-lms.png" alt="AI-LMS" />
        </div>
        <ul>
          <li className={`${title === "Dashboard" ? "active" : ""}`}>
            <a href="/dashboard" className="d-flex align-items-center">
              {title === "Dashboard" ? (
                <div className="homeIconDiv">
                  <FontAwesomeIcon icon={faHouse} id="homeIcon" />
                  <FontAwesomeIcon icon={faCarSide} id="carIcon" />
                </div>
              ) : (
                <FontAwesomeIcon icon={faHouse} />
              )}
              Dashboard
            </a>
          </li>
          <li className={`${title === "Content Library" ? "active" : ""}`}>
            <a href="/content-library">
              {title === "Content Library" ? (
                <FontAwesomeIcon icon={faFolderOpen} id="folderIcon" />
              ) : (
                <FontAwesomeIcon icon={faFolderClosed} />
              )}
              Content Library
            </a>
          </li>
          <li className={`${title === "Achievements" ? "active" : ""}`}>
            <a href="/achievements">
              <FontAwesomeIcon
                icon={faTrophy}
                id={`${title === "Achievements" ? "trophyIcon" : ""}`}
              />{" "}
              Achievements
            </a>
          </li>
          <li className={`${title === "Profile" ? "active" : ""}`}>
            <a href="/account/settings" className="d-flex align-items-center">
              {title === "Profile" ? (
                <div className="cogIconDiv">
                  <div className="lighteningDiv">
                    <FontAwesomeIcon icon={faBoltLightning} id="lightIcon1" />
                    <FontAwesomeIcon icon={faBoltLightning} id="lightIcon2" />
                    <FontAwesomeIcon icon={faBoltLightning} id="lightIcon3" />
                    <FontAwesomeIcon icon={faBoltLightning} id="lightIcon4" />
                  </div>
                  <FontAwesomeIcon icon={faCog} id="cogIcon" />
                </div>
              ) : (
                <FontAwesomeIcon icon={faCog} />
              )}
              Profile
            </a>
          </li>
          <li className="navlogout">
            <button onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} id="logoutIcon" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
      <div className="preNav">
        <div className="NavBar">
          <div className="nav-left">
            <div className="nav-search-bar">
              <FontAwesomeIcon icon={faSearch} id="navBarIcon" />
              <input type="text" placeholder="Search..." className="search-input" />
            </div>
          </div>
          <div className="nav-right">
            <a href="/" className="nav-noti">
              <FontAwesomeIcon icon={faBell} />
            </a>
            <div className="nav-divider">
              <span className="vertical-line"></span>
            </div>
            <a href="/account/settings" className="d-flex text-decoration-none align-items-center">
              {firstName && lastName ? (
                <span>
                  Hi, {firstName} <span className="nameForTab">{lastName}</span>
                </span>
              ) : null}

              {uimage ? (
                <div className="profileImage mx-2 s-35">
                  <img src={`${IMAGE_HOST}${uimage}`} className="s-35" alt="Profile" />
                </div>
              ) : isloaded ? (
                <div className="profileImage mx-2 s-35">
                  <img src="/images/default_profile.png" className="s-35" alt="Profile" />
                </div>
              ) : null}
            </a>
          </div>
        </div>
        <div className="navbar-title">
          <h3>{title}</h3> {subTitle !== "" ? <h5>/{subTitle}</h5> : null}
        </div>
      </div>
      {/* Overlay when Sidebar is Open */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default NavBar;
