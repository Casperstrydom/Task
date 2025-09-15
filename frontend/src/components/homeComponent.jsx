import { useState, useEffect } from "react";
import axios from "axios";
import "../main/index.css";

// Base URL for backend API
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function HomeComponent() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "USER_01",
    email: "user01@nexus.com",
    joined: "2023-11-15",
  });

  // ============ PUSH NOTIFICATIONS ============
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (reg) => {
          console.log("✅ Service Worker registered:", reg);

          // Get vapidPublicKey from backend
          const { data } = await axios.get(`${apiBase}/vapidPublicKey`);
          const vapidKey = urlBase64ToUint8Array(data.publicKey);

          // Ask user permission
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.warn("🚫 Push notifications permission denied");
            return;
          }

          // Subscribe user
          const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          });

          console.log("📡 Push Subscription:", subscription);

          // Send subscription to backend
          await axios.post(`${apiBase}/subscribe`, subscription);
        })
        .catch((err) => console.error("❌ SW registration failed:", err));
    }
  }, []);

  // Helper: convert VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // ============ DATA FETCH ============
  useEffect(() => {
    axios
      .get(`${apiBase}/tasks`)
      .then((res) => setTasks(res.data))
      .catch(console.error);
    axios
      .get(`${apiBase}/friends`)
      .then((res) => setFriends(res.data))
      .catch(console.error);
    axios
      .get(`${apiBase}/users`)
      .then((res) => setAllUsers(res.data))
      .catch(console.error);
    axios
      .get(`${apiBase}/groups`)
      .then((res) => setGroups(res.data))
      .catch(console.error);
    axios
      .get(`${apiBase}/user/me`)
      .then((res) => setCurrentUser(res.data))
      .catch(console.error);
  }, []);

  // ============ TASKS ============
  const addTask = () => {
    if (!newTask.trim()) return;
    const taskData = {
      title: newTask,
      dueDate: dueDate && dueTime ? new Date(`${dueDate}T${dueTime}`) : null,
    };
    axios
      .post(`${apiBase}/tasks`, taskData)
      .then((res) => {
        setTasks([...tasks, res.data]);
        setNewTask("");
        setDueDate("");
        setDueTime("");
      })
      .catch(console.error);
  };

  const deleteTask = (id) => {
    axios
      .delete(`${apiBase}/tasks/${id}`)
      .then(() => setTasks(tasks.filter((t) => t._id !== id)))
      .catch(console.error);
  };

  // ============ FRIENDS ============
  const addFriend = (userId) => {
    axios
      .post(`${apiBase}/friends`, { friendId: userId })
      .then((res) => {
        setFriends([...friends, res.data]);
        setAllUsers(allUsers.filter((u) => u._id !== userId));
      })
      .catch(console.error);
  };

  const removeFriend = (friendId) => {
    axios
      .delete(`${apiBase}/friends/${friendId}`)
      .then(() => setFriends(friends.filter((f) => f._id !== friendId)))
      .catch(console.error);
  };

  // ============ GROUPS ============
  const createGroup = () => {
    const groupName = prompt("Enter group name:");
    if (groupName) {
      axios
        .post(`${apiBase}/groups`, { name: groupName })
        .then((res) => setGroups([...groups, res.data]))
        .catch(console.error);
    }
  };

  // ============ INPUT HANDLER ============
  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTask();
  };

  const availableUsers = allUsers.filter(
    (user) =>
      !friends.some((friend) => friend._id === user._id) &&
      user._id !== "current-user-id"
  );

  // ============ RENDER ============
  return (
    <main className="futuristic-container">
      {/* Animated background elements */}
      <div className="cyber-grid"></div>
      <div className="glowing-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="app-wrapper">
        {/* Sidebar */}
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
              </div>
            </button>
          </div>

          {showUserProfile ? (
            /* User Profile View */
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
                    {new Date(currentUser.joined).toLocaleDateString()}
                  </p>
                </div>

                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-number">{friends.length}</span>
                    <span className="stat-label">FRIENDS</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{groups.length}</span>
                    <span className="stat-label">GROUPS</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{tasks.length}</span>
                    <span className="stat-label">TASKS</span>
                  </div>
                </div>

                <button className="cyber-button cyber-button-primary full-width">
                  <span className="cyber-button-text">EDIT PROFILE</span>
                </button>

                <button
                  className="cyber-button logout-button"
                  onClick={() => (window.location.href = "/login")}
                >
                  <span className="cyber-button-text">LOGOUT</span>
                </button>
              </div>
            </div>
          ) : (
            /* Normal Sidebar Content */
            <>
              <input
                type="text"
                placeholder="Search users..."
                className="cyber-search"
              />

              <button
                className="cyber-button cyber-button-primary"
                onClick={createGroup}
              >
                <span className="cyber-button-glitch">➕</span>
                <span className="cyber-button-text">CREATE GROUP</span>
              </button>

              {/* Add Friends Section */}
              <div className="cyber-list-section">
                <div className="section-header">
                  <h3 className="cyber-subtitle">ADD FRIENDS</h3>
                  <button
                    className="toggle-button"
                    onClick={() => setShowAddFriends(!showAddFriends)}
                  >
                    {showAddFriends ? "▲" : "▼"}
                  </button>
                </div>
                {showAddFriends && (
                  <div className="scroll-container">
                    <ul className="cyber-list">
                      {availableUsers.length > 0 ? (
                        availableUsers.map((user) => (
                          <li key={user._id} className="cyber-list-item">
                            <span className="status-indicator offline"></span>
                            <span>{user.name}</span>
                            <button
                              onClick={() => addFriend(user._id)}
                              className="add-friend-btn"
                              title="Add Friend"
                            >
                              +
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="cyber-list-item empty">
                          <span>No users available to add</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Friends Network Section */}
              <div className="cyber-list-section">
                <h3 className="cyber-subtitle">FRIENDS NETWORK</h3>
                <div className="scroll-container">
                  <ul className="cyber-list">
                    {friends.length > 0 ? (
                      friends.map((friend) => (
                        <li key={friend._id} className="cyber-list-item">
                          <span className="status-indicator online"></span>
                          <span>{friend.name}</span>
                          <button
                            onClick={() => removeFriend(friend._id)}
                            className="remove-friend-btn"
                            title="Remove Friend"
                          >
                            ×
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="cyber-list-item empty">
                        <span>No friends yet</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Group Channels Section */}
              <div className="cyber-list-section">
                <h3 className="cyber-subtitle">GROUP CHANNELS</h3>
                <div className="scroll-container">
                  <ul className="cyber-list">
                    {groups.length > 0 ? (
                      groups.map((group) => (
                        <li key={group._id} className="cyber-list-item">
                          <span className="channel-tag">#</span>
                          <span>{group.name}</span>
                        </li>
                      ))
                    ) : (
                      <li className="cyber-list-item empty">
                        <span>No groups yet</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main Task Area */}
        <section className="cyber-main">
          <div className="main-header">
            <h1 className="cyber-title">
              <span className="cyber-title-text">NEO TASK</span>
              <span className="cyber-title-cursor pulse">_</span>
            </h1>
            <div className="user-status">
              <span className="user-badge">{currentUser.name}</span>
            </div>
          </div>

          {/* Input Section */}
          <div className="cyber-input-section">
            <div className="cyber-input-wrapper">
              <input
                type="text"
                placeholder="ENTER NEW TASK..."
                className="cyber-input"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={handleKeyPress}
              />

              <div className="datetime-inputs">
                <div className="input-group">
                  <label className="input-label">DATE</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="cyber-date-input"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">TIME</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="cyber-time-input"
                  />
                </div>

                <button onClick={addTask} className="cyber-add-btn">
                  <span className="btn-hacker-text">ADD</span>
                  <div className="btn-overlay"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="cyber-tasks-container scroll-container">
            {tasks.length > 0 ? (
              <ul className="cyber-task-list">
                {tasks.map((task) => (
                  <li key={task._id} className="cyber-task-item">
                    <div className="task-content">
                      <span className="task-checkbox">
                        <input type="checkbox" className="cyber-checkbox" />
                        <span className="checkmark"></span>
                      </span>
                      <span className="task-text">{task.title}</span>
                      {task.dueDate && (
                        <span className="task-date">
                          ⏰ {new Date(task.dueDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="task-actions">
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="cyber-delete-btn"
                      >
                        <span className="delete-icon">✖</span>
                        <span className="tooltip">DELETE</span>
                      </button>
                    </div>
                    <div className="cyber-glow-bar"></div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="cyber-empty-state">
                <div className="hologram-icon">⊚</div>
                <p>SYSTEM READY. AWAITING TASKS.</p>
                <div className="scan-line"></div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default HomeComponent;
