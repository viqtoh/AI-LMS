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
import Collapsible from "../components/Collapsible";

const LearnPath = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(false);

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
    console.log("The :id from useParams is:", id);
  }, [id]);

  const sections = [
    {
      title: "Introduction to React",
      percentage: 100,
      desc: "Learn the basics of React components and JSX.",
      score: 5
    },
    {
      title: "State Management",
      percentage: 100,
      desc: "Understanding useState and useEffect for managing state.",
      score: 7
    },
    {
      title: "React Routing",
      percentage: 10,
      desc: "Navigate between pages using React Router.",
      score: 2
    },
    {
      title: "Context API",
      isLocked: true,
      desc: "Use Context API for global state management.",
      score: 0
    },
    {
      title: "Redux Basics",
      isLocked: true,
      desc: "Manage complex state with Redux and reducers.",
      score: 0
    },
    {
      title: "Performance Optimization",
      isLocked: true,
      desc: "Improve performance using memoization and lazy loading.",
      score: 0
    },
    {
      title: "Testing React Apps",
      isLocked: true,
      desc: "Write tests using Jest and React Testing Library.",
      score: 0
    }
  ];

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
        ) : (
          <div className="sub-body">
            <div className="courseHeader">
              <div className="headerContent">
                <div className="headerImageCon">
                  <img src="/images/sample_image.png" alt="course-image" className="headerImage" />
                </div>

                <div className="headerContent">
                  <div className="headerTitle">
                    <div>
                      <span>Conflict Management package</span>
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
                      <span>All training audits conducted on the ARL Gateline Contract.</span>
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
                  <img src="/images/sample_image.png" alt="course-image" className="mheaderImage" />
                </div>

                <div className="mheaderContent">
                  <div className="mheaderTitle">
                    <div>
                      <span>Conflict Management package</span>
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
                      <span>All training audits conducted on the ARL Gateline Contract.</span>
                    </div>
                    <button className="btn continueBtn">
                      <span>Continue this learning path</span>
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
              {" "}
              {sections.map((section, index) => (
                <Collapsible key={index} {...section} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnPath;
