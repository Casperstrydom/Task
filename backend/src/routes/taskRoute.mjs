// backend/src/routes/taskRoute.js
import express from "express";
import Task from "../models/Task.mjs";
import User from "../models/User.mjs";
import webpush from "web-push";
import { subscriptions } from "../subscriptions.mjs"; // shared subscription store
import auth from "../middleware/auth.mjs"; // auth middleware

const router = express.Router();

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List all tasks visible to me and my friends
 *     tags:
 *       - Tasks
 */
router.get("/", auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate("friends", "_id");
    const friendIds = me.friends.map((f) => f._id);

    // Fetch tasks where owner is me or one of my friends
    const tasks = await Task.find({
      owner: { $in: [req.userId, ...friendIds] },
    }).sort({ createdAt: -1 });

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
 *     summary: Create a new task (only visible to me and my friends)
 *     tags:
 *       - Tasks
 */
router.post("/", auth, async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });
    }

    const task = await Task.create({
      title: title.trim(),
      dueDate: dueDate || null,
      completed: false,
      owner: req.userId,
    });

    // ---- 🔔 Push Notification ----
    const payload = JSON.stringify({
      title: "✅ New Task Created",
      body: `Task: ${task.title}`,
      icon: "/icon.png",
    });

    // Send notifications to unique subscriptions
    const uniqueSubsMap = new Map();
    subscriptions.forEach((sub) => {
      if (!uniqueSubsMap.has(sub.endpoint))
        uniqueSubsMap.set(sub.endpoint, sub);
    });
    const uniqueSubs = Array.from(uniqueSubsMap.values());

    for (const sub of uniqueSubs) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error("Push error:", err);
      }
    }

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
 *     summary: Update a task (only owner can update)
 *     tags:
 *       - Tasks
 */
router.patch("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};

    if (typeof req.body.title === "string" && req.body.title.trim() !== "") {
      update.title = req.body.title.trim();
    }
    if (typeof req.body.completed === "boolean") {
      update.completed = req.body.completed;
    }

    // Only allow update if task owner is current user
    const task = await Task.findOneAndUpdate(
      { _id: id, owner: req.userId },
      update,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or you don't have permission",
      });
    }

    res.status(200).json({ success: true, task });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ success: false, error: "Failed to update task" });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task (only owner can delete)
 *     tags:
 *       - Tasks
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await Task.findOneAndDelete({
      _id: id,
      owner: req.userId,
    });

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: "Task not found or you don't have permission",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      task: deletedTask,
    });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ success: false, error: "Failed to delete task" });
  }
});

// ✅ Export as ESM
export default router;
