import React from "react";
import NavBar from "../components/NavBar";
import "../styles/home.css";
import { useState, useEffect } from "react";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import { faAngleDown, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "react-router-dom";
import { CourseCollapsible } from "../components/Collapsible";

const LearnPath = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
  const [learningPath, setLearningPath] = useState(null);

  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    console.log(isSuccess);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);

  const { id } = useParams();
  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        const response = await fetch(`${API_URL}/api/learning-path-full/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`, // If authentication is required
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch learning path");
        }
        const data = await response.json();
        setLearningPath(data);
      } catch (err) {
        showToast(err.message, false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLearningPath();
  }, [id, token]); // Refetch when id or token changes

  return (
    <div>
      <div className="navHeader">
        <NavBar title="Content Library" subTitle="Learning Path" />
      </div>
      <div className="main-body main-body5 main-body4">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : learningPath !== null ? (
          <div className="sub-body">
            <div className="courseHeader">
              <div className="headerContent">
                <div className="headerImageCon">
                  <img
                    src={
                      learningPath.image != null
                        ? `${IMAGE_HOST}${learningPath.image}`
                        : "/images/sample_image.png"
                    }
                    alt="course-image"
                    className="headerImage"
                  />
                </div>

                <div className="headerContent">
                  <div className="headerTitle">
                    <div>
                      <span>{learningPath.title}</span>
                      <div className="starDiv">
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#FFCC00",
                            marginRight: "4px"
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#FFCC00",
                            marginRight: "4px"
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#FFCC00",
                            marginRight: "4px"
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#ccc",
                            marginRight: "4px"
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#ccc",
                            marginRight: "4px"
                          }}
                        />{" "}
                        <span>(35)</span>
                        <FontAwesomeIcon
                          icon={faAngleDown}
                          style={{
                            color: "#fff",
                            marginRight: "4px"
                          }}
                        />
                      </div>
                    </div>

                    <div className="headerDesc">
                      <span>{learningPath.description}</span>
                    </div>
                    <button className="btn continueBtn">
                      <span>Continue this learning path</span>
                    </button>
                  </div>

                  <div className="circleProgress">
                    <svg width="150" height="150" viewBox="0 0 150 150">
                      <circle cx="75" cy="75" r="67.5" stroke="#444" strokeWidth="10" fill="none" />
                      <circle
                        cx="75"
                        cy="75"
                        r="67.5"
                        stroke="#4ccf50"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray="424.1" // Circumference of the circle (2 * π * r)
                        strokeDashoffset="106.025" // 75% progress (25% remaining)
                        transform="rotate(-90 75 75)"
                      />
                      <text x="75" y="80" textAnchor="middle" fontSize="16" fill="#fff">
                        75%
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="mobileCourseHeader">
              <div className="mheaderContent">
                <div className="mheaderImageCon">
                  <img
                    src={
                      learningPath.image != null
                        ? `${IMAGE_HOST}${learningPath.image}`
                        : "/images/sample_image.png"
                    }
                    alt="course-image"
                    className="mheaderImage"
                  />
                </div>

                <div className="mheaderContent">
                  <div className="mheaderTitle">
                    <div>
                      <span>{learningPath.title}</span>
                      <div className="starDiv">
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#FFCC00",
                            marginRight: "4px"
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#FFCC00",
                            marginRight: "4px"
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#FFCC00",
                            marginRight: "4px"
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#ccc",
                            marginRight: "4px"
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faStar}
                          style={{
                            color: "#ccc",
                            marginRight: "4px"
                          }}
                        />{" "}
                        <span>(35)</span>
                        <FontAwesomeIcon
                          icon={faAngleDown}
                          style={{
                            color: "#fff",
                            marginRight: "4px"
                          }}
                        />
                      </div>
                    </div>

                    <div className="headerDesc">
                      <span>{learningPath.description}</span>
                    </div>
                    <button className="btn continueBtn">
                      <span>COntinue this learning path</span>
                    </button>
                  </div>

                  <div className="mcircleProgress">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="17.5" stroke="#ddd" strokeWidth="5" fill="none" />
                      <circle
                        cx="20"
                        cy="20"
                        r="17.5"
                        stroke="#4ccf50"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray="109.95"
                        strokeDashoffset={109.95 - 109.95 * 0.75} // 75% progress (25% remaining)
                        transform="rotate(-90 20 20)"
                      />
                      <text x="20" y="22.5" textAnchor="middle" fontSize="8" fill="#fff">
                        75%
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="courseBody">
              {!learningPath ? (
                <div className="noObjects noObjects100 mt-4">Learning path not found</div>
              ) : learningPath.courses.length === 0 ? (
                <div className="noObjects noObjects100 mt-4">No Courses here</div>
              ) : (
                learningPath.courses.map((section, index) => (
                  <CourseCollapsible key={index} {...section} />
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="noObjects">Learning Path not Found!</div>
        )}
      </div>
    </div>
  );
};

export default LearnPath;
