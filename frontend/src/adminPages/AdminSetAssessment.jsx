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
import QuestionEditor from "../components/QuestionEditor";

const AdminSetAssessment = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);

  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: "",
      answers: [
        { id: 1, text: "", correct: false },
        { id: 2, text: "", correct: false }
      ]
    },
    {
      id: 2,
      question: "",
      answers: [
        { id: 1, text: "", correct: false },
        { id: 2, text: "", correct: false }
      ]
    }
    // Add more questions if needed
  ]);

  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    console.log(isSuccess);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);

  const handleQuestionChange = (updatedQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)));
  };

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addNewQuestion = () => {
    const newId = Math.max(0, ...questions.map((q) => q.id)) + 1;
    setQuestions((prev) => [
      ...prev,
      {
        id: newId,
        question: "",
        answers: [
          { id: 1, text: "", correct: false },
          { id: 2, text: "", correct: false }
        ]
      }
    ]);
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
        console.log(data);
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
        <AdminNavBar title={`Set Assessment - `} />
      </div>
      <div className="main-body5 main-body main-body3 main-body4">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="sub-body">
            <div className="AssessmentCon">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  index={index + 1}
                  data={question}
                  onChange={handleQuestionChange}
                  onDelete={handleDeleteQuestion}
                />
              ))}

              <button className="btn btn-primary" onClick={addNewQuestion}>
                Add New Question
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSetAssessment;
