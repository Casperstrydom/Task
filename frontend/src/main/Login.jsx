import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoginComponent from "../components/loginComponent";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async (formData) => {
    try {
      const res = await axios.post(`${apiBase}/auth/login`, formData);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token); // store JWT
      }

      console.log("✅ Login successful:", res.data);

      // Optional: update state or context here if needed
      // e.g., setUser(res.data.user);

      navigate("/home"); // redirect using react-router
    } catch (err) {
      console.error("❌ Login failed:", err.response?.data || err.message);
      alert(
        err.response?.data?.error || "Login failed. Check your credentials."
      );
    }
  };

  return (
    <div>
      <LoginComponent
        onLogin={handleLogin}
        switchToRegister={() => navigate("/register")}
      />
    </div>
  );
}
