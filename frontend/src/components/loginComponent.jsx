import { useState, useEffect } from "react";
import axios from "axios";
import "../main/index.css";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const LoginComponent = ({ switchToRegister }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Request Notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${apiBase}/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.status === 200) {
        if (res.data.token) localStorage.setItem("token", res.data.token);
        // Redirect to /home
        window.location.href = "/home"; // Or use navigate("/home") if using React Router
      }
    } catch (err) {
      console.error("❌ Login failed:", err);
      alert(
        err.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
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
            <p className="auth-subtitle">SECURE SYSTEM ENTRY POINT</p>
          </div>

          <form className="cyber-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2 className="neon-text">USER LOGIN</h2>
              <div className="form-indicator"></div>
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
                placeholder="ENTER YOUR PASSWORD"
                required
              />
            </div>

            <div className="form-options">
              <label className="cyber-checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                REMEMBER ME
              </label>
              <a href="#" className="cyber-link">
                FORGOT PASSPHRASE?
              </a>
            </div>

            <button
              type="submit"
              className="cyber-button cyber-button-primary full-width"
              disabled={loading}
            >
              <span className="cyber-button-glitch">⟳</span>
              <span className="cyber-button-text">
                {loading ? "ACCESSING..." : "ACCESS SYSTEM"}
              </span>
            </button>

            <div className="auth-switch">
              <span>NEW USER?</span>
              <button
                type="button"
                onClick={switchToRegister}
                className="cyber-link"
              >
                REQUEST ACCESS
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

export default LoginComponent;
