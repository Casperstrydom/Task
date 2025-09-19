const express = require("express");
const Task = require("../models/Task");
const webpush = require("web-push");
const { subscriptions } = require("../subscriptions"); // shared subscription store

const router = express.Router();

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List all tasks
 *     tags:
 *       - Tasks
 */

// ✅ Get all tasks
router.get("/", async (_req, res) => {
  try {
    // Get all tasks, sorted by newest first
    const tasks = await Task.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    console.error("Fetch tasks error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tasks",
    });
  }
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags:
 *       - Tasks
 */

// ✅ Create a task
router.post("/", async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });
    }

    // Save task in MongoDB
    const task = await Task.create({
      title: title.trim(),
      dueDate: dueDate || null,
      completed: false,
    });

    // ---- 🔔 Send Push Notification ----
    const payload = JSON.stringify({
      title: "✅ New Task Created",
      body: `Task: ${task.title}`,
      icon: "/icon.png",
    });

    // Prevent duplicate notifications by unique endpoint
    const uniqueSubsMap = new Map();
    subscriptions.forEach((sub) => {
      if (!uniqueSubsMap.has(sub.endpoint)) {
        uniqueSubsMap.set(sub.endpoint, sub);
      }
    });
    const uniqueSubs = Array.from(uniqueSubsMap.values());

    for (const sub of uniqueSubs) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error("Push error:", err);
      }
    }

    // ✅ Respond with saved task
    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ success: false, error: "Failed to create task" });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags:
 *       - Tasks
 */

// ✅ Update a task
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};

    if (typeof req.body.title === "string" && req.body.title.trim() !== "") {
      update.title = req.body.title.trim();
    }

    if (typeof req.body.completed === "boolean") {
      update.completed = req.body.completed;
    }

    const task = await Task.findByIdAndUpdate(id, update, {
      new: true, // return updated doc
      runValidators: true, // make sure updates respect schema
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update task",
    });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags:
 *       - Tasks
 */
// ✅ Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      task: deletedTask, // optional: return the deleted task if frontend needs it
    });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete task",
    });
  }
});

module.exports = router;
