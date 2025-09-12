const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const webpush = require("web-push");

// Load .env
require("dotenv").config();

// Shared subscriptions store
const { subscriptions } = require("./subscriptions");

// Import routes
const taskRoutes = require("./routes/taskRoute");
const authRoutes = require("./routes/authRoute");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ----------------- Swagger Config -----------------
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task API",
      version: "1.0.0",
      description: "API documentation for Task Manager",
    },
    servers: [
      {
        url:
          process.env.RENDER_EXTERNAL_URL ||
          `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
  },
  apis: ["./src/routes/*.js"], // ✅ adjust if your routes folder differs
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ----------------- Push Notifications Setup -----------------
webpush.setVapidDetails(
  "mailto:your@email.com", // change to your email
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save subscription
app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: "Subscribed successfully" });
});

// Send notification manually (test endpoint)
app.post("/sendNotification", async (req, res) => {
  const { title, body } = req.body;

  const payload = JSON.stringify({
    title: title || "Task Update",
    body: body || "You have a new task or group update!",
    icon: "/icon.png",
  });

  const sendPromises = subscriptions.map((sub) =>
    webpush.sendNotification(sub, payload).catch((err) => {
      console.error("Push error:", err);
    })
  );

  await Promise.all(sendPromises);
  res.json({ message: "Notifications sent" });
});

// ----------------- Routes -----------------
app.use("/tasks", taskRoutes);
app.use("/auth", authRoutes);

// Health & default route
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => res.send("Hello, Task Manager API!"));

// ----------------- MongoDB Connection -----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `✅ Server running on http://localhost:${process.env.PORT || 5000}`
      );
      console.log(
        `📘 Swagger docs available at http://localhost:${
          process.env.PORT || 5000
        }/api-docs`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
