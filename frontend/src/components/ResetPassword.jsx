import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = new URLSearchParams(location.search).get("token");

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await api.post("/api/auth/reset_password.php", {
      token,
      password,
    });

    if (res.data.status === "success") {
      setMessage("Password successfully reset.");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setMessage(res.data.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Reset Password</h2>

        {message && <p>{message}</p>}

        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
