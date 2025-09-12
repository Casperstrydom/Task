import React from "react";
import axios from "axios";
import RegisterComponent from "../components/registerComponent";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Register() {
  const handleRegister = async (formData) => {
    try {
      const res = await axios.post(`${apiBase}/auth/register`, formData);
      console.log("✅ Registration successful:", res.data);
      alert("Registration successful! Please log in.");
      window.location.href = "/home"; // redirect after register
    } catch (err) {
      console.error(
        "❌ Registration failed:",
        err.response?.data || err.message
      );
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div>
      <RegisterComponent
        onRegister={handleRegister}
        switchToLogin={() => (window.location.href = "/login")}
      />
    </div>
  );
}
