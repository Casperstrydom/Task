const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET /users → fetch all users
router.get("/users", async (_req, res) => {
  try {
    const users = await User.find({}, "name email"); // return only name and email
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /user/me → fetch current user (temporary placeholder)
router.get("/user/me", async (_req, res) => {
  try {
    const user = await User.findOne(); // for now, just return first user
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ name: user.name, email: user.email, joined: user.createdAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// GET /friends → return mock friends
router.get("/friends", async (_req, res) => {
  try {
    const friends = await User.find().limit(3); // first 3 users as "friends"
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// GET /groups → return mock groups
router.get("/groups", (_req, res) => {
  const groups = [
    { _id: "1", name: "Developers" },
    { _id: "2", name: "Designers" },
  ];
  res.json(groups);
});

module.exports = router;
