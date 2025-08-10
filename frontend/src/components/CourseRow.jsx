import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-regular-svg-icons"; // Keep if used elsewhere, not needed for this solution
import { Badge, Row, Col } from "react-bootstrap";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

const CourseRow = ({ title, attained_on, index, type, userFirstName, userLastName }) => {
  // Helper to format ISO date string to DD/MM/YYYY
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [generating, setGenerating] = React.useState(false);

  const downloadCertificate = async () => {
    setGenerating(true);
    // 1. Create a temporary div element to construct the certificate HTML
    const certDiv = document.createElement("div");
    certDiv.className = "certificate-template-wrapper"; // A wrapper for hiding purposes
    certDiv.id = `temp-certificate-${index}`; // Unique ID for each certificate for robustness

    // Define the theme color and verification URL
    const themeColor = "#0057ff";
    // IMPORTANT: Replace with your actual verification URL. Example:
    const verificationBaseUrl = "https://your-domain.com/verify-certificate/";

    certDiv.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        
        .certificate-container {
          font-family: 'Merriweather', serif;
          padding: 40px 60px;
          width: 1123px;
          height: 794px;
          box-sizing: border-box;
          background-color: #ffffff;
          color: #333;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .certificate-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("/images/ailms_icon.png");
          background-repeat: no-repeat;
          background-position: center center;
          background-size: 55%;
          opacity: 0.12;
          filter: blur(5px);
          z-index: 0;
        }

        .certificate-content-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 900px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
        }

        .certificate-header {
          margin-bottom: 25px; /* Reduced margin */
        }

        .certificate-logo {
          max-width: 110px; /* Slightly smaller header logo */
          height: auto;
          margin-bottom: 18px; /* Slightly less margin */
        }

        .certificate-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.6em; /* Slightly smaller */
          font-weight: 700;
          color: ${themeColor};
          letter-spacing: 2px;
          text-transform: uppercase;
          border-bottom: 4px solid ${themeColor};
          padding-bottom: 12px; /* Reduced padding */
          margin-bottom: 20px; /* Reduced margin */
          line-height: 1.2;
        }

        .certificate-body-text {
          font-size: 1.6em; /* Slightly smaller */
          margin-top: 5px;
          margin-bottom: 5px;
          line-height: 1.4; /* Slightly tighter line height */
        }

        .certificate-user-name {
          font-family: 'Playfair Display', serif;
          font-size: 3.2em; /* Slightly smaller */
          font-weight: 700;
          color: ${themeColor};
          margin-top: 10px; /* Reduced margin */
          margin-bottom: 20px; /* Reduced margin */
          padding-bottom: 8px; /* Reduced padding */
          border-bottom: 1px dashed #aaa;
          line-height: 1.2;
        }

        .certificate-course-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.5em; /* Slightly smaller */
          font-weight: 700;
          color: ${themeColor};
          margin-top: 15px;
          margin-bottom: 18px; /* Reduced margin */
        }

        .certificate-completion-date {
          font-size: 1.5em; /* Slightly smaller */
          font-style: italic;
          color: #555;
          margin-top: 20px;
          margin-bottom: 30px; /* Significantly reduced margin to give space for footer */
        }

        /* NEW FOOTER STYLES */
        .new-certificate-footer {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          padding-top: 20px; /* Slightly reduced padding */
          padding-bottom: 10px; /* Slightly reduced padding */
          border-top: 1px solid #e0e0e0;
          margin-top: auto;
          color: #666;
          font-size: 0.95em; /* Slightly smaller overall footer font size */
        }

        .footer-ailms-logo {
          max-width: 70px; /* Smaller footer logo */
          height: auto;
          margin-bottom: 12px; /* Reduced margin */
          opacity: 0.8;
        }

        .footer-verify-text {
          font-size: 1em; /* Adjusted to new base */
          margin-bottom: 6px; /* Reduced margin */
          color: #444;
        }
        .footer-link {
          color: ${themeColor};
          text-decoration: none;
          font-weight: 600;
        }

        .footer-issued-date {
          font-size: 0.9em; /* Adjusted to new base */
          margin-bottom: 4px; /* Reduced margin */
          color: #777;
        }

        .footer-tagline {
          font-size: 0.85em; /* Adjusted to new base */
          font-style: italic;
          color: #888;
          margin-top: 8px; /* Reduced margin */
        }

        .certificate-template-wrapper {
            position: absolute;
            left: -9999px;
            top: -9999px;
            z-index: -1;
            width: 0;
            height: 0;
            overflow: hidden;
        }
      </style>
      <div class="certificate-container">
        <div class="certificate-content-inner">
          <div class="certificate-header">
              <img src="/images/ailms_icon.png" alt="AILMS Logo" class="certificate-logo" />
              <h3 class="certificate-title">CERTIFICATE OF COMPLETION</h3>
          </div>
          <p class="certificate-body-text">This is to certify that</p>
          <p class="certificate-user-name">${userFirstName} ${userLastName}</p>
          <p class="certificate-body-text">has successfully completed the course</p>
          <p class="certificate-course-title">"${title}"</p>
          <p class="certificate-body-text">on</p>
          <p class="certificate-completion-date">${formatDate(attained_on)}</p>
        </div>
        
        <!-- New Footer HTML -->
        <div class="new-certificate-footer">
            <p class="footer-issued-date">Issued on ${formatDate(attained_on)}</p>
            <p class="footer-tagline">AILMS empowers minds through quality education and verified achievements.</p>
        </div>
      </div>
    `;

    // Append the wrapper div to the body
    document.body.appendChild(certDiv);

    try {
      // Use html2canvas to capture the certificate content (the inner .certificate-container)
      const certificateElement = certDiv.querySelector(".certificate-container");
      if (!certificateElement) {
        throw new Error("Certificate container element not found.");
      }

      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");

      // Use jsPDF to create and save the PDF
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const filename = `AILMS_Certificate_of_${title.replace(/ /g, "_")}_${userFirstName}_${userLastName}.pdf`;
      pdf.save(filename);
    } catch (error) {
      alert("Failed to generate certificate. Please try again later.");
    } finally {
      // Clean up: remove the temporary div from the DOM
      if (certDiv.parentNode) {
        document.body.removeChild(certDiv);
      }
      setGenerating(false);
    }
  };

  return (
    <Row className={`border-bottom py-2 align-items-center ${index === 0 && "border-top"}`}>
      {/* Course Title & Rating (Fixed Column) */}
      <Col md={6} xs={4}>
        <span className="fw-semibold text-dark achieventRowTitle">{title}</span>
      </Col>

      {/* Course Badge (Fixed Column) */}
      <Col xs={2} className="text-center">
        <Badge bg="success">{type}</Badge>
      </Col>

      {/* Download Certificate Button */}
      <Col md={2} xs={4} className="text-end text-muted small">
        <button
          className="btn btn-primary" // Bootstrap button styling
          onClick={downloadCertificate}
          aria-label={`Download certificate for ${title}`}
          disabled={generating}
        >
          {generating ? (
            "Generating..."
          ) : (
            <span>
              <FontAwesomeIcon icon={faDownload} /> Certificate
            </span>
          )}
        </button>
      </Col>

      {/* Attained Date (Fixed Column) */}
      <Col md={2} xs={4} className="text-end text-muted small">
        Attained on {formatDate(attained_on)}
      </Col>
    </Row>
  );
};

export default CourseRow;
