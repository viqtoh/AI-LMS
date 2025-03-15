import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav style={styles.nav}>
      <ul style={styles.ul}>
        <li>
          <Link to="/" style={styles.link}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/about" style={styles.link}>
            About
          </Link>
        </li>
        <li>
          <Link to="/contact" style={styles.link}>
            Contact
          </Link>
        </li>
      </ul>
    </nav>
  );
};
const styles = {
  nav: { background: "#333", padding: "10px" },
  ul: { listStyle: "none", display: "flex", gap: "20px" },
  link: { color: "white", textDecoration: "none", fontSize: "18px" }
};

export default NavBar;
