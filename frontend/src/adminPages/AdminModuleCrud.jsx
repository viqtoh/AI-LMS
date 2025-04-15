import React, { useState, useEffect, useRef } from "react";
import AdminNavBar from "../components/AdminNavBar";
import "../styles/home.css";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import { faSearch, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import Select from "react-select";
import { useParams } from "react-router-dom";
import RichTextEditor from "../components/Editor";

const AdminModuleCrud = () => {
  const token = localStorage.getItem("token");
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [cisCollapsed, setCisCollapsed] = useState(false);
  const [risCollapsed, setRisCollapsed] = useState(false);
  const [fisCollapsed, setFisCollapsed] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [course, setCourse] = useState(null);

  const [method, setMethod] = useState("");

  const customStyles = {
    container: (base) => ({
      ...base,
      width: "100%"
    }),
    control: (base) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: "#dfdfdf",
      color: "#000",
      borderRadius: "8px",
      fontSize: "12px",
      boxShadow: "none",
      height: "42px",
      width: "100%",

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

  const typeOptions = [
    { value: "pdf", label: "PDF" },
    { value: "video", label: "Video" },
    { value: "text", label: "Text" },
    { value: "ppt", label: "PPT" },
    { value: "docx", label: "DOCX" },
    { value: "assessment", label: "Assessment" }
  ];

  const uploadOptions = [
    { value: "", label: "Method of Upload" },
    { value: "link", label: "Link to Content" },
    { value: "file", label: "Upload File from local" }
  ];

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/course-full/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`, // If authentication is required
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch course");
        }
        const data = await response.json();
        setCourse(data);
        setSelectedCategories2(data.categories.map((category) => category.id));
      } catch (err) {
        showToast(err.message, false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id, token]);

  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    content_type: "",
    content_url: "",
    duration: "",
    file: "",
    html: "",
    assessment_id: "",
    is_published: true
  });

  const handleContentChange = (e) => {
    setModuleFormData((prevData) => ({
      ...prevData,
      content_type: e.value
    }));
  };

  const handleUploadOption = (e) => {
    setMethod(e.value);
  };

  const handleModuleChange = (e) => {
    console.log(e);
    const { name, value } = e.target;

    if (name === "is_published") {
      let val = false;
      if (e.target.checked) {
        val = true;
      }
      setModuleFormData((prevData) => ({
        ...prevData,
        [name]: val
      }));
    } else {
      setModuleFormData((prevData) => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
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
  const [selectedCategories2, setSelectedCategories2] = useState([]);

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

  const handleModuleSubmit = async (e) => {
    e.preventDefault();

    const formData = moduleFormData;

    try {
      const response = await fetch(`${API_URL}/api/admin/course`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || "Module to create course", false);
        return;
      }

      const result = await response.json();
      showToast("Module created successfully!", true);
      window.location.href = `/admin/content-library/course/${id}`;
    } catch (error) {
      console.error("Error creating COurse:", error);
      showToast("Internal Server Error", false);
    }
  };

  return (
    <div>
      <div className="navHeader">
        <AdminNavBar title="Content Management" subTitle="course/module/create" />
      </div>
      <div className="main-body5 main-body main-body3 main-body4">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="sub-body">
            <div className="tab-container h-100">
              <h2 className="tab-title">Create Module</h2>
              <div className="tab-content">
                <div className="course-tab">
                  <form id="courseForm" onSubmit={handleModuleSubmit}>
                    <div className="form-group">
                      <label htmlFor="course-title">Module Title</label>
                      <input
                        type="text"
                        id="course-title"
                        className="form-control"
                        name="title"
                        placeholder="Enter course title"
                        value={moduleFormData.title}
                        onChange={handleModuleChange}
                      />
                    </div>
                    <div className="row mx-0 w-100">
                      <div className="col-md-6 ps-0 pe-md-2 px-sm-0">
                        <div className="form-group">
                          <label htmlFor="show-outside">Module Type</label>
                          <Select
                            styles={customStyles}
                            options={typeOptions}
                            placeholder={"Select Type"}
                            onChange={handleContentChange}
                            name={"content_type"}
                          />
                        </div>
                      </div>
                      <div className="col-md-6 pe-0 ps-md-2 px-sm-0">
                        {moduleFormData.content_type === "video" ? (
                          <div className="form-group">
                            <label htmlFor="course-title">Method of Upload</label>
                            <Select
                              styles={customStyles}
                              options={uploadOptions}
                              placeholder={"Method of Upload"}
                              onChange={handleUploadOption}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="row mx-0 w-100">
                      <div className="col-md-6 ps-0 pe-md-2 px-sm-0">
                        {(moduleFormData.content_type &&
                          moduleFormData.content_type === "video" &&
                          method === "file") ||
                        (moduleFormData.content_type &&
                          moduleFormData.content_type !== "video" &&
                          moduleFormData.content_type !== "assessment" &&
                          moduleFormData.content_type !== "text") ? (
                          <div className="form-group">
                            <label htmlFor="show-outside">Upload File</label>
                            <Select
                              styles={customStyles}
                              options={typeOptions}
                              placeholder={"Select Type"}
                              onChange={handleContentChange}
                              name={"content_type"}
                            />
                          </div>
                        ) : moduleFormData.content_type &&
                          moduleFormData.content_type === "video" &&
                          method === "link" ? (
                          <div className="form-group">
                            <label htmlFor="show-outside">Link to File</label>
                            <Select
                              styles={customStyles}
                              options={typeOptions}
                              placeholder={"Select Type"}
                              onChange={handleContentChange}
                              name={"content_type"}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="w-100">
                      {moduleFormData.content_type === "text" ? <RichTextEditor /> : null}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cis_published">Publish</label>
                      <input
                        type="checkbox"
                        id="cis_published"
                        name="is_published"
                        className="form-check-input"
                        checked={moduleFormData.is_published}
                        onChange={handleModuleChange}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary">
                      Submit
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModuleCrud;
