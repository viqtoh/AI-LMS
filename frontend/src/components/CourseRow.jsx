import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-regular-svg-icons";
import { Badge, Row, Col } from "react-bootstrap";

const CourseRow = ({ title, attainedDate, compliantUntil }) => {
  return (
    <Row className="border-bottom py-2 align-items-center">
      {/* Course Title & Rating (Fixed Column) */}
      <Col md={6} xs={4}>
        <span className="fw-semibold text-dark achieventRowTitle">{title}</span>
      </Col>

      {/* Course Badge (Fixed Column) */}
      <Col xs={2} className="text-center">
        <Badge bg="success">Course</Badge>
      </Col>

      {/* Compliance Badge (Fixed Column) */}
      <Col xs={2} className="text-center">
        {compliantUntil ? (
          <span className="d-inline-block" style={{ width: "100px" }}></span> // Keeps space aligned
        ) : (
          <span className="d-inline-block" style={{ width: "100px" }}></span> // Keeps space aligned
        )}
      </Col>

      {/* Attained Date (Fixed Column) */}
      <Col md={2} xs={4} className="text-end text-muted small">
        Attained on {attainedDate}
      </Col>
    </Row>
  );
};

export default CourseRow;
