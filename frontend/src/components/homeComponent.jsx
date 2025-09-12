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

  // Fetch tasks from backend
  useEffect(() => {
    axios
      .get(`${apiBase}/tasks`)
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));

    // Fetch friends
    axios
      .get(`${apiBase}/friends`)
      .then((res) => setFriends(res.data))
      .catch((err) => console.error("Error fetching friends:", err));

    // Fetch all users (for adding friends)
    axios
      .get(`${apiBase}/users`)
      .then((res) => setAllUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));

    // Fetch groups
    axios
      .get(`${apiBase}/groups`)
      .then((res) => setGroups(res.data))
      .catch((err) => console.error("Error fetching groups:", err));
  }, []);

  // Add new task
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
      .catch((err) => console.error(err));
  };

  // Delete task
  const deleteTask = (id) => {
    axios
      .delete(`${apiBase}/tasks/${id}`)
      .then(() => {
        setTasks(tasks.filter((task) => task._id !== id));
      })
      .catch((err) => console.error(err));
  };

  // Add friend
  const addFriend = (userId) => {
    axios
      .post(`${apiBase}/friends`, { friendId: userId })
      .then((res) => {
        setFriends([...friends, res.data]);
        // Remove from allUsers to avoid duplicate adding
        setAllUsers(allUsers.filter((user) => user._id !== userId));
      })
      .catch((err) => console.error("Error adding friend:", err));
  };

  // Remove friend
  const removeFriend = (friendId) => {
    axios
      .delete(`${apiBase}/friends/${friendId}`)
      .then(() => {
        setFriends(friends.filter((friend) => friend._id !== friendId));
      })
      .catch((err) => console.error("Error removing friend:", err));
  };

  // Create group
  const createGroup = () => {
    const groupName = prompt("Enter group name:");
    if (groupName) {
      axios
        .post(`${apiBase}/groups`, { name: groupName })
        .then((res) => {
          setGroups([...groups, res.data]);
        })
        .catch((err) => console.error("Error creating group:", err));
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  // Filter out users who are already friends
  const availableUsers = allUsers.filter(
    (user) =>
      !friends.some((friend) => friend._id === user._id) &&
      user._id !== "current-user-id" // Replace with actual current user ID logic
  );

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
          </div>

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
        </aside>

        {/* Main Task Area */}
        <section className="cyber-main">
          <div className="main-header">
            <h1 className="cyber-title">
              <span className="cyber-title-text">NEO TASK</span>
              <span className="cyber-title-cursor pulse">_</span>
            </h1>
            <div className="user-status">
              <span className="user-badge">USER_01</span>
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
