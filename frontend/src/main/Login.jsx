import React from "react";
import axios from "axios";
import LoginComponent from "../components/loginComponent";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Login() {
  const handleLogin = async (formData) => {
    try {
      const res = await axios.post(`${apiBase}/auth/login`, formData);
      console.log("✅ Login successful:", res.data);
      localStorage.setItem("token", res.data.token); // store token
      window.location.href = "/home"; // redirect to home
    } catch (err) {
      console.error("❌ Login failed:", err.response?.data || err.message);
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div>
      <LoginComponent
        onLogin={handleLogin}
        switchToRegister={() => (window.location.href = "/register")}
      />
    </div>
  );
}
