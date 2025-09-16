const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET /users → fetch all users
router.get("/users", async (_req, res) => {
  try {
    const users = await User.find({}, "name email"); // return only name + email
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /user/me → placeholder: just return first user
router.get("/user/me", async (_req, res) => {
  try {
    const user = await User.findOne(); // later: use auth middleware
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      joined: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// GET /friends → mock friends (first 3 users)
router.get("/friends", async (_req, res) => {
  try {
    const friends = await User.find().limit(3);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// ✅ Friend Requests

// GET /friend-requests/incoming
router.get("/friend-requests/incoming", async (_req, res) => {
  try {
    const me = await User.findOne().populate("friendRequests", "name email");
    res.json(me.friendRequests || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incoming requests" });
  }
});

// GET /friend-requests/sent
router.get("/friend-requests/sent", async (_req, res) => {
  try {
    const me = await User.findOne().populate("sentRequests", "name email");
    res.json(me.sentRequests || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sent requests" });
  }
});

// POST /friend-requests → send a request
router.post("/friend-requests", async (req, res) => {
  const { toUserId } = req.body;
  try {
    const me = await User.findOne();
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
// POST /friend-requests/accept
router.post("/friend-requests/accept", async (req, res) => {
  const { fromUserId } = req.body; // ✅ match frontend param
  try {
    const me = await User.findOne();
    const sender = await User.findById(fromUserId);
    if (!sender) return res.status(404).json({ error: "User not found" });

    // remove pending request
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
router.post("/friend-requests/decline", async (req, res) => {
  const { fromUserId } = req.body;
  try {
    const me = await User.findOne();
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
router.delete("/friends/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const me = await User.findOne();
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

// GET /groups → mock groups
router.get("/groups", (_req, res) => {
  const groups = [
    { _id: "1", name: "Developers" },
    { _id: "2", name: "Designers" },
  ];
  res.json(groups);
});

module.exports = router;
