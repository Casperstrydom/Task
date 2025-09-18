import { useState, useEffect, useCallback } from "react";
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

  // Fetch friend requests
  const fetchFriendRequests = useCallback(() => {
    axios
      .get(`${apiBase}/friend-requests/incoming`)
      .then((res) => setIncomingRequests(res.data))
      .catch(console.error);

    axios
      .get(`${apiBase}/friend-requests/sent`)
      .then((res) => setSentRequests(res.data.map((u) => u._id))) // store just IDs
      .catch(console.error);
  }, []);

  // Fetch initial data
  const fetchData = useCallback(() => {
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
      .get(`${apiBase}/user/me`)
      .then((res) => setCurrentUser(res.data))
      .catch(console.error);

    fetchFriendRequests();
  }, [fetchFriendRequests]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchFriendRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData, fetchFriendRequests]);

  // Add new task
  const addTask = () => {
    if (!newTask.trim()) return;
    const taskData = {
      title: newTask,
      dueDate: dueDate && dueTime ? `${dueDate}T${dueTime}:00.000Z` : null,
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

  // Delete task
  const deleteTask = (id) => {
    axios
      .delete(`${apiBase}/tasks/${id}`)
      .then(() => setTasks(tasks.filter((task) => task._id !== id)))
      .catch(console.error);
  };

  // Friend request actions
  const sendFriendRequest = (userId, userName) => {
    axios
      .post(`${apiBase}/friend-requests`, { toUserId: userId })
      .then(() => {
        setSentRequests((prev) => [...prev, userId]);
        showTempNotification(`Friend request sent to ${userName}`);
      })
      .catch(console.error);
  };

  const acceptFriendRequest = (fromUserId, fromUser) => {
    axios
      .post(`${apiBase}/friend-requests/accept`, { fromUserId })
      .then(() => {
        setFriends((prev) => [...prev, fromUser]);
        setIncomingRequests((prev) => prev.filter((r) => r._id !== fromUserId));
        showTempNotification(`${fromUser.name} is now your friend!`);
        fetchData();
      })
      .catch(console.error);
  };

  const declineFriendRequest = (fromUserId, fromUserName) => {
    axios
      .post(`${apiBase}/friend-requests/decline`, { fromUserId })
      .then(() => {
        setIncomingRequests((prev) => prev.filter((r) => r._id !== fromUserId));
        showTempNotification(`Declined friend request from ${fromUserName}`);
      })
      .catch(console.error);
  };

  // Remove friend
  const removeFriend = (friendId, friendName) => {
    axios
      .delete(`${apiBase}/friends/${friendId}`)
      .then(() => {
        setFriends((prevFriends) => {
          const removedFriend = prevFriends.find((f) => f._id === friendId);

          // ✅ Only add back if we found them
          if (removedFriend) {
            setAllUsers((prevUsers) => [...prevUsers, removedFriend]);
          }

          // ✅ Return filtered list
          return prevFriends.filter((f) => f._id !== friendId);
        });

        showTempNotification(`Removed ${friendName} from friends`);
      })
      .catch(console.error);
  };

  // Notifications
  const showTempNotification = (message) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Input handler
  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTask();
  };

  // Filters
  const availableUsers = allUsers.filter(
    (user) =>
      user.name?.trim() &&
      !friends.some((f) => f._id === user._id) &&
      user._id !== currentUser._id &&
      !sentRequests.includes(user._id)
  );

  const validFriends = friends.filter((friend) => friend.name?.trim());

  return (
    <main className="futuristic-container">
      <div className="cyber-grid"></div>
      <div className="glowing-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Notification Popup */}
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

          {/* USER PROFILE */}
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
                    {new Date(currentUser.joined).toLocaleDateString()}
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
                      {incomingRequests.map((req) => (
                        <li
                          key={req._id}
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

              {/* USERS TO ADD AS FRIENDS */}
              <div className="cyber-list-section">
                <h3 className="cyber-subtitle">USERS</h3>
                <div className="scroll-container">
                  <ul className="cyber-list">
                    {availableUsers.map((user) => (
                      <li key={user._id} className="cyber-list-item">
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

              {/* FRIENDS NETWORK */}
              <div className="cyber-list-section">
                <h3 className="cyber-subtitle">
                  FRIENDS ({validFriends.length})
                </h3>
                <div className="scroll-container">
                  <ul className="cyber-list">
                    {validFriends.map((friend) => (
                      <li key={friend._id} className="cyber-list-item">
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

        {/* MAIN TASK AREA */}
        <section className="cyber-main">
          <div className="main-header">
            <h1 className="cyber-title">
              <span className="cyber-title-text">NEO TASK</span>
              <span className="cyber-title-cursor pulse">_</span>
            </h1>
          </div>

          {/* ADD TASK */}
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

          {/* TASK LIST */}
          <div className="cyber-tasks-container scroll-container">
            {tasks.length > 0 ? (
              <ul className="cyber-task-list">
                {tasks.map((task) => (
                  <li key={task._id} className="cyber-task-item">
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
