import React from "react";
import "../styles/home.css";
import { useState, useEffect } from "react";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import { faAngleDown, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "react-router-dom";
import { ModuleCollapsible } from "../components/AdminCollapsible";
import AdminNavBar from "../components/AdminNavBar";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

const AdminCourse = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const [deleteModuleId, setDeleteModuleId] = useState(0);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);

  const navigate = useNavigate();

  const [courseFormData, setCourseFormData] = useState({
    title: "",
    description: "",
    image: null,
    show_outside: false,
    is_published: false
  });
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategories2, setSelectedCategories2] = useState([]);

  const { id } = useParams();

  // --- NEW STATES FOR FEEDBACK ---
  const [feedbackData, setFeedbackData] = useState({
    feedback: [], // Array to hold the fetched feedback items
    totalItems: 0,
    currentPage: 1,
    totalPages: 1
  });
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackLimit, setFeedbackLimit] = useState(5); // Default limit per page for feedback
  // --- END NEW STATES ---

  const deleteCourse = async () => {
    try {
      setIsLoading2(true);
      const response = await fetch(`${API_URL}/api/admin/course/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }
      showToast("Course deleted successfully", true);
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setIsLoading2(false);
      setIsDeleteModalOpen(false);
      navigate("/admin/content-management");
    }
  };

  const deleteModule = async () => {
    try {
      setIsLoading2(true);
      const response = await fetch(`${API_URL}/api/admin/module/${deleteModuleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete module");
      }
      showToast("Module deleted successfully", true);
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setIsLoading2(false);
      setDeleteModuleId(0);
      await fetchCourse();
    }
  };

  const fetchCourse = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/course-full/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch course");
      }
      const data = await response.json();
      setCourse(data);
      setModules(data.modules);
      setCourseFormData({
        title: data.title,
        description: data.description,
        image: data.image,
        show_outside: data.show_outside,
        is_published: data.is_published
      });
      setSelectedCategories2(data.categories.map((category) => category.id));
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchCourse();
  }, [id, token]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/category`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        if (data.error) {
          showToast(data.error, false);
        }
        if (data.message) {
          showToast(data.message, true);
        }
        setCategories(data);
        setIsLoading(false);
      } catch (error) {
        showToast("Failed to load categories", false);
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [token, showToast]);

  // --- NEW EFFECT HOOK FOR FETCHING FEEDBACK ---
  useEffect(() => {
    const fetchFeedbackForCourse = async () => {
      if (!id || !token) return; // Ensure id and token are available

      try {
        // Use "course" as the type to target courseId in the backend
        const feedbackType = "course";
        const response = await fetch(
          `${API_URL}/api/admin/feedback/${id}/${feedbackType}/${feedbackLimit}/${feedbackPage}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch feedback for course");
        }

        const data = await response.json();
        setFeedbackData(data); // Assuming data structure: { totalItems, currentPage, totalPages, feedback: [...] }
      } catch (err) {
        console.error("Error fetching course feedback:", err);
        showToast(`Error fetching course feedback: ${err.message}`, false);
      }
    };

    fetchFeedbackForCourse();
  }, [id, token, feedbackPage, feedbackLimit, showToast]); // Re-fetch when id, token, page, or limit changes
  // --- END NEW EFFECT HOOK ---

  const handleCourseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const moveUp = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/course/${course.id}/move-up/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.error) {
        showToast(data.error, false);
      }
      if (data.message) {
        showToast(data.message, true);
      }
      setIsLoading(false);
      fetchCourse();
    } catch (error) {
      showToast("Failed to move module", false);
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading2(true);
    const formData = courseFormData;
    formData["categoryIds"] = JSON.stringify(selectedCategories2);
    // Remove learningPathId, as it's not relevant for updating a course directly
    // formData["learningPathId"] = id; // This line should be removed or handled differently for course updates

    try {
      const response = await fetch(`${API_URL}/api/admin/course/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || "Failed to update course", false); // Changed message
        return;
      }

      const result = await response.json();
      showToast("Course updated successfully!", true);
      setCourse((prevData) => ({ ...prevData, ...result.course }));
      setIsModalOpen(false);
    } catch (error) {
      showToast("Internal Server Error", false);
    } finally {
      setIsLoading2(false);
    }
  };

  return (
    <div>
      <div className="navHeader">
        <AdminNavBar title="Content Library" subTitle="Course" />
      </div>
      <div className="main-body main-body5 main-body4">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : course !== null ? (
          <div className="sub-body">
            <div className="courseHeader">
              <div className="headerContent">
                {course.image ? (
                  <div className="headerImageCon">
                    <img
                      src={`${IMAGE_HOST}${course.image}`}
                      alt="course-image"
                      className="headerImage"
                    />
                  </div>
                ) : null}

                <div className="headerContent">
                  <div className="headerTitle">
                    <div>
                      <span>{course.title}</span>
                    </div>

                    <div className="headerDesc">
                      <span>{course.description}</span>
                    </div>
                    <div className="middle-flex gap-2">
                      <button
                        className="btn continueBtn"
                        onClick={() => {
                          navigate(`/admin/content-management/course/${course.id}/read`);
                        }}
                      >
                        <span>Preview Course</span>
                      </button>
                      <button className="btn continueBtn" onClick={() => setIsModalOpen(true)}>
                        <span>Edit course</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mobileCourseHeader">
              <div className="mheaderContent">
                {course.image ? (
                  <div className="mheaderImageCon">
                    <img
                      src={`${IMAGE_HOST}${course.image}`}
                      alt="course-image"
                      className="mheaderImage"
                    />
                  </div>
                ) : null}

                <div className="mheaderContent">
                  <div className="mheaderTitle">
                    <div>
                      <span>{course.title}</span>
                    </div>

                    <div className="headerDesc">
                      <span>{course.description}</span>
                    </div>
                    <div className="middle-flex gap-2">
                      <button
                        className="btn continueBtn"
                        onClick={() => {
                          navigate(`/admin/content-management/course/${course.id}/read`);
                        }}
                      >
                        <span>Preview Course</span>
                      </button>
                      <button className="btn continueBtn" onClick={() => setIsModalOpen(true)}>
                        <span>Edit course</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="courseBody">
              {!course ? (
                <div className="noObjects noObjects100 mt-4">Course not found</div>
              ) : (
                <div className="adminCourseBody w-100">
                  <div className="topHCourse w-100 justify-content-between flex-wrap mb-5">
                    <div className="green-noti-con">
                      <div className="green-noti"></div>
                      <p>
                        This course is linked to {course.learningPaths.length}{" "}
                        {course.learningPaths.length === 1 ? "learning path" : "learning paths"}.
                      </p>
                      <button>
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>

                    <div className="d-flex gap-2">
                      <button className="btn btn-danger" onClick={() => setIsDeleteModalOpen(true)}>
                        {" "}
                        Delete Course
                      </button>
                      <a
                        onClick={() =>
                          navigate(`/admin/content-management/course/${course.id}/module/create`)
                        }
                        href="#"
                      >
                        <button className="btn btn-theme"> Add Module</button>
                      </a>
                    </div>
                  </div>
                  <div className="text-center w-100 d-flex flex-column justify-content-center align-items-center">
                    {modules.map((module) => (
                      <ModuleCollapsible
                        key={module.id} // Added key prop for list rendering
                        {...module}
                        onMoveUp={moveUp}
                        onDelete={setDeleteModuleId}
                      />
                    ))}

                    {modules.length === 0 && (
                      <div className="noObjects noObjects100 mt-4">
                        There are no Modules in this Course yet.
                      </div>
                    )}
                  </div>

                  {/* --- NEW SECTION FOR DISPLAYING FEEDBACK --- */}
                  <div className="mt-5 collapsible mx-auto noncol">
                    <h3>Feedback for this Course ({feedbackData.totalItems} total)</h3>
                    {feedbackData.feedback.length === 0 ? (
                      <div className="noObjects mt-2">No feedback available for this course.</div>
                    ) : (
                      <div>
                        {feedbackData.feedback.map((feedbackItem) => (
                          <div key={feedbackItem.id} className="card p-3 my-2">
                            <p>
                              <strong>Comment:</strong>{" "}
                              {feedbackItem.text || "No comment provided."}
                            </p>
                            <small>
                              <div className="d-flex gap-1 align-items-center">
                                {feedbackItem.User.image ? (
                                  <div className="profileImage mx-2 s-35">
                                    <img
                                      src={`${IMAGE_HOST}${feedbackItem.User.image}`}
                                      className="s-35"
                                      alt="Profile"
                                    />
                                  </div>
                                ) : (
                                  <div className="profileImage mx-2 s-35">
                                    <img
                                      src="/images/default_profile.png"
                                      className="s-35"
                                      alt="Profile"
                                    />
                                  </div>
                                )}
                                {feedbackItem.User.first_name} {feedbackItem.User.last_name}
                                <br />
                                Created: {new Date(feedbackItem.createdAt).toLocaleDateString()}
                              </div>{" "}
                            </small>
                            {/* You might want to display user info (if included in the backend response) */}
                            {/* <small>By: {feedbackItem.User ? feedbackItem.User.username : 'Anonymous'}</small> */}
                          </div>
                        ))}
                        {/* Basic Pagination Controls */}
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setFeedbackPage((prev) => Math.max(1, prev - 1))}
                            disabled={feedbackPage === 1}
                          >
                            Previous
                          </button>
                          <span>
                            Page {feedbackPage} of {feedbackData.totalPages}
                          </span>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() =>
                              setFeedbackPage((prev) => Math.min(feedbackData.totalPages, prev + 1))
                            }
                            disabled={feedbackPage === feedbackData.totalPages}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* --- END NEW SECTION --- */}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="noObjects">Course not Found!</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <form id="courseForm mt-1" onSubmit={handleFormSubmit}>
              <div className="mheader">
                <span>Edit Course</span>
              </div>
              <div className="form-group">
                <label htmlFor="image">Image</label>
                <div className="uploadImageCon row">
                  <div className="image-preview-container">
                    <img
                      src={`${IMAGE_HOST}${courseFormData.image}` || "/images/course_default.png"}
                      alt="Preview"
                      id="Cimage-preview"
                      className="image-preview"
                    />
                  </div>
                  <input
                    type="file"
                    id="Cimage"
                    name="image"
                    className="form-control"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setCourseFormData((prevData) => ({
                            ...prevData,
                            image: event.target.result
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-theme mt-2"
                    onClick={() => document.getElementById("Cimage").click()}
                  >
                    Upload Image
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="course-title">Course Title</label>
                <input
                  type="text"
                  id="course-title"
                  className="form-control"
                  name="title"
                  placeholder="Enter course title"
                  value={courseFormData.title}
                  onChange={handleCourseChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="course-description">Course Description</label>
                <textarea
                  id="course-description"
                  className="form-control"
                  placeholder="Enter course description"
                  name="description"
                  value={courseFormData.description}
                  onChange={handleCourseChange}
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="course-category">Category</label>
                <Select
                  isMulti
                  isSearchable
                  value={categories
                    .filter((category) => selectedCategories2.includes(category.id))
                    .map((category) => ({
                      value: category.id,
                      label: category.name
                    }))}
                  onChange={(selectedOptions) =>
                    setSelectedCategories2(selectedOptions.map((option) => option.value))
                  }
                  options={categories.map((category) => ({
                    value: category.id,
                    label: category.name
                  }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  id="course-category"
                  styles={{ container: (base) => ({ ...base, width: "100%" }) }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="show-outside">Show Outside</label>
                <input
                  type="checkbox"
                  id="show-outside"
                  name="show_outside"
                  className="form-check-input"
                  checked={courseFormData.show_outside}
                  onChange={handleCourseChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cis_published">Publish</label>
                <input
                  type="checkbox"
                  id="cis_published"
                  name="is_published"
                  className="form-check-input"
                  checked={courseFormData.is_published}
                  onChange={handleCourseChange}
                />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn btn-theme">
                  {isLoading2 ? (
                    <div className="spinner-border text-light btnspinner" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    "Submit"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                  }}
                  disabled={isLoading2}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="mheader mheaderred">
              <h3>Delete Course</h3>
            </div>

            <div className="modal-body text-center">
              <h4>Are you sure you want to delete this Course?</h4>
              <span>Note: this will also delete all modules within the course</span>
            </div>

            <div className="modal-buttons">
              <button
                type="button"
                className="btn btn-secondary px-5"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                }}
                disabled={isLoading2}
              >
                No
              </button>
              <button className="btn btn-danger px-5" onClick={deleteCourse}>
                {isLoading2 ? (
                  <div className="spinner-border text-light btnspinner" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  "Yes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModuleId !== 0 && (
        <div className="modal">
          <div className="modal-content">
            <div className="mheader mheaderred">
              <h3>Delete Module</h3>
            </div>

            <div className="modal-body text-center">
              <h4>
                Are you sure you want to delete Module:{" "}
                {modules.find((module) => module.id === deleteModuleId)?.title}?
                {/* Added optional chaining (?) in case module is not found */}
              </h4>
            </div>

            <div className="modal-buttons">
              <button
                type="button"
                className="btn btn-secondary px-5"
                onClick={() => {
                  setDeleteModuleId(0);
                }}
                disabled={isLoading2}
              >
                No
              </button>
              <button className="btn btn-danger px-5" onClick={deleteModule}>
                {isLoading2 ? (
                  <div className="spinner-border text-light btnspinner" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  "Yes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourse;
