import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../main/index.css";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function HomeComponent() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
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

  // ---------------- AUTH HEADER HELPER ----------------
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // ---------------- HANDLE TOKEN ERRORS ----------------
  const handleTokenError = (err) => {
    if (err.response?.status === 403) {
      alert("Session expired or invalid token. Please log in again.");
      localStorage.removeItem("token");
    } else {
      console.error(err);
    }
  };

  // ---------------- FETCH FRIEND REQUESTS ----------------
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

    // Tasks
    axios
      .get(`${apiBase}/tasks`, headers)
      .then((res) => setTasks(Array.isArray(res.data) ? res.data : []))
      .catch(handleTokenError);

    // Friends
    axios
      .get(`${apiBase}/friends`, headers)
      .then((res) => setFriends(Array.isArray(res.data) ? res.data : []))
      .catch(handleTokenError);

    // Users
    axios
      .get(`${apiBase}/users`, headers)
      .then((res) => setAllUsers(Array.isArray(res.data) ? res.data : []))
      .catch(handleTokenError);

    // Current User
    axios
      .get(`${apiBase}/user/me`, headers)
      .then((res) => setCurrentUser(res.data || {}))
      .catch(handleTokenError);

    fetchFriendRequests();
  }, [fetchFriendRequests]);

  // ---------------- LOAD DATA ON MOUNT ----------------
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
      dueDate: dueDate && dueTime ? `${dueDate}T${dueTime}:00.000Z` : null,
    };

    axios
      .post(`${apiBase}/tasks`, taskData, headers)
      .then((res) => {
        const newTaskItem = { ...res.data, _id: res.data._id || res.data.id };
        setTasks((prevTasks) => [...prevTasks, newTaskItem]);
        setNewTask("");
        setDueDate("");
        setDueTime("");
      })
      .catch(handleTokenError);
  };

  const deleteTask = (id) => {
    if (!id) return;
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .delete(`${apiBase}/tasks/${id}`, headers)
      .then(() => {
        setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
      })
      .catch(handleTokenError);
  };

  // ---------------- FRIEND REQUEST FUNCTIONS ----------------
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

  const declineFriendRequest = (fromUserId, fromUserName) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .post(`${apiBase}/friend-requests/decline`, { fromUserId }, headers)
      .then(() => {
        setIncomingRequests((prev) => prev.filter((r) => r._id !== fromUserId));
        showTempNotification(`Declined friend request from ${fromUserName}`);
      })
      .catch(handleTokenError);
  };

  const removeFriend = (friendId, friendName) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .delete(`${apiBase}/friends/${friendId}`, headers)
      .then(() => {
        setFriends((prevFriends) => {
          const removedFriend = prevFriends.find((f) => f._id === friendId);
          if (removedFriend) {
            setAllUsers((prevUsers) => [...prevUsers, removedFriend]);
          }
          return prevFriends.filter((f) => f._id !== friendId);
        });
        showTempNotification(`Removed ${friendName} from friends`);
      })
      .catch(handleTokenError);
  };

  // ---------------- UTILS ----------------
  const showTempNotification = (message) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTask();
  };

  // ---------------- FILTERED USERS ----------------
  const availableUsers = Array.isArray(allUsers)
    ? allUsers.filter(
        (user) =>
          user.name?.trim() &&
          !friends.some((f) => f._id === user._id) &&
          user._id !== currentUser._id &&
          !sentRequests.includes(user._id)
      )
    : [];

  const validFriends = Array.isArray(friends)
    ? friends.filter((friend) => friend.name?.trim())
    : [];

  // ---------------- SORTED TASKS ----------------
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  // ---------------- RENDER ----------------
  return (
    <main className="futuristic-container">
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
              {incomingRequests.length > 0 && (
                <div className="cyber-list-section">
                  <h3 className="cyber-subtitle">FRIEND REQUESTS</h3>
                  <div className="scroll-container">
                    <ul className="cyber-list">
                      {incomingRequests.map((req, index) => (
                        <li
                          key={req._id || index}
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
                              onClick={() =>
                                declineFriendRequest(req._id, req.name)
                              }
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

              <div className="cyber-list-section">
                <h3 className="cyber-subtitle">USERS</h3>
                <div className="scroll-container">
                  <ul className="cyber-list">
                    {availableUsers.map((user, index) => (
                      <li key={user._id || index} className="cyber-list-item">
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

              <div className="cyber-list-section">
                <h3 className="cyber-subtitle">
                  FRIENDS ({validFriends.length})
                </h3>
                <div className="scroll-container">
                  <ul className="cyber-list">
                    {validFriends.map((friend, index) => (
                      <li key={friend._id || index} className="cyber-list-item">
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
                {sortedTasks.map((task, index) => (
                  <li key={task._id || index} className="cyber-task-item">
                    <span>{task.title}</span>
                    {task.dueDate && (
                      <span className="task-date">
                        ⏰ {new Date(task.dueDate).toLocaleString()}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="cyber-delete-btn"
                    >
                      ✖
                    </button>
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
