import React, { useRef } from "react";
import "../styles/read.css";
import { useState, useEffect } from "react";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import { faAngleDown, faAngleUp, faList, faStar, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "react-router-dom";

const CourseRead = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    console.log(isSuccess);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);

  const [coursesState, setCoursesState] = useState([]);
  const [learningPath, setLearningPath] = useState(null);

  const [activeCourse, setActiveCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(null);

  const descriptionRef = useRef();

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
          let preurl;
          const isAdmin = localStorage.getItem("isAdmin");
          if (isAdmin === "true") {
            preurl = "/admin";
          } else {
            preurl = "/";
          }
          if (data.error === "Invalid token") {
            localStorage.setItem("error", "session expired");
            localStorage.removeItem("token");
            window.location.href = `${preurl}?next=${window.location.pathname}`;
          } else if (data.error === "User not found" || data.error === "Account Disabled") {
            localStorage.setItem("error", data.error);
            localStorage.removeItem("token");
            window.location.href = `${preurl}?next=${window.location.pathname}`;
          }
          throw new Error("Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchUserDetails();
  }, []);

  const { id, pathId } = useParams();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        let response;
        let mode;
        if (id) {
          response = await fetch(`${API_URL}/api/course-full/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`, // If authentication is required
              "Content-Type": "application/json"
            }
          });
          mode = "course";
        } else {
          response = await fetch(`${API_URL}/api/learning-path-full/${pathId}`, {
            headers: {
              Authorization: `Bearer ${token}`, // If authentication is required
              "Content-Type": "application/json"
            }
          });
          mode = "path";
        }

        if (!response.ok) {
          throw new Error("Failed to fetch object");
        }
        const data = await response.json();
        let datas;
        if (mode === "course") {
          setCourses([data]);
          setActiveCourse(data);
          datas = [data];
        } else {
          setCourses(data.courses);
          setActiveCourse(data.courses[0]);
          datas = data.courses;
          setLearningPath(data);
        }

        for (let index = 0; index < datas.length; index++) {
          setCoursesState((prevData) => ({
            ...prevData,
            [datas[index].id]: true
          }));
        }
      } catch (err) {
        showToast(err.message, false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id, token]);

  const toggleCourse = (courseId) => {
    setCoursesState((prevState) => ({
      ...prevState,
      [courseId]: !prevState[courseId] // Toggle the state for the specific course by its id
    }));
    console.log(coursesState);
  };

  return (
    <div>
      <div>
        {/* Top Navbar */}
        <nav className="navbar navbar-dark bg-dark">
          <div className="container-fluid">
            <div className="readLearnPath headerRead">
              <button
                className={`btn btn-outline-light hamburger2  ${sidebarOpen ? "" : "hamburgerclosed"}`}
                onClick={toggleSidebar}
              >
                &#9776;
              </button>
              {learningPath && <p>{learningPath.title}</p>}
            </div>
          </div>
        </nav>
        <div className="readerHouse">
          {" "}
          {/* Sidebar */}
          <div className={`sidebar2 ${sidebarOpen ? "open" : ""}`}>
            <button
              className={`btn  hamburger3  ${sidebarOpen ? "" : "hamburgerclosed"}`}
              onClick={toggleSidebar}
            >
              <FontAwesomeIcon icon={faTimes} color="#fff" />
            </button>
            <span className="menu">menu</span>
            {learningPath && (
              <div className="readLearnPath">
                <span>{learningPath.title}</span>
              </div>
            )}
            {courses &&
              courses.map(
                (course, index) =>
                  course.modules.length > 0 && (
                    <div
                      key={course.title}
                      className={`sideCourse ${learningPath && "learnPresent"}`}
                    >
                      <div className="sideCourseSub">
                        <div className="d-flex gap-2 w-100 align-items-center">
                          <button onClick={() => toggleCourse(course.id)} className="text-white">
                            <FontAwesomeIcon
                              icon={coursesState[course.title] ? faAngleUp : faAngleDown}
                            />
                          </button>
                          <p>{course.title}</p>
                        </div>
                      </div>

                      {/* Only show the modules if the state is true */}

                      <div className="sideModules">
                        {course.modules.map((module) => (
                          <div
                            key={module.updatedAt}
                            className={`sideModule ${coursesState[course.id] ? "" : "h-0"}`}
                          >
                            <span>{module.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
          </div>
          <div className="" id="mainReader">
            {toast && (
              <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />
            )}
            {isLoading ? (
              <div className="loader-container">
                <div className="loader"></div>
              </div>
            ) : courses !== null ? (
              <div className="readerBody">
                {activeCourse && (
                  <div>
                    <div className="activeCourseBanner">
                      <img src="/images/default_course_banner.png" />
                      <div className="activeCourseTitle">
                        <h1>{activeCourse.title}</h1>
                        <div className="activeCourseButtons">
                          <button>START COURSE</button>
                          <span
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              descriptionRef.current?.scrollIntoView({ behavior: "smooth" })
                            }
                          >
                            Details <FontAwesomeIcon icon={faAngleDown} />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="activeCourseBody">
                      <div className="activeCourseDescription" ref={descriptionRef}>
                        <span>{activeCourse.description}</span>
                      </div>
                      <div className="activeCourseMenu">
                        <p>Module Menu</p>
                      </div>
                      <div className="activeCourseModules">
                        {activeCourse.modules.map((module) => (
                          <div className="activeIntroModule">
                            <div>
                              <FontAwesomeIcon icon={faList} />
                              <span>{module.title}</span>
                            </div>

                            <div className="activeModuleCircle"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="noObjects">Object not Found!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseRead;
