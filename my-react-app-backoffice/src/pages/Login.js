import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// ✅ image import (src/assets)
import cafeImg from "../assets/smart.jpg";

function Login() {
  const navigate = useNavigate();
 

  // ✅ form state (missing in your code)
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  // ✅ input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.username === "123" && form.password === "786") {
      navigate("/home");
    } else {
      alert("Invalid Username or Password ❌");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* ✅ Image show */}
        <img src={cafeImg} alt="Cafe" className="login-logo" />

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            name="username"
            placeholder="Enter Username"
            value={form.username}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={form.password}
            onChange={handleChange}
          />

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
