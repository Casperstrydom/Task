import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import Home from "./main/Home.jsx";
import Login from "./main/Login.jsx";
import Register from "./main/Register.jsx";

// Base URL for backend API
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service Worker registered"))
        .catch((err) => console.error("❌ SW registration failed:", err));
    }

    // Subscribe user for push notifications
    const subscribeUser = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("⚠️ Push notifications permission denied");
          return;
        }

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
        <Route path="/home" element={<Home currentUser={currentUser} />} />
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

// Wrapper for Login to handle navigation & state
function LoginWrapper({ setCurrentUser }) {
  const navigate = useNavigate();

  const handleLogin = (loginData) => {
    // Mock login user
    const loggedUser = {
      name: "Logged User",
      email: loginData.email,
      joined: new Date().toISOString(),
    };
    setCurrentUser(loggedUser);
    navigate("/home");
  };

  return (
    <Login
      onLogin={handleLogin}
      switchToRegister={() => navigate("/register")}
    />
  );
}

// Wrapper for Register to handle navigation & state
function RegisterWrapper({ setCurrentUser }) {
  const navigate = useNavigate();

  const handleRegister = (formData) => {
    const newUser = {
      name: formData.name,
      email: formData.email,
      joined: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    navigate("/home");
  };

  return (
    <Register
      onRegister={handleRegister}
      switchToLogin={() => navigate("/login")}
    />
  );
}

export default App;
