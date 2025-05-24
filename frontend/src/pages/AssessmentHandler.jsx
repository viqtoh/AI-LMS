import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  ListGroup,
  Badge,
  Spinner,
  Modal
} from "react-bootstrap";
import { API_URL } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaArrowRight } from "react-icons/fa";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

const AssessmentHandler = ({ iniAssessment }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [resume, setResume] = useState(false);
  const [restart, setRestart] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [assessmentAttemptId, setAssessmentAttemptId] = useState(null);
  const [percent, setPercent] = useState(0);
  const [timerColor, setTimerColor] = useState("#10b981");
  const [assessment, setAssessment] = useState(iniAssessment);

  const checkAssessment = async () => {
    console.log(iniAssessment);
    try {
      const response = await fetch(`${API_URL}/api/assessment-attempt/check/${iniAssessment.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();
      setAssessment((prevData) => ({ ...prevData, duration: data.duration }));
      console.log("loaded");

      if (data.exists) {
        if (data.hasTimeLeft) {
          setResume(true);
          setAssessmentAttemptId(data.assessmentAttemptId);
          let perc = (data.timeRemaining / (data.duration * 60)) * 100;
          setPercent(perc);
          const end = new Date(Date.now() + data.timeRemaining * 1000);
          setEndTime(end);
          const minutes = Math.floor(data.timeRemaining / 60)
            .toString()
            .padStart(2, "0");
          const seconds = (data.timeRemaining % 60).toString().padStart(2, "0");
          setTimeLeft(`${minutes}:${seconds}`);
        } else {
          setRestart(true);
        }
      }

      console.log("checked");
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(assessment);
  }, [assessment]);

  useEffect(() => {
    if (!endTime) return;

    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));

      if (diff === 0) {
        clearInterval(timer);
        setIsTimeUp(true);
      }

      const newTime = new Date(diff * 1000).toISOString().substr(14, 5);
      setTimeLeft(newTime);

      if (diff < 300) {
        setTimerColor("#f87171");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const [started, setStarted] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);

  const handleStart = async () => {
    setIsLoading2(true);
    try {
      let response;
      if (resume) {
        response = await fetch(`${API_URL}/api/assessment-attempt/resume`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ assessmentAttemptId: assessmentAttemptId })
        });
      } else {
        response = await fetch(`${API_URL}/api/assessment-attempt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ assessmentId: assessment.id })
        });
      }
      const data = await response.json();
      setAssessment((prevData) => ({ ...prevData, duration: data.duration }));

      if (data.questions.length > 0) {
        setQuestions(data.questions);
        setActiveIndex(0);
        setStarted(true);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsLoading2(false);
    }
  };

  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeQuestion = questions[activeIndex];

  const setStatus = () => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => ({
        ...q,
        status: "not-visited"
      }))
    );
  };

  const handleOptionChange = (option, question) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === question.id
          ? {
              ...q,
              answers: q.answers.map((ans) =>
                ans.id === option.id ? { ...ans, selected: true } : { ...ans, selected: false }
              )
            }
          : q
      )
    );
    setAnswer(option.id);
  };

  const handleMultiOptionChange = (option, question) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === question.id
          ? {
              ...q,
              answers: q.answers.map((ans) =>
                ans.id === option.id ? { ...ans, selected: !ans.selected } : { ...ans }
              )
            }
          : q
      )
    );
    setAnswer(option.id, !option.selected);
  };

  const endAssessment = async () => {
    setIsEnded(true);
    setStarted(false);
    try {
      let response = await fetch(`${API_URL}/api/assessment-attempt/end-assessment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          assessmentAttemptId: assessmentAttemptId
        })
      });

      const data = await response.json();
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    if (timeLeft === "00:00") {
      endAssessment();
    }
  }, [timeLeft]);

  const setAnswer = async (answer, remove = false) => {
    try {
      let response;
      response = await fetch(`${API_URL}/api/assessment-attempt/setanswer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          assessmentAttemptId: assessmentAttemptId,
          answerId: answer,
          remove: remove
        })
      });

      const data = await response.json();
      console.log("Answer set:", data);

      if (data.questions.length > 0) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsLoading2(false);
    }
  };

  useEffect(() => {
    console.log(questions);
  }, [questions]);

  useEffect(() => {
    if (!isLoaded) {
      checkAssessment().then(() => {
        //setStatus();
      });
      setIsLoaded(true);
    }
  }, [isLoaded, questions]);

  const getStatusColor = (status) => {
    switch (status) {
      case "answered":
        return "primary";
      case "current":
        return "danger";
      case "not-visited":
        return "unvisited";
      default:
        return "secondary";
    }
  };

  // Modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  return (
    <div className="assessment-handler">
      {assessment &&
        (!started ? (
          <div
            style={{
              position: "relative",
              textAlign: "center",
              backgroundImage: `url("/images/test_start_banner.png")`,
              backgroundSize: "cover",
              height: "100%",
              width: "100%"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "white",
                textShadow: "2px 2px 4px rgba(0, 0, 0, 1)"
              }}
              className="testdesc"
            >
              <h1>{assessment.title}</h1>
              <p className="mb-5">{assessment.description}</p>
              <p>Duration: {assessment.duration}mins </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleStart()}
                disabled={isLoading2}
              >
                {isLoading2 ? (
                  <Spinner animation="border" />
                ) : resume ? (
                  "Resume Test"
                ) : restart || isEnded ? (
                  "Restart Test"
                ) : (
                  "Start Test"
                )}
              </Button>
              {resume && !isEnded && <p className="timeLeft">Time left: {timeLeft}</p>}
            </div>
          </div>
        ) : (
          <Container fluid className="p-4 fullQuestionBody">
            <Row style={{ height: "100%" }}>
              <Col md={8} style={{ height: "100%" }}>
                <Card style={{ height: "100%" }}>
                  {activeQuestion && (
                    <Card.Header>
                      Question: {questions.findIndex((q) => q.id === activeQuestion.id) + 1}
                    </Card.Header>
                  )}
                  <Card.Body className="questionCard">
                    <div className="questionCon">
                      <div className="questionBody">
                        {activeQuestion && (
                          <Card.Text className="questionText">{activeQuestion.question}</Card.Text>
                        )}
                      </div>
                      <div className="questionOptions">
                        <Form>
                          {activeQuestion && !activeQuestion.isMulti
                            ? activeQuestion.answers.map((opt, idx) => (
                                <Form.Check
                                  key={idx}
                                  type="radio"
                                  label={`${String.fromCharCode(65 + idx)}. ${opt.text}`}
                                  name="option"
                                  className="mb-2 optionText"
                                  id={`option-${activeQuestion.id}-${opt.id}`}
                                  checked={opt.selected}
                                  onChange={() => handleOptionChange(opt, activeQuestion)}
                                />
                              ))
                            : activeQuestion.answers.map((opt, idx) => (
                                <Form.Check
                                  key={idx}
                                  type="checkbox"
                                  label={`${String.fromCharCode(65 + idx)}. ${opt.text}`}
                                  name="option"
                                  className="mb-2 optionText"
                                  id={`option-${activeQuestion.id}-${opt.id}`}
                                  checked={opt.selected}
                                  onChange={() => handleMultiOptionChange(opt, activeQuestion)}
                                />
                              ))}
                        </Form>
                        <button className="optionsBtn">
                          Next <FontAwesomeIcon icon={faArrowRight} size="md" className="pt-1" />
                        </button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="mb-5 d-flex justify-content-center align-items-center p-4">
                  <div className="position-relative" style={{ width: "96px", height: "96px" }}>
                    <svg
                      className="position-absolute top-0 start-0 w-100 h-100"
                      viewBox="0 0 96 96"
                      style={{ transform: "rotate(-90deg)" }}
                    >
                      <circle cx="48" cy="48" r="42" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke={timerColor}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="264"
                        strokeDashoffset={264 - (percent / 100) * 264}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="position-absolute top-50 start-50 translate-middle fw-bold text-dark">
                      {timeLeft}
                    </div>
                  </div>
                </Card>

                <Card>
                  <Card.Header>
                    <strong>Questions</strong>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-2">
                      {questions.map((q, index) => (
                        <Col xs={3} key={q.number}>
                          {q.id === activeQuestion.id ? (
                            <Button variant={"danger"} size="sm" className="w-100">
                              {index + 1}
                            </Button>
                          ) : (
                            <Button
                              variant={getStatusColor(q.status)}
                              onClick={() => setActiveIndex(index)}
                              size="sm"
                              className="w-100"
                            >
                              {index + 1}
                            </Button>
                          )}
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="mb-5 d-flex justify-content-center align-items-center p-4 mt-5">
                  <button className="btn btn-danger px-4" onClick={() => setShowSubmitModal(true)}>
                    Submit
                  </button>
                </Card>
              </Col>
            </Row>
            {/* Modal */}
            <Modal
              show={showSubmitModal}
              onHide={() => setShowSubmitModal(false)}
              centered
              container={document.body}
            >
              <Modal.Header closeButton>
                <Modal.Title>Submit Assessment</Modal.Title>
              </Modal.Header>
              <Modal.Body className="">
                Are you sure you want to submit your answers? You won't be able to change them after
                submission.
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowSubmitModal(false);
                    endAssessment();
                  }}
                >
                  Submit
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        ))}
    </div>
  );
};

export default AssessmentHandler;
