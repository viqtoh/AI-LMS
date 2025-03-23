import React from "react";
import NavBar from "../components/NavBar";
import "../styles/home.css";
import { useState, useEffect } from "react";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import {
  faStar,
  faRotateLeft,
  faSearch,
  faAngleDown,
  faAngleUp
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import Select from "react-select";

const Library = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(false);
  const [cisCollapsed, setCisCollapsed] = useState(false);
  const [risCollapsed, setRisCollapsed] = useState(false);
  const [fisCollapsed, setFisCollapsed] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    console.log(isSuccess);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);
  const extendDescriptions = (courses) => {
    return courses.map((course) => ({
      ...course,
      description: `${course.description} This course provides in-depth knowledge and practical examples to help you master the subject effectively.`
    }));
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: "#dfdfdf",
      color: "#000",
      borderRadius: "8px",
      height: "3px",
      fontSize: "12px",
      boxShadow: "none",

      "&:hover": { borderColor: "#8c8c8c", backgroundColor: "#eaeaea" }
    }),
    singleValue: (base) => ({
      ...base,
      color: "#333"
    }),
    placeholder: (base) => ({
      ...base,
      color: "#333"
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? "#4a90e2" : isFocused ? "#cce4ff" : "white",
      color: isSelected ? "white" : "#333",
      padding: "5px",
      cursor: "pointer"
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      boxShadow: "0px 4px 6px rgba(0,0,0,0.1)"
    }),
    indicatorSeparator: () => ({
      display: "none"
    }),

    // Optional: Style the dropdown arrow container if needed
    indicatorsContainer: (base) => ({
      ...base,
      padding: "0px",
      color: "#333",
      height: "28px",
      width: "24px"
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: "8px 4px 0px 0px" // Adjust this value
    })
  };

  const sortOptions = [
    { value: "a-z", label: "Title A-Z" },
    { value: "z-a", label: "Title Z-A" }
  ];

  const handleChange = (selectedOption) => {
    console.log("Selected:", selectedOption);
  };

  const getRandomCourse = () => {
    const courses = extendDescriptions([
      {
        title: "Introduction to React",
        description:
          "Learn the basics of React, a popular JavaScript library for building user interfaces.",
        type: "Course"
      },
      {
        title: "Advanced JavaScript",
        description: "Deep dive into advanced JavaScript concepts and patterns.",
        type: "Course"
      },
      {
        title: "Web Development Bootcamp",
        description: "A comprehensive guide to becoming a full-stack web developer.",
        type: "Learning Path"
      },
      {
        title: "UI/UX Design Principles",
        description: "Master the principles of user interface and user experience design.",
        type: "Course"
      },
      {
        title: "Data Structures and Algorithms",
        description:
          "Understand the fundamentals of data structures and algorithms for coding interviews.",
        type: "Learning Path"
      }
    ]);
    return courses[Math.floor(Math.random() * courses.length)];
  };

  return (
    <div>
      <div className="navHeader">
        <NavBar title="Content Library" />
      </div>
      <div className="main-body2 main-body main-body3">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div
            className="sub-body"
            onScroll={(e) => {
              const button = document.querySelector(".returnUp");
              if (e.target.scrollTop > 500) {
                button.style.opacity = "1";
                button.style.visibility = "visible";
              } else {
                button.style.opacity = "0";
                button.style.visibility = "hidden";
              }
            }}
          >
            <button
              className="btn returnUp"
              onClick={() => {
                const subBody = document.querySelector(".sub-body");
                if (subBody) {
                  subBody.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <FontAwesomeIcon icon={faAngleUp} />
            </button>
            <div className="searchContainer">
              <div className="searchBarContainer">
                <FontAwesomeIcon icon={faSearch} />
                <input
                  type="text"
                  className="searchBar"
                  placeholder="Search content by title or description"
                  onChange={(e) => console.log(e.target.value)}
                />
              </div>

              <div className="sortContainer">
                <button className="btn btn-reset">
                  <FontAwesomeIcon icon={faRotateLeft} />
                  <span className="ms-1">Reset Filters</span>
                </button>
                <Select
                  styles={customStyles}
                  options={sortOptions}
                  placeholder={"Sort: Default"}
                  onChange={handleChange}
                />

                <button
                  className="btn btn-reset showFilterBtn"
                  onClick={() => setShowFilter(!showFilter)}
                >
                  <span className="ms-1">Show Filters</span>
                </button>
              </div>
            </div>
            <div className="desktopSeperator">
              <div className="desktopFilterMain" style={showFilter ? { display: "block" } : {}}>
                <div
                  className="filterSeperator"
                  style={!cisCollapsed ? { maxHeight: "300px" } : {}}
                >
                  <div>
                    <div
                      className="header d-flex justify-content-between"
                      onClick={() => setCisCollapsed(!cisCollapsed)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <h5 className="filterHeading">Content Type</h5>
                      <FontAwesomeIcon
                        icon={cisCollapsed ? faAngleDown : faAngleUp}
                        style={{ marginLeft: "8px" }}
                      />
                    </div>

                    <ul className="collapsed-list nobar">
                      <li>
                        <input type="checkbox" />
                        <span>Learning Paths</span>
                      </li>
                      <li>
                        <input type="checkbox" />
                        <span>Courses</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  className="filterSeperator"
                  style={!risCollapsed ? { maxHeight: "300px" } : {}}
                >
                  <div>
                    <div
                      className="header d-flex justify-content-between"
                      onClick={() => setRisCollapsed(!risCollapsed)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <h5 className="filterHeading">Ratings</h5>
                      <FontAwesomeIcon
                        icon={risCollapsed ? faAngleDown : faAngleUp}
                        style={{ marginLeft: "8px" }}
                      />
                    </div>

                    <ul className="collapsed-list nobar">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <li key={rating}>
                          <input type="checkbox" />
                          <span>
                            {[...Array(5)].map((_, index) => (
                              <FontAwesomeIcon
                                key={index}
                                icon={faStar}
                                style={{
                                  color: index < rating ? "#555" : "#d3d3d3",
                                  marginRight: "4px"
                                }}
                              />
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div
                  className="filterSeperator"
                  style={!fisCollapsed ? { maxHeight: "300px" } : {}}
                >
                  <div>
                    <div
                      className="header d-flex justify-content-between"
                      onClick={() => setFisCollapsed(!fisCollapsed)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <h5 className="filterHeading">Favorites</h5>
                      <FontAwesomeIcon
                        icon={fisCollapsed ? faAngleDown : faAngleUp}
                        style={{ marginLeft: "8px" }}
                      />
                    </div>

                    <ul className="collapsed-list nobar">
                      <li>
                        <input type="radio" name="favorites" value="yes" />
                        <span>Yes</span>
                      </li>
                      <li>
                        <input type="radio" name="favorites" value="no" />
                        <span>No</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="searchBody greyScroll">
                {[...Array(10)].map((_, index) => (
                  <div className="searchResult" key={index}>
                    <div className="sContentHeader2">
                      <FontAwesomeIcon icon={faHeart} />
                    </div>
                    <div className="searchImage">
                      <img
                        src="images/course_default.png"
                        className="courseDefault"
                        alt="Profile"
                      />
                    </div>
                    <div className="searchContent">
                      <div className="sContentHeader">
                        <FontAwesomeIcon icon={faHeart} />
                      </div>
                      <div className="searchBadge">
                        <span className="badge course-badge">{getRandomCourse().type}</span>
                      </div>
                      <div className="searchTitle">
                        <span>{getRandomCourse().title}</span>
                      </div>
                      <div className="searchDesc">
                        <span>{getRandomCourse().description}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
