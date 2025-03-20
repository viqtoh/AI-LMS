import React from "react";
import NavBar from "../components/NavBar";

const Dashboard = () => {
  const token = localStorage.getItem("token");
  console.log(token);
  return (
    <div>
      <div className="navHeader">
        <NavBar />
      </div>
    </div>
  );
};

export default Dashboard;
