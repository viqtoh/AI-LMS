import React, { useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge } from "react-bootstrap";
import { API_URL } from "../constants";

const AssessmentHandler = ({ assessment }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`${API_URL}/api/assessment/module/${assessment.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();

      if (data.questions.length > 0) {
        setQuestions(data.questions);
        setActiveQuestion(data.questions[0]);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [questions, setQuestions] = React.useState([]);
  const [activeQuestion, setActiveQuestion] = React.useState(null);

  const setStatus = () => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => ({
        ...q,
        status: "not-visited"
      }))
    );
  };

  useEffect(() => {
    console.log(questions);
  }, [questions]);

  useEffect(() => {
    if (!isLoaded) {
      fetchAssessment().then(() => {
        setStatus();
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

  return (
    <div className="assessment-handler">
      <Container fluid className="p-4">
        <Row>
          <Col md={8}>
            <Card>
              {activeQuestion && <Card.Header>Question: {activeQuestion.id}</Card.Header>}
              <Card.Body>
                {activeQuestion && <Card.Text>{activeQuestion.question}</Card.Text>}
                <Form>
                  {activeQuestion &&
                    activeQuestion.answers.map((opt, idx) => (
                      <Form.Check
                        key={idx}
                        type="radio"
                        label={`${String.fromCharCode(65 + idx)}. ${opt.text}`}
                        name="option"
                        className="mb-2"
                      />
                    ))}
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Header>
                <strong>Questions</strong>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  {questions.map((q) => (
                    <Col xs={3} key={q.number}>
                      {q.id === activeQuestion.id ? (
                        <Button variant={"danger"} size="sm" className="w-100">
                          {q.id}
                        </Button>
                      ) : (
                        <Button
                          variant={getStatusColor(q.status)}
                          onClick={() => setActiveQuestion(q)}
                          size="sm"
                          className="w-100"
                        >
                          {q.id}
                        </Button>
                      )}
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AssessmentHandler;
