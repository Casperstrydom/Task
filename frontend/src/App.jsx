import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

import Home from "./main/Home.jsx";
import HomePrivate from "./main/HomePrivate.jsx";
import Login from "./main/Login.jsx";
import Register from "./main/Register.jsx";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Optional: Service Worker (disable on Amplify unless sw.js exists)
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service Worker registered"))
        .catch((err) => console.error("❌ SW registration failed:", err));
    }

    // Subscribe user to push notifications
    const subscribeUser = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            import.meta.env.VITE_VAPID_PUBLIC_KEY
          ),
        });

        await axios.post(`${apiBase}/subscribe`, subscription);
        console.log("✅ Subscribed for push notifications");
      } catch (err) {
        console.error("❌ Push subscription failed:", err);
      }
    };

    subscribeUser();
  }, []);

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Home (when no user logged in) */}
        <Route
          path="/home"
          element={
            currentUser ? <HomePrivate currentUser={currentUser} /> : <Home />
          }
        />

        {/* Login & Register */}
        <Route
          path="/login"
          element={<LoginWrapper setCurrentUser={setCurrentUser} />}
        />
        <Route
          path="/register"
          element={<RegisterWrapper setCurrentUser={setCurrentUser} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

// ---------------- Login Wrapper ----------------
function LoginWrapper({ setCurrentUser }) {
  const navigate = useNavigate();

  const handleLogin = async (loginData) => {
    try {
      // Example: real backend call
      // const response = await axios.post(`${apiBase}/auth/login`, loginData);
      // setCurrentUser(response.data.user);

      // Mock user
      const loggedUser = {
        _id: "12345", // add id for task.owner comparison
        name: "Logged User",
        email: loginData.email,
        joined: new Date().toISOString(),
      };
      setCurrentUser(loggedUser);
      navigate("/home");
    } catch (err) {
      console.error("❌ Login failed:", err);
      alert("Login failed. Check console for details.");
    }
  };

  return (
    <Login
      onLogin={handleLogin}
      switchToRegister={() => navigate("/register")}
    />
  );
}

// ---------------- Register Wrapper ----------------
function RegisterWrapper({ setCurrentUser }) {
  const navigate = useNavigate();

  const handleRegister = async (formData) => {
    try {
      // Example: real backend call
      // const response = await axios.post(`${apiBase}/auth/register`, formData);
      // setCurrentUser(response.data.user);

      // Mock user
      const newUser = {
        _id: "67890", // add id for task.owner comparison
        name: formData.name,
        email: formData.email,
        joined: new Date().toISOString(),
      };
      setCurrentUser(newUser);
      navigate("/home");
    } catch (err) {
      console.error("❌ Registration failed:", err);
      alert("Registration failed. Check console for details.");
    }
  };

  return (
    <Register
      onRegister={handleRegister}
      switchToLogin={() => navigate("/login")}
    />
  );
}

export default App;
