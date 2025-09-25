import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import HomePrivate from "./main/HomePrivate.jsx";
import Home from "./main/Home.jsx";
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

    // Subscribe user to push notifications if supported
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

        // Send subscription to backend
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
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Home & HomePrivate wrappers */}
        <Route
          path="/home"
          element={<HomeWrapper currentUser={currentUser} />}
        />
        <Route
          path="/home-private"
          element={<HomePrivateWrapper currentUser={currentUser} />}
        />

        {/* Auth routes */}
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
      // const response = await axios.post(`${apiBase}/auth/login`, loginData);
      // setCurrentUser(response.data.user);

      // Temporary mock user
      const loggedUser = {
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
      // const response = await axios.post(`${apiBase}/auth/register`, formData);
      // setCurrentUser(response.data.user);

      // Temporary mock user
      const newUser = {
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

// ---------------- Home Wrapper ----------------
function HomeWrapper({ currentUser }) {
  const navigate = useNavigate();

  const handleHome = () => {
    if (!currentUser) {
      alert("⚠️ You must be logged in to access Home");
      navigate("/login");
    }
  };

  return (
    <Home
      currentUser={currentUser}
      onAccessHome={handleHome}
      switchToPrivate={() => navigate("/home-private")}
    />
  );
}

// ---------------- HomePrivate Wrapper ----------------
function HomePrivateWrapper({ currentUser }) {
  const navigate = useNavigate();

  const handlePrivate = () => {
    if (!currentUser) {
      alert("⚠️ You must be logged in to access Private Home");
      navigate("/login");
    }
  };

  return (
    <HomePrivate
      currentUser={currentUser}
      onRegister={handlePrivate}
      switchToLogin={() => navigate("/private")}
    />
  );
}

export default App;
