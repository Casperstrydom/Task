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
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
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
  const { title } = req.body;
  if (!title || !title.trim())
    return res.status(400).json({ error: "title is required" });

  const task = await Task.create({ title: title.trim() });

  // ---- 🔔 Send Push Notification ----
  const payload = JSON.stringify({
    title: "New Task Created",
    body: `Task: ${task.title}`,
    icon: "/icon.png",
  });

  const sendPromises = subscriptions.map((sub) =>
    webpush.sendNotification(sub, payload).catch((err) => {
      console.error("Push error:", err);
    })
  );

  await Promise.all(sendPromises);

  res.status(201).json(task);
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
  const { id } = req.params;
  const update = {};
  if (typeof req.body.title === "string") update.title = req.body.title.trim();
  if (typeof req.body.completed === "boolean")
    update.completed = req.body.completed;

  const task = await Task.findByIdAndUpdate(id, update, { new: true });
  if (!task) return res.status(404).json({ error: "not found" });

  res.json(task);
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
  const { id } = req.params;
  const deleted = await Task.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "not found" });
  res.status(204).send();
});

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         completed:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
