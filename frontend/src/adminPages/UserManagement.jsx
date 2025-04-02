import React, { useState, useEffect } from "react";
import AdminNavBar from "../components/AdminNavBar";
import "../styles/home.css";
import { API_URL, IMAGE_HOST } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import Toast from "../components/Toast";
import {
  faSearch,
  faAngleUp,
  faArrowUp,
  faSortAlphaAsc,
  faSortAlphaDesc
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import Select from "react-select";

const UserManagement = () => {
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [sort, setSort] = useState("email");
  const [search, setSearch] = useState("");

  const [isSuccess, setIsSuccess] = React.useState(true);
  const [toast, setToast] = useState(null);
  const showToast = React.useCallback((message, success = true) => {
    setToast(message);
    setIsSuccess(success);
    console.log(isSuccess);
    setTimeout(() => setToast(null), 5000); // Hide after 5s
  }, []);

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    setIsReloading(true);
    setUsers([]);
    fetch(`${API_URL}/api/admin/users?page=${page}&search=${search}&sort=${sort}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showToast(data.error, false);
        } else {
          setUsers(data.users);
          setLastPage(data.totalPages);
          setTotalUsers(data.totalUsers);
        }

        setIsLoading(false);
        setIsReloading(false);
      })
      .catch((error) => {
        showToast("Failed to fetch users", false);
        setIsLoading(false);
        setIsReloading(false);
      });
  }, [token, showToast, page, sort, search]);

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <div className="navHeader">
        <AdminNavBar title="User Management" context="Add and Manage all user accounts here." />
      </div>
      <div className="main-body5 main-body main-body3 main-body4">
        {toast && <Toast message={toast} onClose={() => setToast(null)} isSuccess={isSuccess} />}
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="sub-body">
            <button
              className="btn returnUp"
              onClick={() => {
                const subBody = document.querySelector(".sub-body");
                if (subBody) {
                  subBody.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <FontAwesomeIcon icon={faAngleUp} />
            </button>
            <div className="userSearchContainer">
              <div className="totalUserCon">
                <span>All Users</span>
                <span className="ms-1 uTotal">{totalUsers}</span>
              </div>
              <div className="searchBarContainerCon">
                <div className="searchBarContainer">
                  <FontAwesomeIcon
                    icon={faSearch}
                    onClick={() => {
                      const searchInput = document.querySelector(".searchBar2");
                      if (searchInput) {
                        setSearch(searchInput.value);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    className="searchBar2"
                    placeholder="Search content by title or description"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSearch(e.target.value);
                      }
                    }}
                  />
                </div>
                <button className="btn btn-theme addUserBtn">Add User</button>
              </div>
            </div>

            <div className="searchBody2">
              <div className="contentTable nobar">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th></th>
                      <th
                        onClick={() => {
                          const newSort = sort === "email" ? "-email" : "email";
                          setSort(newSort);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        Email
                        {sort === "email" ? (
                          <FontAwesomeIcon icon={faSortAlphaAsc} />
                        ) : sort === "-email" ? (
                          <FontAwesomeIcon icon={faSortAlphaDesc} />
                        ) : (
                          ""
                        )}
                      </th>
                      <th
                        onClick={() => {
                          const newSort = sort === "name" ? "-name" : "name";
                          setSort(newSort);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        Name
                        {sort === "name" ? (
                          <FontAwesomeIcon icon={faSortAlphaAsc} />
                        ) : sort === "-name" ? (
                          <FontAwesomeIcon icon={faSortAlphaDesc} />
                        ) : (
                          ""
                        )}
                      </th>
                      <th
                        onClick={() => {
                          const newSort = sort === "lastActive" ? "-lastActive" : "lastActive";
                          setSort(newSort);
                        }}
                        style={{ cursor: "pointer", minWidth: "100px" }}
                      >
                        Last Active
                        {sort === "lastActive" ? (
                          <FontAwesomeIcon icon={faSortAlphaAsc} />
                        ) : sort === "-lastActive" ? (
                          <FontAwesomeIcon icon={faSortAlphaDesc} />
                        ) : (
                          ""
                        )}
                      </th>
                      <th
                        onClick={() => {
                          const newSort = sort === "status" ? "-status" : "status";
                          setSort(newSort);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        Status
                        {sort === "status" ? (
                          <FontAwesomeIcon icon={faSortAlphaAsc} />
                        ) : sort === "-status" ? (
                          <FontAwesomeIcon icon={faSortAlphaDesc} />
                        ) : (
                          ""
                        )}
                      </th>
                      <th
                        onClick={() => {
                          const newSort = sort === "dateAdded" ? "-dateAdded" : "dateAdded";
                          setSort(newSort);
                        }}
                        style={{ cursor: "pointer", minWidth: "110px" }}
                      >
                        Date Added
                        {sort === "dateAdded" ? (
                          <FontAwesomeIcon icon={faSortAlphaAsc} />
                        ) : sort === "-dateAdded" ? (
                          <FontAwesomeIcon icon={faSortAlphaDesc} />
                        ) : (
                          ""
                        )}
                      </th>
                      <th style={{ minWidth: "120px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isReloading && (
                      <tr>
                        <td colSpan={7}>
                          <div className="d-flex justify-content-center align-items-center tableLoader">
                            <div className="loader"></div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!isReloading && users.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          <div className="d-flex justify-content-center align-items-center tableLoader">
                            No Users to display
                          </div>
                        </td>
                      </tr>
                    )}

                    {users.map((user, index) => (
                      <tr key={index}>
                        <td>
                          {user.image ? (
                            <div className="profileImage mx-2 s-35">
                              <img
                                src={`${IMAGE_HOST}${user.image}`}
                                className="s-35"
                                alt="Profile"
                              />
                            </div>
                          ) : (
                            <div className="profileImage mx-2 s-35">
                              <img
                                src="/images/default_profile.png"
                                className="s-35"
                                alt="Profile"
                              />
                            </div>
                          )}
                        </td>
                        <td>{user.email}</td>
                        <td>{user.name}</td>
                        <td>{formatDate(user.lastActive)}</td>
                        <td>{user.status}</td>
                        <td>{formatDate(user.dateAdded)}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm me-1"
                            onClick={() => console.log("Edit user", user)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => console.log("Delete user", user)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isReloading && users.length !== 0 && (
                <div className="pagination-container">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: lastPage }, (_, i) => i + 1).map((pageNumber) => (
                        <li
                          key={pageNumber}
                          className={`page-item ${page === pageNumber ? "active" : ""}`}
                        >
                          <button className="page-link" onClick={() => setPage(pageNumber)}>
                            {pageNumber}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${page === lastPage ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => setPage((prev) => Math.min(prev + 1, lastPage))}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
