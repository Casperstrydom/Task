import { useState, useEffect } from "react";
import axios from "axios";
import "../main/index.css";

// Base URL for backend API
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function HomeComponent() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  // Fetch tasks from backend
  useEffect(() => {
    axios
      .get(`${apiBase}/tasks`)
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Add new task
  const addTask = () => {
    if (!newTask.trim()) return;
    axios
      .post(`${apiBase}/tasks`, { title: newTask })
      .then((res) => {
        setTasks([...tasks, res.data]);
        setNewTask("");
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

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  return (
    <main className="futuristic-container">
      <div className="app-wrapper">
        <h1 className="app-title">
          NEO TASK<span className="pulse">_</span>
        </h1>

        {/* Input Section */}
        <div className="input-section">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Enter a new task..."
              className="futuristic-input"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={addTask} className="futuristic-button">
              <span>Add</span>
              <div className="button-overlay"></div>
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="tasks-container">
          {tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task._id} className="task-item">
                  <span className="task-text">{task.title}</span>
                  <div className="task-actions">
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="delete-button"
                    >
                      ✖
                    </button>
                    <div className="glow-bar"></div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="hologram-icon">⊚</div>
              <p>No tasks yet. Add something to get started!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default HomeComponent;
