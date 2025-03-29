import React, { useState, useEffect } from "react";
import AdminNavBar from "../components/AdminNavBar";
import "../styles/home.css";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import { faSearch, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import Select from "react-select";

const CreateContent = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
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

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

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
        console.log(data);
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

  return (
    <div>
      <div className="navHeader">
        <AdminNavBar title="Content Management" subTitle="create" />
      </div>
      <div className="main-body5 main-body main-body3 main-body4">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="sub-body">
            <div className="tab-container">
              <div className="tab-header">
                <button
                  className={`tab-button1 tab-button ${!showFilter ? "active" : ""}`}
                  onClick={() => setShowFilter(false)}
                >
                  <span className="unshow-mobile">Create </span>Learning Path
                </button>
                <button
                  className={`tab-button2 tab-button ${showFilter ? "active" : ""}`}
                  onClick={() => setShowFilter(true)}
                >
                  <span className="unshow-mobile">Create </span>Course
                </button>
              </div>
              <div className="tab-content">
                {!showFilter ? (
                  <div className="learning-path-tab">
                    <form id="learningPathForm">
                      <div className="form-group">
                        <label htmlFor="image">Image</label>
                        <div className="uploadImageCon">
                          <div className="image-preview-container">
                            <img
                              src="/images/course_default.png"
                              alt="Preview"
                              id="image-preview"
                              className="image-preview"
                            />
                          </div>
                          <input
                            type="file"
                            id="image"
                            className="form-control"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const preview = document.getElementById("image-preview");
                                  preview.src = event.target.result;
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-theme"
                            onClick={() => document.getElementById("image").click()}
                          >
                            Upload Image
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input
                          type="text"
                          id="title"
                          className="form-control"
                          placeholder="Enter title"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                          id="description"
                          className="form-control"
                          placeholder="Enter description"
                        ></textarea>
                      </div>
                      <div className="form-group">
                        <label htmlFor="difficulty">Difficulty</label>
                        <select id="difficulty" className="form-control">
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <Select
                          isMulti
                          isSearchable
                          value={categories
                            .filter((category) => selectedCategories.includes(category.id))
                            .map((category) => ({
                              value: category.id,
                              label: category.name
                            }))}
                          onChange={(selectedOptions) =>
                            setSelectedCategories(selectedOptions.map((option) => option.value))
                          }
                          options={categories.map((category) => ({
                            value: category.id,
                            label: category.name
                          }))}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          styles={{ container: (base) => ({ ...base, width: "100%" }) }}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="estimated_time">Estimated Time</label>
                        <input
                          type="text"
                          id="estimated_time"
                          className="form-control"
                          placeholder="Enter estimated time"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="is_published">Publish</label>
                        <input type="checkbox" id="is_published" className="form-check-input" />
                      </div>
                      <button type="submit" className="btn btn-primary">
                        Submit
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="course-tab">
                    <form id="courseForm">
                      <div className="form-group">
                        <label htmlFor="course-title">Course Title</label>
                        <input
                          type="text"
                          id="course-title"
                          className="form-control"
                          placeholder="Enter course title"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="course-description">Course Description</label>
                        <textarea
                          id="course-description"
                          className="form-control"
                          placeholder="Enter course description"
                        ></textarea>
                      </div>
                      <div className="form-group">
                        <label htmlFor="show-outside">Show Outside</label>
                        <input type="checkbox" id="show-outside" className="form-check-input" />
                      </div>

                      <button type="submit" className="btn btn-primary">
                        Submit
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateContent;
