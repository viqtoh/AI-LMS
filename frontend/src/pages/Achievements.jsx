import React from "react";
import NavBar from "../components/NavBar";
import "../styles/home.css";
import { useState, useEffect } from "react";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import { faBookOpenReader, faRocket, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "react-router-dom";
import CourseRow from "../components/CourseRow";

const courses = [
  { title: "How to Avoid and Manage Conflict 1.0", attainedDate: "22/03/2025" },
  { title: "Productive Conflict Resolution - An Introduction 1.0", attainedDate: "22/03/2025" },
  { title: "First Aid - Secondary Survey 1.0", attainedDate: "27/01/2025" },
  { title: "Handling Conflicts in High-Value Relationships 1.0", attainedDate: "27/01/2025" },
  { title: "Modern Slavery 3.0 (UK)", attainedDate: "27/01/2025", compliantUntil: "27/01/2026" },
  { title: "Whistleblowing 3.0 (UK)", attainedDate: "26/01/2025", compliantUntil: "26/01/2026" },
  {
    title: "Sexual Harassment Prevention in the Workplace 2.0 (UK)",
    attainedDate: "26/01/2025",
    compliantUntil: "26/01/2026"
  },
  {
    title: "Listening Skills - Transform Your Customer Interactions 1.0",
    attainedDate: "26/01/2025"
  }
];

const Achievements = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [username, setUsername] = useState("");
  useEffect(() => {
    setImageUrl(localStorage.getItem("image"));
    setUsername(localStorage.getItem("first_name") + " " + localStorage.getItem("last_name"));
    console.log(imageUrl);
  }, []);

  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    console.log(isSuccess);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);
  return (
    <div>
      <div className="navHeader">
        <NavBar title="Achievements" />
      </div>
      <div className="main-body main-body5 main-body4">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="sub-body">
            <div className="archievementHeader">
              <div className="aheaderContent">
                <img src={`${IMAGE_HOST}${imageUrl}`} alt="user-image" className="aheaderImage" />

                <div className="AheaderContent">
                  <div className="headerTitle">
                    <div>
                      <span>{username}</span>
                    </div>

                    <div className="cardDiv">
                      <div className="aCard">
                        <FontAwesomeIcon icon={faRocket} className="aCardIcon" />
                        <div className="aCardText">
                          <p>Paths Completed</p>
                          <span>20</span>
                        </div>
                      </div>
                      <div className="aCard">
                        <FontAwesomeIcon icon={faBookOpenReader} className="aCardIcon" />
                        <div className="aCardText">
                          <p>Courses Completed</p>
                          <span>20</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mheaderContent">
                <div className="AheaderContent">
                  <div className="headerTitle">
                    <div className="mheadertitle">
                      {" "}
                      <img
                        src={`${IMAGE_HOST}${imageUrl}`}
                        alt="user-image"
                        className="mheaderImage"
                      />
                      <span>{username}</span>
                    </div>

                    <div className="cardDiv">
                      <div className="mCard">
                        <FontAwesomeIcon icon={faRocket} className="mCardIcon" />
                        <div className="mCardText">
                          <p>Paths Completed</p>
                          <span>20</span>
                        </div>
                      </div>
                      <div className="mCard">
                        <FontAwesomeIcon icon={faBookOpenReader} className="mCardIcon" />
                        <div className="mCardText">
                          <p>Courses Completed</p>
                          <span>20</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="achievementBody">
              <div className="achievementBodyContent">
                <div className="searchBar">
                  <div className="searchButton">
                    <FontAwesomeIcon icon={faSearch} id="searchIcon" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for an achievement..."
                    className="searchInput"
                  />
                </div>

                {courses.map((course, index) => (
                  <CourseRow key={index} {...course} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
