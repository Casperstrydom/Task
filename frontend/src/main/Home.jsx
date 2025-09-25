import React, { useEffect, useState } from "react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function Home() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Fetch only public tasks
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${apiBase}/tasks/public`);
        setTasks(response.data);
      } catch (err) {
        console.error("❌ Failed to fetch tasks:", err);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="home-container">
      <h1>Public Tasks</h1>
      {tasks.length === 0 ? (
        <p>No public tasks available</p>
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
  );
}

export default Home;
