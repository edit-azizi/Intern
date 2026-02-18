import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/UserDashboard.css";

function UsersDashboard({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editUsers, setEditUsers] = useState({});
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const [searchQuery, setSearchQuery] = useState(""); 
  const [roleFilter, setRoleFilter] = useState("all"); 

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const gridRef = useRef(null);

  useEffect(() => {
  if (gridRef.current) {
    gridRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}, [currentPage]);

  useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, roleFilter]);


  const [uiAlert, setUiAlert] = useState({
    show: false,
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showAlert = (message, type = "info") => {
    setUiAlert({ show: true, message, type, onConfirm: null });
  };

  const showConfirm = (message, onConfirm) => {
    setUiAlert({ show: true, message, type: "confirm", onConfirm });
  };

  const closeAlert = () => {
    setUiAlert({ show: false, message: "", type: "info", onConfirm: null });
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/api/users/get.php");
      setUsers(res.data);

      const map = {};
      res.data.forEach((u) => {
        map[u.id] = {
          name: u.name,
          username: u.username,
          email: u.email,
          role: u.role,
        };
      });
      setEditUsers(map);
    } catch (err) {
      console.error(err);
      showAlert("Failed to fetch users", "error");
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [user, navigate, fetchUsers]);

  // ADD USER 
  const addUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/users/create.php", newUser);

      if (res.data.status === "success") {
        setNewUser({ name: "", username: "", email: "", password: "", role: "user" });
        showAlert("User added successfully!", "success");
        fetchUsers();
      } else {
        showAlert(res.data.message, "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to add user", "error");
    }
  };

  // EDIT USER 
  const handleChange = (id, field, value) => {
    setEditUsers({
      ...editUsers,
      [id]: { ...editUsers[id], [field]: value },
    });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await api.post("/api/users/update.php", {
        id,
        fields: editUsers[id],
      });

      if (res.data.status === "success") {
        showAlert("User updated successfully!", "success");
        fetchUsers();
      } else {
        showAlert(res.data.message, "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to update user", "error");
    }
  };

  const deleteUser = async (id) => {
    showConfirm("Delete this user?", async () => {
      try {
        const res = await api.post("/api/users/delete.php", { id });
        if (res.data.status === "success") {
          showAlert("User deleted successfully!", "success");
          fetchUsers();
        } else {
          showAlert(res.data.message, "error");
        }
      } catch (err) {
        console.error(err);
        showAlert("Failed to delete user", "error");
      }
    });
  };

  // SEARCH + ROLE FILTER LOGIC
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSortedUsers = users
    .map(u => {
      const username = u.username.toLowerCase();
      const email = u.email.toLowerCase();
      const matchUsername = username.indexOf(normalizedQuery);
      const matchEmail = email.indexOf(normalizedQuery);

      const matchIndex = Math.min(
        matchUsername === -1 ? 999999 : matchUsername,
        matchEmail === -1 ? 999999 : matchEmail
      );

      return {
        ...u,
        matchIndex
      };
    })
    .filter(u => {
      const matchesSearch =
        normalizedQuery === "" ? true : u.matchIndex !== 999999;

      const matchesRole =
        roleFilter === "all" ? true : u.role === roleFilter;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => a.matchIndex - b.matchIndex);

    // PAGINATED USERS
    const totalPages = Math.ceil(filteredSortedUsers.length / rowsPerPage);
    const paginatedUsers = filteredSortedUsers.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

  return (
    <div className="update-dashboard-container">
      <h1>User Management</h1>

      {/* ADD USER */}
      <form onSubmit={addUser} className="add-user-form">
        <input type="text" placeholder="Name" value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
        <input type="text" placeholder="Username" value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
        <input type="email" placeholder="Email" value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
        <select value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} required>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>
        <button>Add User</button>
      </form>

      {/* SEARCH + ROLE FILTER */}
      <div className="search-container" style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select
          className="role-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* USERS TABLE */}
      <table className="users-table" ref={gridRef}>
        <thead>
          <tr>
            <th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedUsers.map((u) => (
            <tr key={u.id}>
              <td>
                <input
                  value={editUsers[u.id]?.name || ""}
                  onChange={(e) => handleChange(u.id, "name", e.target.value)}
                />
              </td>

              <td>
                <input
                  value={editUsers[u.id]?.username || ""}
                  onChange={(e) => handleChange(u.id, "username", e.target.value)}
                />
              </td>

              <td>
                <input
                  value={editUsers[u.id]?.email || ""}
                  onChange={(e) => handleChange(u.id, "email", e.target.value)}
                />
              </td>

              <td>
                <select
                  value={editUsers[u.id]?.role || "user"}
                  onChange={(e) => handleChange(u.id, "role", e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </td>

              <td>
                <button
                  className="update-btn"
                  onClick={() => handleUpdate(u.id)}
                  style={{ marginRight: "8px" }}
                >
                  Update
                </button>

                <button className="delete-btn" onClick={() => deleteUser(u.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
<div className="pagination-container-users">
  <button
    className="pagination-btn"
    onClick={() => setCurrentPage(1)}
    disabled={currentPage === 1}
  >
    « First
  </button>

  <button
    className="pagination-btn"
    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
  >
    ‹ Prev
  </button>

  {/* Page numbers with sliding window */}
  {Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      page =>
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 3 && page <= currentPage + 3)
    )
    .map((page, idx, arr) => {
      const prevPage = arr[idx - 1];
      return (
        <span key={page}>
          {prevPage && page - prevPage > 1 ? <span className="dots">...</span> : null}
          <button
            className={`pagination-btn ${currentPage === page ? "active" : ""}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        </span>
      );
    })}

  <button
    className="pagination-btn"
    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
  >
    Next ›
  </button>

  <button
    className="pagination-btn"
    onClick={() => setCurrentPage(totalPages)}
    disabled={currentPage === totalPages}
  >
    Last »
  </button>
</div>

      {/* ALERT UI */}
      {uiAlert.show && (
        <div className="ui-alert-overlay">
          <div className={`ui-alert ${uiAlert.type}`}>
            <p style={{ whiteSpace: "pre-line" }}>{uiAlert.message}</p>
            <div className="ui-alert-actions">
              {uiAlert.type === "confirm" ? (
                <>
                  <button
                    className="btn confirm"
                    onClick={() => {
                      uiAlert.onConfirm();
                      closeAlert();
                    }}
                  >
                    Yes
                  </button>
                  <button className="btn cancel" onClick={closeAlert}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn ok" onClick={closeAlert}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersDashboard;
