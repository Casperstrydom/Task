// backend/src/routes/pushRoute.mjs
import express from "express";
import { subscriptions } from "../subscriptions.mjs";

const router = express.Router();

// Save subscription
router.post("/subscribe", (req, res) => {
  const sub = req.body;

  if (!sub || !sub.endpoint) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid subscription" });
  }

  // Avoid duplicates
  const exists = subscriptions.find((s) => s.endpoint === sub.endpoint);
  if (!exists) subscriptions.push(sub);

  res.status(201).json({ success: true });
});

export default router;
