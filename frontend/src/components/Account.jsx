import { useState, useEffect } from "react";
import api from "../api/axios";
import "../styles/Account.css";

function Account({ user, setUser }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  const [uiAlert, setUiAlert] = useState({
    show: false,
    message: "",
    type: "info", // success  error  warning  info  confirm
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

  useEffect(() => {
  setName(user.name || "");
  setUsername(user.username || "");
  setEmail(user.email || "");
}, [user]);


  const handleUpdate = async (e) => {
  e.preventDefault();

  // Check password mismatch first
  if (password && password !== confirmPassword) {
    showAlert("Passwords do not match!", "error");
    return;
  }

  //  Only show confirm if passwords match (or empty)
  showConfirm("Are you sure you want to update your account?", async () => {
    try {
      const res = await api.post("/api/users/update_user.php", {
        name,
        username,
        email,
        password,
      });

      if (res.data.status === "success") {
        showAlert("Account updated successfully!", "success");
        setUser(res.data.user);
      } else {
        showAlert(res.data.message, "error");
      }
    } catch {
      showAlert("Update failed.", "error");
    }
  });
};


  return (
    <div className="account-container">
      <h1>Account Settings</h1>

      <form onSubmit={handleUpdate}>
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave empty to keep current password"
        />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />

        <button type="submit">Update Account</button>
      </form>

      {/* ALERT UI */}
      {uiAlert.show && (
        <div className="ui-alert-overlay">
          <div className={`ui-alert ${uiAlert.type}`}>
            <p>{uiAlert.message}</p>

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

export default Account;
