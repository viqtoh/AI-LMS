import React, { useState } from "react";
import "../styles/navbar.css";
import { API_URL, IMAGE_HOST } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBuilding,
  faFolderClosed,
  faFolderOpen
} from "@fortawesome/free-regular-svg-icons";
import { useEffect } from "react";
import {
  faCog,
  faAngleDown,
  faSignOutAlt,
  faTrophy,
  faHouseLock,
  faHouse,
  faSearch,
  faCar,
  faCarAlt,
  faCarSide,
  faBolt,
  faBoltLightning,
  faCrown,
  faUser,
  faBriefcase,
  faTag,
  faTags
} from "@fortawesome/free-solid-svg-icons";

const AdminNavBar = ({ title = "Dashboard", subTitle = "", context = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [uimage, setUimage] = useState("");
  const [isloaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const isAdmin = localStorage.getItem("isAdmin");
      console.log(isAdmin);
      if (isAdmin === "false") {
        window.location.href = "/admin";
        localStorage.setItem("error", "Login as an Admin");
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
            window.location.href = "/admin";
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
    window.location.href = "/admin";
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

        <div className="adminSidebarIcon">
          <div className="sidebarIcon">
            <img src="/images/ailms_icon.png" id="logoIcon" alt="AILMS" />
            <img src="/images/ai-lms.png" alt="AI-LMS" />
          </div>
          <p className="admin-badge">
            <FontAwesomeIcon icon={faCrown} className="admin-badge-noti" />
            Admin
          </p>
        </div>
        <ul>
          <li className={`${title === "Dashboard" ? "active" : ""}`}>
            <a href="/admin/dashboard" className="d-flex align-items-center">
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
          <li className={`${title === "Content Management" ? "active" : ""}`}>
            <a href="/admin/content-management">
              {title === "Content Management" ? (
                <FontAwesomeIcon icon={faFolderOpen} id="folderIcon" />
              ) : (
                <FontAwesomeIcon icon={faFolderClosed} />
              )}
              Content Management
            </a>
          </li>
          <li className={`${title === "Category Management" ? "active" : ""}`}>
            <a href="/admin/category-management" className="d-flex align-items-center">
              {title !== "Category Management" ? (
                <FontAwesomeIcon icon={faTag} />
              ) : (
                <div className="tagIconDiv">
                  <FontAwesomeIcon icon={faTag} id="tagIcon" />
                  <FontAwesomeIcon icon={faTag} id="tagIcon2" />
                  <FontAwesomeIcon icon={faCog} id="tagCogIcon" />
                </div>
              )}
              Category Management
            </a>
          </li>
          <li className={`${title === "User Management" ? "active" : ""}`}>
            <a href="/admin/user-management" className="d-flex align-items-center">
              {title !== "User Management" ? (
                <FontAwesomeIcon icon={faUser} />
              ) : (
                <div className="userIconDiv">
                  <FontAwesomeIcon icon={faUser} id="userIcon" />
                  <FontAwesomeIcon icon={faCog} id="userCogIcon" />
                </div>
              )}
              User Management
            </a>
          </li>

          {title !== "Staff Management" ? (
            <li>
              <a href="/admin/staff-management">
                <FontAwesomeIcon icon={faBriefcase} />
                Staff Management
              </a>
            </li>
          ) : (
            <li className="active">
              <a href="/admin/staff-management" className="d-flex align-items-center">
                <div className="staffIconDiv">
                  <FontAwesomeIcon icon={faBuilding} id="buildingIcon" />
                  <FontAwesomeIcon icon={faBriefcase} id="briefcaseIcon" />
                </div>
                Staff Management
              </a>
            </li>
          )}
          <li className={`${title === "Profile" ? "active" : ""}`}>
            <a href="/admin/account/settings" className="d-flex align-items-center">
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
        <div className="adminSidebarIcon">
          <div className="sidebarIcon">
            <img src="/images/ailms_icon.png" id="logoIcon" alt="AILMS" />
            <img src="/images/ai-lms.png" alt="AI-LMS" />
          </div>
          <p className="admin-badge">
            <FontAwesomeIcon icon={faCrown} className="admin-badge-noti" />
            Admin
          </p>
        </div>
        <ul>
          <li className={`${title === "Dashboard" ? "active" : ""}`}>
            <a href="/admin/dashboard" className="d-flex align-items-center">
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
          <li className={`${title === "Content Management" ? "active" : ""}`}>
            <a href="/admin/content-management">
              {title === "Content Management" ? (
                <FontAwesomeIcon icon={faFolderOpen} id="folderIcon" />
              ) : (
                <FontAwesomeIcon icon={faFolderClosed} />
              )}
              Content Management
            </a>
          </li>
          <li className={`${title === "Category Management" ? "active" : ""}`}>
            <a href="/admin/category-management" className="d-flex align-items-center">
              {title !== "Category Management" ? (
                <FontAwesomeIcon icon={faTag} />
              ) : (
                <div className="tagIconDiv">
                  <FontAwesomeIcon icon={faTag} id="tagIcon" />
                  <FontAwesomeIcon icon={faTag} id="tagIcon2" />
                  <FontAwesomeIcon icon={faCog} id="tagCogIcon" />
                </div>
              )}
              Category Management
            </a>
          </li>
          <li className={`${title === "User Management" ? "active" : ""}`}>
            <a href="/admin/user-management" className="d-flex align-items-center">
              {title !== "User Management" ? (
                <FontAwesomeIcon icon={faUser} />
              ) : (
                <div className="userIconDiv">
                  <FontAwesomeIcon icon={faUser} id="userIcon" />
                  <FontAwesomeIcon icon={faCog} id="userCogIcon" />
                </div>
              )}
              User Management
            </a>
          </li>

          {title !== "Staff Management" ? (
            <li>
              <a href="/admin/staff-management">
                <FontAwesomeIcon icon={faBriefcase} />
                Staff Management
              </a>
            </li>
          ) : (
            <li className="active">
              <a href="/admin/staff-management" className="d-flex align-items-center">
                <div className="staffIconDiv">
                  <FontAwesomeIcon icon={faBuilding} id="buildingIcon" />
                  <FontAwesomeIcon icon={faBriefcase} id="briefcaseIcon" />
                </div>
                Staff Management
              </a>
            </li>
          )}

          <li className={`${title === "Profile" ? "active" : ""}`}>
            <a href="/admin/account/settings" className="d-flex align-items-center">
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
            <a href="/admin/account/settings" className="d-flex text-decoration-none">
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
        <div className="navbar-title2">
          <h5>{context}</h5>
        </div>
      </div>
      {/* Overlay when Sidebar is Open */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default AdminNavBar;
