const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// ---------------- USERS ----------------

// GET /users → fetch all users (except me)
router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.userId } },
      "name email createdAt"
    ).sort({ createdAt: -1 });

    res.json(users); // 👈 return array directly
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /user/me → get logged-in user
router.get("/user/me", auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).select("name email createdAt");
    if (!me) return res.status(404).json({ error: "User not found" });
    res.json(me);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ---------------- FRIEND SYSTEM ----------------

// GET /friends → list of my friends
router.get("/friends", auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate(
      "friends",
      "name email"
    );
    res.json(me.friends);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// GET /friend-requests/incoming
router.get("/friend-requests/incoming", auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate(
      "friendRequests",
      "name email"
    );
    res.json(me.friendRequests || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incoming requests" });
  }
});

// GET /friend-requests/sent
router.get("/friend-requests/sent", auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate(
      "sentRequests",
      "name email"
    );
    res.json(me.sentRequests || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sent requests" });
  }
});

// POST /friend-requests → send request
router.post("/friend-requests", auth, async (req, res) => {
  const { toUserId } = req.body;
  try {
    const me = await User.findById(req.userId);
    const recipient = await User.findById(toUserId);
    if (!recipient) return res.status(404).json({ error: "User not found" });

    if (me.friends.includes(recipient._id))
      return res.status(400).json({ error: "Already friends" });

    if (!me.sentRequests.includes(recipient._id)) {
      me.sentRequests.push(recipient._id);
      recipient.friendRequests.push(me._id);
      await me.save();
      await recipient.save();
    }

    res.json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send request" });
  }
});

// POST /friend-requests/accept
router.post("/friend-requests/accept", auth, async (req, res) => {
  const { fromUserId } = req.body;
  try {
    const me = await User.findById(req.userId);
    const sender = await User.findById(fromUserId);
    if (!sender) return res.status(404).json({ error: "User not found" });

    // remove from pending
    me.friendRequests = me.friendRequests.filter(
      (id) => id.toString() !== sender._id.toString()
    );
    sender.sentRequests = sender.sentRequests.filter(
      (id) => id.toString() !== me._id.toString()
    );

    // add to friends
    if (!me.friends.includes(sender._id)) me.friends.push(sender._id);
    if (!sender.friends.includes(me._id)) sender.friends.push(me._id);

    await me.save();
    await sender.save();

    res.json({ message: "Friend request accepted", friend: sender });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept request" });
  }
});

// POST /friend-requests/decline
router.post("/friend-requests/decline", auth, async (req, res) => {
  const { fromUserId } = req.body;
  try {
    const me = await User.findById(req.userId);
    const sender = await User.findById(fromUserId);
    if (!sender) return res.status(404).json({ error: "User not found" });

    me.friendRequests = me.friendRequests.filter(
      (id) => id.toString() !== sender._id.toString()
    );
    sender.sentRequests = sender.sentRequests.filter(
      (id) => id.toString() !== me._id.toString()
    );

    await me.save();
    await sender.save();

    res.json({ message: "Friend request declined" });
  } catch (err) {
    res.status(500).json({ error: "Failed to decline request" });
  }
});

// DELETE /friends/:id → remove friend
router.delete("/friends/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const me = await User.findById(req.userId);
    const friend = await User.findById(id);
    if (!friend) return res.status(404).json({ error: "Friend not found" });

    me.friends = me.friends.filter(
      (fid) => fid.toString() !== friend._id.toString()
    );
    friend.friends = friend.friends.filter(
      (fid) => fid.toString() !== me._id.toString()
    );

    await me.save();
    await friend.save();

    res.json({ message: "Friend removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

// ---------------- GROUPS (placeholder) ----------------
router.get("/groups", (_req, res) => {
  res.json([
    { _id: "1", name: "Developers" },
    { _id: "2", name: "Designers" },
  ]);
});

module.exports = router;
