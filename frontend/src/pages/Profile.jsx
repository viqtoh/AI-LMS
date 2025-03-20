import React from "react";
import NavBar from "../components/NavBar";

const Profile = () => {
  const token = localStorage.getItem("token");
  console.log(token);
  return (
    <div>
      <div className="navHeader">
        <NavBar title="Profile" />
        <h3>Profile</h3>
      </div>
    </div>
  );
};

export default Profile;
