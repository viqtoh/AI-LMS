import React from "react";
import "../styles/home.css";
import { useState, useEffect } from "react";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import { faAngleDown, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "react-router-dom";
import Collapsible from "../components/Collapsible";
import AdminNavBar from "../components/AdminNavBar";
import Select from "react-select";

const AdminLearnPath = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoading2, setIsLoading2] = useState(false);

  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);
  const [learningPath, setLearningPath] = useState(null);

  const { id } = useParams();

  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/learning-path-full/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`, // If authentication is required
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch learning path");
        }
        const data = await response.json();
        console.log(data);
        setLearningPath(data);
      } catch (err) {
        showToast(err.message, false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLearningPath();
  }, [id, token]); // Refetch when id or token changes

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    title: "",
    description: "",
    image: "",
    show_outside: false,
    is_published: false
  });
  const [selectedCategories2, setSelectedCategories2] = useState([]);
  const [categories, setCategories] = useState([]);

  const handleCourseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value
    }));
  };

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
        setCategories(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        showToast("Failed to load categories", false);
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [token, showToast]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading2(true);
    const formData = courseFormData;
    formData["categoryIds"] = JSON.stringify(selectedCategories2);
    formData["learningPathId"] = id;

    try {
      const response = await fetch(`${API_URL}/api/admin/learningpath/course/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || "Failed to create learning path", false);
        return;
      }

      const result = await response.json();
      showToast("Learning path created successfully!", true);
      setIsModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error creating COurse:", error);
      showToast("Internal Server Error", false);
    } finally {
      setIsLoading2(false);
    }
  };

  return (
    <div>
      <div className="navHeader">
        <AdminNavBar title="Content Library" subTitle="Learning Path" />
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
                      <span>Edit learning path</span>
                    </button>
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
                      <span>Edit learning path</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="courseBody">
              <div className="courseBodyHeader">
                <button className="btn btn-theme" onClick={() => setIsModalOpen(true)}>
                  Create Course
                </button>
              </div>

              {learningPath.courses.length === 0 ? (
                <div className="noObjects noObjects100 mt-4">No Course Added Yet!</div>
              ) : (
                learningPath.courses.map((section, index) => (
                  <Collapsible key={index} {...section} />
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="noObjects">Learning Path not Found!</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <form id="courseForm mt-1" onSubmit={handleFormSubmit}>
              <div className="mheader">
                <span>Create Course</span>
              </div>
              <div className="form-group">
                <label htmlFor="image">Image</label>
                <div className="uploadImageCon row">
                  <div className="image-preview-container">
                    <img
                      src={courseFormData.image || "/images/course_default.png"}
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
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearnPath;
