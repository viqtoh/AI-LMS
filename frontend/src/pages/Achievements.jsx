import React from "react";
import NavBar from "../components/NavBar";
import "../styles/home.css";
import { useState, useEffect } from "react";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import {
  faBookOpenReader,
  faRocket,
  faSearch,
  faAward, // Changed to a more generic award icon, faCertificate is still okay
  faFileDownload // Needed here because CourseRow now uses it
} from "@fortawesome/free-solid-svg-icons"; // Make sure faFileDownload is here too!
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CourseRow from "../components/CourseRow";

// Import the libraries for PDF generation
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const Achievements = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [achievements, setAchievements] = useState([]); // This will hold the filtered courses
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [selectedCourseForCertificate, setSelectedCourseForCertificate] = useState(null); // NEW: Holds the specific course data

  const [isSuccess, setIsSuccess] = useState(true);
  const [toast, setToast] = useState(null);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);

    setTimeout(() => setToast(null), 5000);
  }, []);

  // Initial user info (from localStorage) - not strictly necessary as `data.user` is fetched
  // useEffect(() => {
  //   setImageUrl(localStorage.getItem("image"));
  //   setUsername(localStorage.getItem("first_name") + " " + localStorage.getItem("last_name"));
  // }, []);

  useEffect(() => {
    if (data && data.achievements) {
      // Assuming 'achievements' array now contains courses directly as returned from backend
      const filteredAchievements = data.achievements.filter((achievement) =>
        achievement.title.toLowerCase().includes(search.toLowerCase())
      );
      setAchievements(filteredAchievements);
    } else {
      setAchievements([]);
    }
  }, [search, data]);

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/achievements`, {
          // Adjust API endpoint if it's different for course achievements vs. overall
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch data");
        }
        const resultData = await response.json();
        setData(resultData);
        setUserFirstName(resultData.user.first_name);
        setUserLastName(resultData.user.last_name);
        // Assuming resultData.achievements contains all the course completion data
        setAchievements(resultData.achievements);
      } catch (err) {
        console.error("Fetch error:", err);
        showToast(err.message, false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, showToast]);

  // --- Certificate Download Function (now takes a course object) ---
  const handleDownloadCourseCertificate = async (course) => {
    if (!data || !data.user || !course) {
      showToast("Data not loaded or course not selected.", false);
      return;
    }

    setSelectedCourseForCertificate(course); // Set the selected course data
    setIsGeneratingCertificate(true);

    // Give React a moment to render the certificate template with the new course data
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const certificateElement = document.getElementById("ailms-certificate");

      if (!certificateElement) {
        throw new Error("Certificate element not found!");
      }

      // Temporarily make it visible/positioned correctly for html2canvas
      certificateElement.style.position = "absolute";
      certificateElement.style.left = "-9999px"; // Move off-screen
      certificateElement.style.top = "-9999px";
      certificateElement.style.display = "block"; // Ensure it's rendered

      const canvas = await html2canvas(certificateElement, {
        scale: 2, // Increase scale for better resolution in PDF
        useCORS: true, // Needed if your image is from a different origin (IMAGE_HOST)
        allowTaint: true // Important for external images not served from same origin (use CORS headers on server for security)
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "pt", "a4");

      const imgWidth = 841.89; // A4 landscape width in points
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      const userName = `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim();
      const courseTitleSafe = course.title.replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "_"); // Sanitize filename
      pdf.save(`AILMS_Certificate_${courseTitleSafe}_${userName.replace(/\s+/g, "_")}.pdf`);

      showToast("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error generating certificate:", error);
      showToast(`Failed to download certificate: ${error.message}`, false);
    } finally {
      setIsGeneratingCertificate(false);
      setSelectedCourseForCertificate(null); // Clear selected course data
      // Hide the element again
      const certificateElement = document.getElementById("ailms-certificate");
      if (certificateElement) {
        certificateElement.style.display = "none";
        certificateElement.style.position = "";
        certificateElement.style.left = "";
        certificateElement.style.top = "";
      }
    }
  };

  const getTodayDate = () => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date().toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <div className="navHeader">
        <NavBar title="Achievements" />
      </div>
      <div className="main-body main-body5 main-body4">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading || data === null ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="sub-body">
            <div className="archievementHeader">
              {/* This header remains as overall user achievement overview */}
              <div className="aheaderContent">
                <img
                  src={
                    data.user.image
                      ? `${IMAGE_HOST}${data.user.image}`
                      : "/images/default_profile.png"
                  }
                  alt="user-image"
                  className="aheaderImage"
                />

                <div className="AheaderContent">
                  <div className="headerTitle">
                    <div>
                      <span>
                        {data.user.first_name && `${data.user.first_name} `}
                        {data.user.last_name && `${data.user.last_name}`}
                      </span>
                    </div>

                    <div className="cardDiv">
                      <div className="aCard">
                        <FontAwesomeIcon icon={faRocket} className="aCardIcon" />
                        <div className="aCardText">
                          <p>Paths Completed</p>
                          <span>{data.finishedLearningPaths}</span>
                        </div>
                      </div>
                      <div className="aCard">
                        <FontAwesomeIcon icon={faBookOpenReader} className="aCardIcon" />
                        <div className="aCardText">
                          <p>Courses Completed</p>
                          <span>{data.finishedCourses}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Header Content */}
              <div className="mheaderContent">
                <div className="AheaderContent">
                  <div className="headerTitle">
                    <div className="mheadertitle">
                      <img
                        src={
                          data.user.image
                            ? `${IMAGE_HOST}${data.user.image}`
                            : "/images/default_profile.png"
                        }
                        alt="user-image"
                        className="mheaderImage"
                      />
                      <span>
                        {data.user.first_name && `${data.user.first_name} `}
                        {data.user.last_name && `${data.user.last_name}`}
                      </span>
                    </div>

                    <div className="cardDiv">
                      <div className="mCard">
                        <FontAwesomeIcon icon={faRocket} className="mCardIcon" />
                        <div className="mCardText">
                          <p>Paths Completed</p>
                          <span>{data.finishedLearningPaths}</span>
                        </div>
                      </div>
                      <div className="mCard">
                        <FontAwesomeIcon icon={faBookOpenReader} className="mCardIcon" />
                        <div className="mCardText">
                          <p>Courses Completed</p>
                          <span>{data.finishedCourses}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Removed the single "Download All Achievements Certificate" button from here */}
            </div>

            <div className="achievementBody">
              <div className="achievementBodyContent">
                <div className="searchBar mb-5">
                  <div className="searchButton">
                    <FontAwesomeIcon icon={faSearch} id="searchIcon" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for an achievement..."
                    className="searchInput"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Map through achievements (which are courses here) and pass the download handler */}
                {achievements.map((course, index) => (
                  <CourseRow
                    key={index}
                    index={index}
                    {...course} // Pass all course properties
                    onDownloadCertificate={handleDownloadCourseCertificate} // Pass the function
                    userFirstName={userFirstName}
                    userLastName={userLastName}
                  />
                ))}

                {achievements.length === 0 && (
                  <div className="noAchievements">
                    <p>No achievements found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- HIDDEN COURSE CERTIFICATE HTML STRUCTURE --- */}
      {/* This div only renders when a course is selected and generates cert */}
      {data && data.user && selectedCourseForCertificate && (
        <div id="ailms-certificate" className="ailms-certificate-template">
          <img
            src="/images/ailms_icon.png"
            alt="AILMS Icon Background"
            className="certificate-bg-icon"
          />

          <div className="certificate-header">
            <img src="/images/ailms_icon.png" alt="AILMS Logo" className="certificate-logo" />
            <h1>AILMS</h1>
            <h2>Certificate of Completion</h2>
          </div>

          <div className="certificate-body">
            <p className="award-text">THIS IS TO CERTIFY THAT</p>
            <h3 className="recipient-name">
              {data.user.first_name} {data.user.last_name}
            </h3>
            <p className="award-text">HAS SUCCESSFULLY COMPLETED THE COURSE:</p>

            <h2 className="course-title-on-cert">{selectedCourseForCertificate.title}</h2>

            <p className="award-detail">
              We acknowledge their dedication and successful mastery of the course content on the
              AILMS Platform.
            </p>
          </div>

          <div className="certificate-footer">
            <p className="issue-date">Issued On: {getTodayDate()}</p>
            <div className="signature-line">
              <hr />
              <p>AILMS Administration</p>
            </div>
          </div>
        </div>
      )}
      {/* END HIDDEN CERTIFICATE HTML STRUCTURE */}
    </div>
  );
};

export default Achievements;
