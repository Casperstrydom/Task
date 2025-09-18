import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../main/index.css";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      if (data.token) localStorage.setItem("token", data.token);
      onLogin(data.user);

      console.log("Login successful:", data.user);

      // Redirect to /home after login
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
      alert(err.message);
    }
  };

  return (
    <div className="futuristic-auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
