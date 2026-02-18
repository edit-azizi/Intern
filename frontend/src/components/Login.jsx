import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Login.css";

function Login({ setUser }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/api/auth/login.php", formData);

      if (res.data.status === "success") {
        setUser(res.data.user); // save logged user
        navigate("/"); // go to home
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Invalid login credentials");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            required
          />

        <p style={{ marginTop: "10px" }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

          <button type="submit">Login</button>
        </form>

        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
