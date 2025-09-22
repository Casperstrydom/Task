import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "../main/index.css";
import { format } from "date-fns";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function HomeComponent() {
  // ---------------- STATE ----------------
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("12:00"); // ✅ 24-hour format only
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    _id: null,
    name: "",
    email: "",
    joined: "",
  });
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // ---------------- AUDIO ----------------
  const bellAudio = useRef(new Audio("/bell.mp3"));
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // ---------------- AUTH ----------------
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleTokenError = (err) => {
    if (err.response?.status === 403) {
      alert("Session expired or invalid token. Please log in again.");
      localStorage.removeItem("token");
    } else {
      console.error(err);
    }
  };

  // ---------------- AUDIO UNLOCK ----------------
  const unlockAudio = () => {
    bellAudio.current
      .play()
      .then(() => {
        bellAudio.current.pause();
        bellAudio.current.currentTime = 0;
        setAudioUnlocked(true);
      })
      .catch(() => {});
  };

  useEffect(() => {
    window.addEventListener("click", unlockAudio, { once: true });
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  // ---------------- FRIEND REQUESTS ----------------
  const fetchFriendRequests = useCallback(() => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .get(`${apiBase}/friend-requests/incoming`, headers)
      .then((res) =>
        setIncomingRequests(Array.isArray(res.data) ? res.data : [])
      )
      .catch(handleTokenError);

    axios
      .get(`${apiBase}/friend-requests/sent`, headers)
      .then((res) =>
        setSentRequests(
          Array.isArray(res.data) ? res.data.map((u) => u._id) : []
        )
      )
      .catch(handleTokenError);
  }, []);

  // ---------------- FETCH INITIAL DATA ----------------
  const fetchData = useCallback(() => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .get(`${apiBase}/tasks`, headers)
      .then((res) =>
        setTasks(Array.isArray(res.data.tasks) ? res.data.tasks : [])
      )
      .catch(handleTokenError);

    axios
      .get(`${apiBase}/friends`, headers)
      .then((res) => setFriends(Array.isArray(res.data) ? res.data : []))
      .catch(handleTokenError);

    axios
      .get(`${apiBase}/users`, headers)
      .then((res) => setAllUsers(Array.isArray(res.data) ? res.data : []))
      .catch(handleTokenError);

    axios
      .get(`${apiBase}/user/me`, headers)
      .then((res) => setCurrentUser(res.data || {}))
      .catch(handleTokenError);

    fetchFriendRequests();
  }, [fetchFriendRequests]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchFriendRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchData, fetchFriendRequests]);

  // ---------------- TASK FUNCTIONS ----------------
  const addTask = () => {
    if (!newTask.trim()) return;
    const headers = getAuthHeaders();
    if (!headers) return;

    const taskData = {
      title: newTask,
      dueDate: dueDate && dueTime ? `${dueDate}T${dueTime}:00` : null,
    };

    axios
      .post(`${apiBase}/tasks`, taskData, headers)
      .then((res) => {
        const newTaskItem = { ...res.data.task, alerted: false };
        setTasks((prev) => [...prev, newTaskItem]);
        setNewTask("");
        setDueDate("");
        setDueTime("12:00"); // reset correctly
      })
      .catch(handleTokenError);
  };

  const deleteTask = (id) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .delete(`${apiBase}/tasks/${id}`, headers)
      .then(() => setTasks((prev) => prev.filter((t) => t._id !== id)))
      .catch(handleTokenError);
  };

  // ---------------- FRIEND FUNCTIONS ----------------
  const sendFriendRequest = (userId, userName) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .post(`${apiBase}/friend-requests`, { toUserId: userId }, headers)
      .then(() => {
        setSentRequests((prev) => [...prev, userId]);
        showTempNotification(`Friend request sent to ${userName}`);
      })
      .catch(handleTokenError);
  };

  const acceptFriendRequest = (fromUserId, fromUser) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .post(`${apiBase}/friend-requests/accept`, { fromUserId }, headers)
      .then(() => {
        setFriends((prev) => [...prev, fromUser]);
        setIncomingRequests((prev) => prev.filter((r) => r._id !== fromUserId));
        showTempNotification(`${fromUser.name} is now your friend!`);
        fetchData();
      })
      .catch(handleTokenError);
  };

  const declineFriendRequest = (fromUserId) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .post(`${apiBase}/friend-requests/decline`, { fromUserId }, headers)
      .then(() =>
        setIncomingRequests((prev) => prev.filter((r) => r._id !== fromUserId))
      )
      .catch(handleTokenError);
  };

  const removeFriend = (friendId, friendName) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .delete(`${apiBase}/friends/${friendId}`, headers)
      .then(() => {
        setFriends((prev) => {
          const removedFriend = prev.find((f) => f._id === friendId);
          if (removedFriend)
            setAllUsers((prevUsers) => [...prevUsers, removedFriend]);
          return prev.filter((f) => f._id !== friendId);
        });
        showTempNotification(`Removed ${friendName} from friends`);
      })
      .catch(handleTokenError);
  };

  // ---------------- UTIL ----------------
  const showTempNotification = (message) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTask();
  };

  // ---------------- FILTERED USERS ----------------
  const availableUsers = allUsers.filter(
    (user) =>
      user.name?.trim() &&
      !friends.some((f) => f._id === user._id) &&
      user._id !== currentUser._id &&
      !sentRequests.includes(user._id)
  );

  const validFriends = friends.filter((friend) => friend.name?.trim());

  // ---------------- SORTED TASKS ----------------
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  // ---------------- TASK ALERTS & AUDIO ----------------
  useEffect(() => {
    if (!tasks.length) return;
    const interval = setInterval(() => {
      const now = new Date();
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.dueDate && !task.alerted) {
            const taskTime = new Date(task.dueDate);
            if (now >= taskTime) {
              if (audioUnlocked) bellAudio.current.play().catch(() => {});
              showTempNotification(`Task "${task.title}" is due!`);
              return { ...task, alerted: true };
            }
          }
          return task;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks, audioUnlocked]);

  // ---------------- RENDER ----------------
  return (
    <main className="futuristic-container">
      {/* --- GLOWING ORBS & NOTIFICATIONS --- */}
      <div className="cyber-grid"></div>
      <div className="glowing-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {showNotification && (
        <div className="cyber-notification">
          <div className="cyber-notification-content">
            <span className="notification-icon">🔔</span>
            <span>{notification}</span>
            <button
              className="notification-close"
              onClick={() => setShowNotification(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="app-wrapper">
        {/* --- SIDEBAR --- */}
        <aside className="cyber-sidebar">
          <div className="sidebar-header">
            <h2 className="neon-text">CONNECTIONS</h2>
            <button
              className="user-profile-button"
              onClick={() => setShowUserProfile(true)}
              title="View Profile"
            >
              <div className="user-avatar">
                <span className="avatar-icon">👤</span>
                {incomingRequests.length > 0 && (
                  <span className="notification-badge">
                    {incomingRequests.length}
                  </span>
                )}
              </div>
            </button>
          </div>

          {showUserProfile ? (
            <div className="user-profile-view">
              <div className="profile-header">
                <button
                  className="back-button"
                  onClick={() => setShowUserProfile(false)}
                >
                  ← BACK
                </button>
              </div>
              <div className="profile-content">
                <div className="profile-avatar-large">
                  <span className="avatar-icon-large">👤</span>
                </div>
                <div className="profile-details">
                  <h3 className="profile-name">{currentUser.name}</h3>
                  <p className="profile-email">{currentUser.email}</p>
                  <p className="profile-joined">
                    Member since:{" "}
                    {currentUser.joined
                      ? new Date(currentUser.joined).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-number">{validFriends.length}</span>
                    <span className="stat-label">FRIENDS</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{tasks.length}</span>
                    <span className="stat-label">TASKS</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* FRIEND REQUESTS */}
              {incomingRequests.length > 0 && (
                <div className="cyber-list-section">
                  <h3 className="cyber-subtitle">FRIEND REQUESTS</h3>
                  <div className="scroll-container">
                    <ul className="cyber-list">
                      {incomingRequests.map((req, i) => (
                        <li
                          key={req._id || i}
                          className="cyber-list-item request-item"
                        >
                          <span>{req.name}</span>
                          <div className="request-actions">
                            <button
                              onClick={() => acceptFriendRequest(req._id, req)}
                              className="accept-friend-btn"
                            >
                              ✔
                            </button>
                            <button
                              onClick={() => declineFriendRequest(req._id)}
                              className="decline-friend-btn"
                            >
                              ✖
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* USERS */}
              <div className="cyber-list-section">
                <h3 className="cyber-subtitle">USERS</h3>
                <div className="scroll-container">
                  <ul className="cyber-list">
                    {availableUsers.map((user, i) => (
                      <li key={user._id || i} className="cyber-list-item">
                        <span>{user.name}</span>
                        <button
                          onClick={() => sendFriendRequest(user._id, user.name)}
                          className="add-friend-btn"
                          disabled={sentRequests.includes(user._id)}
                        >
                          {sentRequests.includes(user._id)
                            ? "⏳"
                            : "Add Friend"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* FRIENDS */}
              <div className="cyber-list-section">
                <h3 className="cyber-subtitle">
                  FRIENDS ({validFriends.length})
                </h3>
                <div className="scroll-container">
                  <ul className="cyber-list">
                    {validFriends.map((friend, i) => (
                      <li key={friend._id || i} className="cyber-list-item">
                        <span>{friend.name}</span>
                        <button
                          onClick={() => removeFriend(friend._id, friend.name)}
                          className="remove-friend-btn"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* --- MAIN TASK SECTION --- */}
        <section className="cyber-main">
          <div className="main-header">
            <h1 className="cyber-title">
              <span className="cyber-title-text">NEO TASK</span>
              <span className="cyber-title-cursor pulse">_</span>
            </h1>
          </div>

          <div className="cyber-input-section">
            <input
              type="text"
              placeholder="ENTER NEW TASK..."
              className="cyber-input"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="cyber-date-input"
            />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="cyber-time-input"
            />
            <button onClick={addTask} className="cyber-add-btn">
              ADD
            </button>
          </div>

          <div className="cyber-tasks-container scroll-container">
            {sortedTasks.length > 0 ? (
              <ul className="cyber-task-list">
                {sortedTasks.map((task, i) => (
                  <li key={task._id || i} className="cyber-task-item">
                    <span>
                      {task.owner === currentUser._id ? "" : "👥 "} {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="task-date">
                        ⏰{" "}
                        {format(new Date(task.dueDate), "MM/dd/yyyy, hh:mm a")}
                      </span>
                    )}
                    {task.owner === currentUser._id && (
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="cyber-delete-btn"
                      >
                        ✖
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No tasks yet</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default HomeComponent;
