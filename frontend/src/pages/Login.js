import React, { useState } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt } from "react-icons/fa";
import { API_BASE_URL } from "../config/config";
import "./Login.css";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter your user ID and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authUsername", data.user.username);
        localStorage.setItem("authRole", data.user.role);
        onLoginSuccess();
      } else {
        setError(data.message || "Invalid User ID or Password.");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      {/* Smart POS Header */}
      <div className="login-header-container">
        <div className="login-logo-box">
          <img 
            className="login-logo-img" 
            src="https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png" 
            alt="Unipro Logo" 
          />
        </div>
        <div className="login-header-text">
          <div className="login-title-main">Smart POS</div>
          <div className="login-title-sub">Backoffice System</div>
        </div>
      </div>

      {/* Login Form Card */}
      <div className="login-card">
        <div className="login-signin-title">Sign In</div>
        <div className="login-signin-subtitle">Enter your credentials to continue</div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-group">
            <label className="login-label">USER ID</label>
            <div className="login-input-wrapper">
              <FaUser className="login-input-icon" />
              <input
                type="text"
                className="login-input"
                placeholder="User ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className="login-group">
            <label className="login-label">PASSWORD</label>
            <div className="login-input-wrapper">
              <FaLock className="login-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            <FaSignInAlt className="login-btn-icon" />
            <span>{loading ? "Signing In..." : "Sign In"}</span>
          </button>
        </form>
      </div>

      {/* Center Copyright Footer */}
      <div className="login-footer-text">
        © 2026 Unipro Softwares SG Pte Ltd
      </div>
    </div>
  );
}

export default Login;
