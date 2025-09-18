import { useState, useEffect } from "react";
import "../main/index.css";

const Login = ({ onLogin, switchToRegister }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });

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

    try {
      const apiBase = import.meta.env.VITE_API_BASE;
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      // Store JWT in localStorage
      if (data.token) localStorage.setItem("token", data.token);

      console.log("Login successful", data.user);

      onLogin(data.user);

      // Push notifications
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.register("/sw.js");
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });
        }

        await fetch(`${apiBase}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        console.log("Push subscription successful");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert(err.message);
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

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
            >
              <span className="cyber-button-glitch">⟳</span>
              <span className="cyber-button-text">ACCESS SYSTEM</span>
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

export default Login;
