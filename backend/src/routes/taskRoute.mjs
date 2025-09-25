// backend/src/routes/taskRoute.mjs
import express from "express";
import Task from "../models/Task.mjs";
import User from "../models/User.mjs";
import webpush from "../webpush.mjs"; // centralized ES module config
import { subscriptions } from "../subscriptions.mjs"; // shared subscription store
import auth from "../middleware/auth.mjs"; // auth middleware

const router = express.Router();

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List all tasks visible to me (my own, my friends’ private tasks, and global public tasks)
 *     tags:
 *       - Tasks
 */
router.get("/", auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate("friends", "_id");
    const friendIds = me?.friends.map((f) => f._id) || [];

    // Fetch tasks:
    // 1. Owned by me
    // 2. Owned by my friends AND marked private
    // 3. Any public task
    const tasks = await Task.find({
      $or: [
        { owner: req.userId },
        { owner: { $in: friendIds }, isPrivate: true },
        { isPrivate: false },
      ],
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
 *     summary: Create a new task (private or public)
 *     tags:
 *       - Tasks
 */
router.post("/", auth, async (req, res) => {
  try {
    const { title, dueDate, isPrivate } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });
    }

    const task = await Task.create({
      title: title.trim(),
      dueDate: dueDate || null,
      completed: false,
      isPrivate: typeof isPrivate === "boolean" ? isPrivate : true, // default private
      owner: req.userId,
    });

    // ---- 🔔 Push Notification ----
    const payload = JSON.stringify({
      title: "✅ New Task Created",
      body: `${task.isPrivate ? "Private" : "Public"} Task: ${task.title}`,
      icon: "/icon.png",
    });

    // Send notifications to unique subscriptions
    const uniqueSubs = [
      ...new Map(subscriptions.map((s) => [s.endpoint, s])).values(),
    ];

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
    if (typeof req.body.isPrivate === "boolean") {
      update.isPrivate = req.body.isPrivate;
    }
    if (req.body.dueDate) {
      update.dueDate = req.body.dueDate;
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
