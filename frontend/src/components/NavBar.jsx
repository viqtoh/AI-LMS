import React, { useState } from "react";
import "../styles/navbar.css";
import { API_URL, IMAGE_HOST } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faFolderClosed, faFolderOpen } from "@fortawesome/free-regular-svg-icons";
import { useEffect } from "react";
import {
  faCog,
  faHouseChimneyWindow,
  faSpinner,
  faAngleDown,
  faRoute,
  faSignOutAlt,
  faTrophy,
  faBookSkull,
  faBook,
  faCogs,
  faHouseChimneyCrack,
  faHouseChimneyMedical,
  faHouseCircleCheck,
  faHouseDamage,
  faHouseLock,
  faHouseUser,
  faHouseTsunami,
  faHouse
} from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ title = "Dashboard", subTitle = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [uimage, setUimage] = useState("");
  const [isloaded, setIsLoaded] = useState(false);

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
          if (data.error === "Invalid token") {
            localStorage.setItem("error", "session expired");
            localStorage.removeItem("token");
            window.location.href = "/";
          } else {
            setFirstName(localStorage.getItem("first_name"));
            setLastName(localStorage.getItem("last_name"));
            setUimage(localStorage.getItem("uimage"));
          }
          throw new Error("Failed to fetch user details");
        }

        setFirstName(data.first_name);
        setLastName(data.last_name);
        setUimage(data.image);
        localStorage.setItem("uimage", data.uimage);
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
              {title === "Dashboard" ? (
                <FontAwesomeIcon icon={faHouse} id="homeIcon" />
              ) : (
                <FontAwesomeIcon icon={faHouseLock} />
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
            <a href="/account/settings">
              <FontAwesomeIcon icon={faCog} id={`${title === "Profile" ? "cogIcon" : ""}`} />
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
        <ul>
          <li className={`${title === "Dashboard" ? "active" : ""}`}>
            <a href="/dashboard">
              {title === "Dashboard" ? (
                <FontAwesomeIcon icon={faHouse} id="homeIcon" />
              ) : (
                <FontAwesomeIcon icon={faHouseLock} />
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
            <a href="/account/settings">
              <FontAwesomeIcon icon={faCog} id={`${title === "Profile" ? "cogIcon" : ""}`} />
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
          <div></div>
          <div className="nav-right">
            <a href="/" className="nav-noti">
              <FontAwesomeIcon icon={faBell} />
            </a>
            <div className="nav-divider">
              <span className="vertical-line"></span>
            </div>
            {firstName && lastName ? (
              <span>
                Hi, {firstName} {lastName}
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
            <FontAwesomeIcon icon={faAngleDown} />
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
