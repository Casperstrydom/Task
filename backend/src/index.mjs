// backend/src/index.js
import express from "express";
import mongoose from "mongoose";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import webpush from "web-push";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { subscriptions } from "./subscriptions.mjs"; // ESM style

import taskRoutes from "./routes/taskRoute.mjs";
import authRoutes from "./routes/authRoute.mjs";
import userRoutes from "./routes/userRoute.mjs";

const app = express();

// ----------------- Middleware -----------------
app.use(express.json()); // Parse JSON bodies

// ----------------- Allowed Origins -----------------
const allowedOrigins = ["http://localhost:5173"]; // Add your frontend URL if needed

app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log("🌍 Incoming request:", req.method, req.url, "Origin:", origin);

  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      origin || /.*/ // fallback for no origin (like Postman)
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    console.log("✅ CORS headers set");
  } else {
    console.warn("❌ Blocked by CORS:", origin);
  }

  if (req.method === "OPTIONS") return res.sendStatus(200);

  next();
});

// ----------------- Swagger -----------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: { title: "Task API", version: "1.0.0" },
    servers: [
      {
        url:
          process.env.AWS_APP_RUNNER_URL ||
          process.env.RENDER_EXTERNAL_URL ||
          `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
  },
  apis: ["./routes/*.mjs"],
};

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerJsdoc(swaggerOptions))
);

// ----------------- VAPID Public Key -----------------
app.get("/vapidPublicKey", (_req, res) => {
  console.log("🔑 VAPID public key requested");
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// ----------------- Push Notifications -----------------
webpush.setVapidDetails(
  "mailto:your@email.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.post("/subscribe", (req, res) => {
  console.log("📨 New subscription request:", req.body);
  subscriptions.push(req.body);
  res.status(201).json({ message: "Subscribed successfully" });
});

app.post("/sendNotification", async (req, res) => {
  console.log("📣 Sending push notification:", req.body);
  const { title, body } = req.body;
  const payload = JSON.stringify({
    title: title || "Task Update",
    body: body || "You have a new task or group update!",
    icon: "/icon.png",
  });

  await Promise.all(
    subscriptions.map((sub) =>
      webpush.sendNotification(sub, payload).catch((err) => {
        console.error("❌ Push failed for subscription:", sub, err);
      })
    )
  );

  res.json({ message: "Notifications sent" });
});

// ----------------- API Routes -----------------
app.use("/tasks", taskRoutes);
app.use("/auth", authRoutes);
app.use("/", userRoutes);

// ----------------- Serve React Frontend -----------------
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

// Catch-all for React SPA routing
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ----------------- Health Check -----------------
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ----------------- MongoDB Connection & Server Start -----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `✅ Server running on http://localhost:${process.env.PORT || 5000}`
      );
      console.log(
        `📘 Swagger docs at http://localhost:${
          process.env.PORT || 5000
        }/api-docs`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
