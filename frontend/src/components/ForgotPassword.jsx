import { useState } from "react";
import api from "../api/axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await api.post("/api/auth/forgot_password.php", { email });

    if (res.data.status === "success") {
      setMessage("If the account exists, a reset link has been generated.");
    //   console.log("DEV TOKEN:", res.data.dev_token); // for testing
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Forgot Password</h2>

        {message && <p>{message}</p>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit">Send Reset Link</button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
