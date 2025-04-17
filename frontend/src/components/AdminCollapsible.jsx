import { useState } from "react";
import {
  faAngleDoubleUp,
  faAngleDown,
  faAngleRight,
  faAngleUp,
  faCheckCircle,
  faCirclePlay,
  faLock,
  faPen
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-regular-svg-icons";

const AdminCollapsible = ({ title, desc = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="collapsible">
      <div className="collapsible-header">
        <button onClick={() => setIsOpen(!isOpen)} className="colbtn">
          <div>
            <FontAwesomeIcon icon={isOpen ? faAngleDown : faAngleRight} />
          </div>
          <span className="sectionTitle">{title}</span>
        </button>

        <div className="d-flex gap-2 align-items-center">
          <button className="btn btn-primary sm-btn">
            <FontAwesomeIcon icon={faPen} />
          </button>

          <button className="btn btn-primary sm-btn">
            <FontAwesomeIcon icon={faAngleDoubleUp} />
          </button>
        </div>
      </div>

      <div className={`collapsible-content ${isOpen ? "open" : ""}`}>
        <div>
          <div className="collapseIcon">
            <FontAwesomeIcon icon={faCirclePlay} size="lg" />
          </div>
          <div className="collapseText">
            <p>{desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCollapsible;
