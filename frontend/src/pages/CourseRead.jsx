import React, { useRef } from "react";
import "../styles/read.css";
import { useState, useEffect } from "react";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import { faAngleDown, faAngleUp, faList, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import DocRenderer from "../components/DocRenderer";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import "@videojs/themes/dist/city/index.css";

// Fantasy
import "@videojs/themes/dist/fantasy/index.css";

// Forest
import "@videojs/themes/dist/forest/index.css";

// Sea
import "@videojs/themes/dist/sea/index.css";

const CourseRead = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);

  const [coursesState, setCoursesState] = useState([]);
  const [learningPath, setLearningPath] = useState(null);

  const [activeCourse, setActiveCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(null);

  const descriptionRef = useRef();

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { id, pathId } = useParams();
  const navigate = useNavigate();
  const lastTimeRef = useRef(0);

  const location = useLocation();

  useEffect(() => {
    if (videoRef.current && activeModule && activeModule.content_type === "video") {
      const timeoutId = setTimeout(() => {
        if (videoRef.current) {
          if (playerRef.current) {
            playerRef.current.dispose();
          }

          playerRef.current = videojs(videoRef.current, {
            controls: true,
            autoplay: false,
            preload: "auto",
            userActions: {
              hotkeys: false,
              doubleClick: false,
              click: false
            },
            sources: [
              {
                src: `${activeModule.file ? `${IMAGE_HOST}${activeModule.file}` : activeModule.content_url}`,
                type: "video/mp4"
              }
            ]
          });

          const player = playerRef.current;

          player.ready(function () {
            const pipButton = player.controlBar.getChild("PictureInPictureToggle");
            if (pipButton) {
              player.controlBar.removeChild(pipButton);
            }
          });

          player.on("seeking", function () {
            if (player.currentTime() > lastTimeRef.current + 0.01) {
              player.currentTime(lastTimeRef.current);
            }
          });

          player.on("timeupdate", function () {
            lastTimeRef.current = player.currentTime();
          });

          playerRef.current.ready(() => {
            const controlBar = playerRef.current.controlBar;
            if (controlBar?.progressControl) {
              controlBar.progressControl.disable();
              const progressEl = controlBar.progressControl.el();
              if (progressEl) {
                progressEl.style.pointerEvents = "none";
              }
            }
          });
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [activeModule]);

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
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const moduleId = params.get("module");

    if (moduleId) {
      let foundModule = null;

      for (const course of courses) {
        const match = course.modules.find((m) => m.id === parseInt(moduleId));

        if (match) {
          foundModule = match;
          setActiveCourse(course);
          break;
        }
      }

      if (foundModule) {
        setActiveModule(foundModule);
      }
    }
  }, [location.search, courses]);

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
  }, [id, token, pathId, showToast]);

  const activateModule = (module) => {
    setActiveModule(module);
    navigate(`?module=${module.id}`);
  };

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
                {!activeModule && activeCourse && (
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
                          <div
                            className="activeIntroModule"
                            key={`momdule-${module.title}`}
                            onClick={() => activateModule(module)}
                          >
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

                {activeModule &&
                  activeCourse &&
                  activeModule.content_type !== "video" &&
                  activeModule.content_type !== "assessment" && (
                    <DocRenderer url={`${API_URL}${activeModule.file}`} />
                  )}

                {activeModule && activeModule.content_type === "video" ? (
                  <div className="d-flex justify-content-center align-items-center h-100 w-100 bg-dark">
                    <div data-vjs-player>
                      <video
                        className="video-js vjs-theme-fantasy"
                        ref={videoRef}
                        controls
                        disablePictureInPicture
                        controlsList="noplaybackrate nodownload nofullscreen noremoteplayback"
                      />
                    </div>
                  </div>
                ) : null}
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
