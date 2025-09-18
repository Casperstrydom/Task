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
router.get("/", async (_req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    console.error("Fetch tasks error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch tasks" });
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
router.post("/", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });
    }

    const task = await Task.create({ title: title.trim() });

    // ---- 🔔 Send Push Notification ----
    const payload = JSON.stringify({
      title: "New Task Created",
      body: `Task: ${task.title}`,
      icon: "/icon.png",
    });

    await Promise.all(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub, payload).catch((err) => {
          console.error("Push error:", err);
        })
      )
    );

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
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    if (typeof req.body.title === "string")
      update.title = req.body.title.trim();
    if (typeof req.body.completed === "boolean")
      update.completed = req.body.completed;

    const task = await Task.findByIdAndUpdate(id, update, { new: true });
    if (!task)
      return res.status(404).json({ success: false, error: "Task not found" });

    res.json({ success: true, task });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ success: false, error: "Failed to update task" });
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
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, error: "Task not found" });

    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ success: false, error: "Failed to delete task" });
  }
});

module.exports = router;
