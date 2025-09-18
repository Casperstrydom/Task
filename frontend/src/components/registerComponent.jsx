import { useState } from "react";
import "../main/index.css";

const Register = ({ onRegister, switchToLogin }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const apiBase = import.meta.env.VITE_API_BASE;
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Store JWT automatically after registration
      if (data.token) localStorage.setItem("token", data.token);

      console.log("Registration successful", data.user);
      onRegister(data.user);
    } catch (err) {
      console.error("Registration error:", err);
      alert(err.message);
    }
  };

  return (
    <div className="futuristic-auth-container">
      <div className="cyber-grid"></div>
      <div className="glowing-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="cyber-title">
              <span className="cyber-title-text">NEXUS ACCESS</span>
              <span className="cyber-title-cursor pulse">_</span>
            </h1>
            <p className="auth-subtitle">IDENTITY REGISTRATION</p>
          </div>

          <form className="cyber-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2 className="neon-text">REQUEST ACCESS</h2>
              <div className="form-indicator"></div>
            </div>

            <div className="input-group">
              <label className="input-label">CALLSIGN</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="cyber-input"
                placeholder="ENTER YOUR NAME"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">IDENTITY</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="cyber-input"
                placeholder="ENTER YOUR EMAIL"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">PASSPHRASE</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="cyber-input"
                placeholder="CREATE A PASSWORD"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">CONFIRM PASSPHRASE</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="cyber-input"
                placeholder="CONFIRM YOUR PASSWORD"
                required
              />
            </div>

            <label className="cyber-checkbox-container">
              <input type="checkbox" required />
              <span className="checkmark"></span>I ACCEPT THE TERMS OF SERVICE
            </label>

            <button
              type="submit"
              className="cyber-button cyber-button-primary full-width"
            >
              <span className="cyber-button-glitch">⊕</span>
              <span className="cyber-button-text">CREATE IDENTITY</span>
            </button>

            <div className="auth-switch">
              <span>EXISTING USER?</span>
              <button
                type="button"
                onClick={switchToLogin}
                className="cyber-link"
              >
                INITIATE LOGIN
              </button>
            </div>
          </form>

          <div className="auth-footer">
            <p>NEXUS SECURITY SYSTEM v2.4.7</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
