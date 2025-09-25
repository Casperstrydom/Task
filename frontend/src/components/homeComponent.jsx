import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../main/index.css";
import { format } from "date-fns";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function HomeComponent() {
  // ---------------- STATE ----------------
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("12:00");
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    _id: null,
    name: "",
    email: "",
    joined: "",
    isPrivate: false, // New privacy setting
  });
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [customTime, setCustomTime] = useState("12:00");
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDueTime, setEditDueTime] = useState("12:00");
  const [timeTracking, setTimeTracking] = useState({}); // { taskId: { startTime: Date, elapsed: number } }

  // ---------------- AUDIO ----------------
  const bellAudio = useRef(new Audio("/bell.mp3"));
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // ---------------- AUTH ----------------
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const handleTokenError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
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
      .then((res) => setCurrentUser(res.data || { isPrivate: false }))
      .catch(handleTokenError);

    fetchFriendRequests();
  }, [fetchFriendRequests]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchFriendRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchData, fetchFriendRequests]);

  // ---------------- PRIVACY TOGGLE ----------------
  const navigate = useNavigate(); // ✅ no-undef fixed

  const togglePrivacy = () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    const newPrivacyState = !currentUser.isPrivate;

    axios
      .put(`${apiBase}/user/privacy`, { isPrivate: newPrivacyState }, headers)
      .then(() => {
        setCurrentUser((prev) => ({ ...prev, isPrivate: newPrivacyState }));

        showTempNotification(
          `Profile is now ${newPrivacyState ? "private" : "public"}`
        );

        // 👇 redirect depending on state
        if (newPrivacyState) {
          navigate("/home-private");
        } else {
          navigate("/home");
        }
      })
      .catch(handleTokenError);
  };
  // Only show tasks that belong to current user or their friends
  const filteredTasks = tasks.filter(
    (task) =>
      task.owner === currentUser._id || // always show my own tasks
      friends.some((friend) => friend._id === task.owner) // or my friends' tasks
  );

  // ---------------- DATE/TIME PICKER FUNCTIONS ----------------
  const openDateTimePicker = () => {
    setShowDateTimePicker(true);
    setCustomDate(dueDate ? new Date(dueDate) : new Date());
    setCustomTime(dueTime || "12:00");
  };

  const applyDateTime = () => {
    const dateStr = customDate.toISOString().split("T")[0];
    setDueDate(dateStr);
    setDueTime(customTime);
    setShowDateTimePicker(false);
  };

  const quickSetDateTime = (minutesFromNow) => {
    const now = new Date();
    const newDate = new Date(now.getTime() + minutesFromNow * 60000);
    setDueDate(newDate.toISOString().split("T")[0]);
    setDueTime(
      `${String(newDate.getHours()).padStart(2, "0")}:${String(
        newDate.getMinutes()
      ).padStart(2, "0")}`
    );
    setShowDateTimePicker(false);
  };

  const clearDateTime = () => {
    setDueDate("");
    setDueTime("12:00");
    setShowDateTimePicker(false);
  };

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
        setDueTime("12:00");
      })
      .catch(handleTokenError);
  };

  const deleteTask = (id) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    axios
      .delete(`${apiBase}/tasks/${id}`, headers)
      .then(() => {
        setTasks((prev) => prev.filter((t) => t._id !== id));
        // Stop time tracking if this task was being tracked
        if (timeTracking[id]) {
          setTimeTracking((prev) => {
            const newTracking = { ...prev };
            delete newTracking[id];
            return newTracking;
          });
        }
      })
      .catch(handleTokenError);
  };

  // ---------------- TASK EDITING ----------------
  const startEditing = (task) => {
    setEditingTask(task._id);
    setEditTaskTitle(task.title);
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      setEditDueDate(date.toISOString().split("T")[0]);
      setEditDueTime(
        `${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`
      );
    } else {
      setEditDueDate("");
      setEditDueTime("12:00");
    }
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditTaskTitle("");
    setEditDueDate("");
    setEditDueTime("");
  };

  const saveTaskEdit = (taskId) => {
    if (!editTaskTitle.trim()) return;
    const headers = getAuthHeaders();
    if (!headers) return;

    const taskData = {
      title: editTaskTitle,
      dueDate:
        editDueDate && editDueTime ? `${editDueDate}T${editDueTime}:00` : null,
    };

    axios
      .put(`${apiBase}/tasks/${taskId}`, taskData, headers)
      .then((res) => {
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId ? { ...task, ...res.data.task } : task
          )
        );
        setEditingTask(null);
        setEditTaskTitle("");
        setEditDueDate("");
        setEditDueTime("");
        showTempNotification("Task updated successfully");
      })
      .catch(handleTokenError);
  };

  // ---------------- TIME TRACKING ----------------
  const startTimeTracking = (taskId) => {
    setTimeTracking((prev) => ({
      ...prev,
      [taskId]: {
        startTime: new Date(),
        elapsed: prev[taskId]?.elapsed || 0,
      },
    }));
    showTempNotification("Time tracking started");
  };

  const stopTimeTracking = (taskId) => {
    if (timeTracking[taskId]) {
      const elapsed =
        timeTracking[taskId].elapsed +
        (new Date() - timeTracking[taskId].startTime);

      setTimeTracking((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          elapsed: elapsed,
        },
      }));
      showTempNotification("Time tracking stopped");
    }
  };

  const resetTimeTracking = (taskId) => {
    setTimeTracking((prev) => ({
      ...prev,
      [taskId]: {
        startTime: prev[taskId]?.startTime || null,
        elapsed: 0,
      },
    }));
  };

  const getElapsedTime = (taskId) => {
    if (!timeTracking[taskId]) return 0;

    const { startTime, elapsed } = timeTracking[taskId];
    if (startTime) {
      return elapsed + (new Date() - startTime);
    }
    return elapsed;
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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
  const sortedTasks = [...filteredTasks].sort((a, b) => {
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

      {showDateTimePicker && (
        <div className="datetime-picker-overlay">
          <div className="datetime-picker-modal">
            <div className="datetime-picker-header">
              <h3>SET DATE & TIME</h3>
              <button
                className="close-picker-btn"
                onClick={() => setShowDateTimePicker(false)}
              >
                ×
              </button>
            </div>

            <div className="datetime-picker-content">
              <div className="date-section">
                <h4>DATE</h4>
                <div className="calendar-container">
                  <div className="calendar-nav">
                    <button
                      onClick={() =>
                        setCustomDate(
                          new Date(
                            customDate.getFullYear(),
                            customDate.getMonth() - 1,
                            1
                          )
                        )
                      }
                      className="nav-btn"
                    >
                      ◀
                    </button>
                    <span className="current-month">
                      {customDate.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() =>
                        setCustomDate(
                          new Date(
                            customDate.getFullYear(),
                            customDate.getMonth() + 1,
                            1
                          )
                        )
                      }
                      className="nav-btn"
                    >
                      ▶
                    </button>
                  </div>
                  <div className="calendar-grid">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div key={`${day}-${i}`} className="calendar-day-header">
                        {day}
                      </div>
                    ))}

                    {Array.from(
                      {
                        length: new Date(
                          customDate.getFullYear(),
                          customDate.getMonth() + 1,
                          0
                        ).getDate(),
                      },
                      (_, i) => {
                        const day = i + 1;
                        const date = new Date(
                          customDate.getFullYear(),
                          customDate.getMonth(),
                          day
                        );
                        const isToday =
                          date.toDateString() === new Date().toDateString();
                        const isSelected =
                          date.toDateString() === customDate.toDateString();

                        return (
                          <button
                            key={day}
                            className={`calendar-day ${
                              isToday ? "today" : ""
                            } ${isSelected ? "selected" : ""}`}
                            onClick={() => setCustomDate(date)}
                          >
                            {day}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              <div className="time-section">
                <h4>TIME</h4>
                <div className="time-input-container">
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="cyber-time-input"
                  />
                </div>
                <div className="quick-time-buttons">
                  <button
                    onClick={() => quickSetDateTime(30)}
                    className="quick-time-btn"
                  >
                    30 MIN
                  </button>
                  <button
                    onClick={() => quickSetDateTime(60)}
                    className="quick-time-btn"
                  >
                    1 HOUR
                  </button>
                  <button
                    onClick={() => quickSetDateTime(1440)}
                    className="quick-time-btn"
                  >
                    TOMORROW
                  </button>
                </div>
              </div>
            </div>

            <div className="datetime-picker-footer">
              <button onClick={clearDateTime} className="clear-datetime-btn">
                CLEAR
              </button>
              <button onClick={applyDateTime} className="apply-datetime-btn">
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-wrapper">
        {/* SIDEBAR */}
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

                {/* PRIVACY TOGGLE IN PROFILE */}
                <div className="privacy-section">
                  <h4>PRIVACY SETTINGS</h4>
                  <div className="privacy-toggle">
                    <span>Private Mode:</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={currentUser.isPrivate}
                        onChange={togglePrivacy}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span
                      className={`privacy-status ${
                        currentUser.isPrivate ? "private" : "public"
                      }`}
                    >
                      {currentUser.isPrivate ? "PRIVATE" : "PUBLIC"}
                    </span>
                  </div>
                  <p className="privacy-description">
                    {currentUser.isPrivate
                      ? "Your tasks are hidden from friends"
                      : "Friends can see your tasks"}
                  </p>
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

              <div className="cyber-list-section">
                <div className="friends-header">
                  <h3 className="cyber-subtitle">
                    FRIENDS ({validFriends.length})
                  </h3>
                  {/* PRIVACY TOGGLE QUICK ACCESS */}
                  <div className="privacy-toggle-quick">
                    <label className="toggle-switch small">
                      <input
                        type="checkbox"
                        checked={currentUser.isPrivate}
                        onChange={togglePrivacy}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="privacy-label">
                      {currentUser.isPrivate ? "🔒 Private" : "🔓 Public"}
                    </span>
                  </div>
                </div>
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

        {/* MAIN TASK SECTION */}
        <section className="cyber-main">
          <div className="main-header">
            <h1 className="cyber-title">
              <span className="cyber-title-text">NEO TASK</span>
              <span className="cyber-title-cursor pulse">_</span>
            </h1>
            <div className="privacy-indicator">
              <span
                className={`privacy-badge ${
                  currentUser.isPrivate ? "private" : "public"
                }`}
              >
                {currentUser.isPrivate ? "🔒 PRIVATE MODE" : "🔓 PUBLIC MODE"}
              </span>
            </div>
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

            <div className="datetime-input-container">
              <button
                onClick={openDateTimePicker}
                className="datetime-trigger-btn"
              >
                ⏰{" "}
                {dueDate
                  ? format(new Date(`${dueDate}T${dueTime}`), "MM/dd/yy HH:mm")
                  : "SET TIME"}
              </button>
            </div>

            <button onClick={addTask} className="cyber-add-btn">
              ADD
            </button>
          </div>

          <div className="cyber-tasks-container scroll-container">
            {sortedTasks.length > 0 ? (
              <ul className="cyber-task-list">
                {sortedTasks.map((task) => (
                  <li key={task._id} className="cyber-task-item">
                    {editingTask === task._id ? (
                      <div className="task-edit-mode">
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          className="edit-task-input"
                          onKeyPress={(e) =>
                            e.key === "Enter" && saveTaskEdit(task._id)
                          }
                        />
                        <div className="edit-controls">
                          <button
                            onClick={() => saveTaskEdit(task._id)}
                            className="save-edit-btn"
                          >
                            💾
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="cancel-edit-btn"
                          >
                            ✖
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="task-content">
                          <span>
                            {task.owner === currentUser._id ? "" : "👥 "}{" "}
                            {task.title}
                          </span>
                          {task.dueDate && (
                            <span className="task-date">
                              ⏰{" "}
                              {format(
                                new Date(task.dueDate),
                                "MM/dd/yyyy, hh:mm a"
                              )}
                            </span>
                          )}
                        </div>

                        {/* TIME TRACKING DISPLAY */}
                        {timeTracking[task._id] && (
                          <div className="time-tracking-display">
                            <span className="tracked-time">
                              ⏱️ {formatTime(getElapsedTime(task._id))}
                            </span>
                          </div>
                        )}

                        <div className="task-actions">
                          {/* TIME TRACKING BUTTONS */}
                          {task.owner === currentUser._id && (
                            <div className="time-tracking-buttons">
                              {timeTracking[task._id]?.startTime ? (
                                <button
                                  onClick={() => stopTimeTracking(task._id)}
                                  className="stop-time-btn"
                                  title="Stop tracking"
                                >
                                  ⏹️
                                </button>
                              ) : (
                                <button
                                  onClick={() => startTimeTracking(task._id)}
                                  className="start-time-btn"
                                  title="Start time tracking"
                                >
                                  ⏱️
                                </button>
                              )}
                              {timeTracking[task._id] && (
                                <button
                                  onClick={() => resetTimeTracking(task._id)}
                                  className="reset-time-btn"
                                  title="Reset timer"
                                >
                                  🔄
                                </button>
                              )}
                            </div>
                          )}

                          {/* EDIT BUTTON */}
                          {task.owner === currentUser._id && (
                            <button
                              onClick={() => startEditing(task)}
                              className="edit-task-btn"
                              title="Edit task"
                            >
                              ✏️
                            </button>
                          )}

                          {/* DELETE BUTTON */}
                          {task.owner === currentUser._id && (
                            <button
                              onClick={() => deleteTask(task._id)}
                              className="cyber-delete-btn"
                            >
                              ✖
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-tasks-message">
                {currentUser.isPrivate
                  ? "No private tasks yet"
                  : "No tasks yet"}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default HomeComponent;
