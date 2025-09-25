import React, { useEffect, useState } from "react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function PrivateModePage({ currentUser, togglePrivacy }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchPrivateTasks = async () => {
      try {
        const response = await axios.get(`${apiBase}/tasks/private`, {
          params: { userId: currentUser._id },
        });
        setTasks(response.data);
      } catch (err) {
        console.error("❌ Failed to fetch private tasks:", err);
      }
    };

    fetchPrivateTasks();
  }, [currentUser]);

  if (!currentUser) return <p>Loading...</p>;

  return (
    <div className="private-mode-container">
      <h1>Private Mode</h1>

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

      <div className="private-tasks">
        <h2>Your Private Tasks</h2>
        {tasks.length === 0 ? (
          <p>No private tasks available</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task._id}>
                <strong>{task.title}</strong> - {task.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PrivateModePage;
