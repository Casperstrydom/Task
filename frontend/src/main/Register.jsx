import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RegisterComponent from "../components/registerComponent";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = async (formData) => {
    try {
      const res = await axios.post(`${apiBase}/auth/register`, formData);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token); // store JWT
      }

      console.log("✅ Registration successful:", res.data);

      alert("Registration successful! Please log in.");

      navigate("/home"); // redirect after register
    } catch (err) {
      console.error(
        "❌ Registration failed:",
        err.response?.data || err.message
      );
      alert(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div>
      <RegisterComponent
        onRegister={handleRegister}
        switchToLogin={() => navigate("/login")}
      />
    </div>
  );
}
