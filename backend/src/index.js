const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const webpush = require("web-push");
require("dotenv").config();

const { subscriptions } = require("./subscriptions");

const taskRoutes = require("./routes/taskRoute");
const authRoutes = require("./routes/authRoute");
const userRoutes = require("./routes/userRoute");

const app = express();

// ----- CORS CONFIG -----
const allowedOrigins = [
  "http://localhost:5173", // Dev
  process.env.FRONTEND_URL, // Amplify frontend
].filter(Boolean);

// Use cors middleware (automatic preflight handling)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman / server requests
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ----- JSON Parsing -----
app.use(express.json());

// ----- Swagger -----
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: { title: "Task API", version: "1.0.0" },
    servers: [
      {
        url:
          process.env.AWS_APP_RUNNER_URL || // AWS backend
          process.env.RENDER_EXTERNAL_URL || // Optional Render backend
          `http://localhost:${process.env.PORT || 5000}`, // Local dev
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ----- VAPID Public Key Endpoint -----
app.get("/vapidPublicKey", (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// ----- Push Notifications -----
webpush.setVapidDetails(
  "mailto:your@email.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: "Subscribed successfully" });
});

app.post("/sendNotification", async (req, res) => {
  const { title, body } = req.body;
  const payload = JSON.stringify({
    title: title || "Task Update",
    body: body || "You have a new task or group update!",
    icon: "/icon.png",
  });

  await Promise.all(
    subscriptions.map((sub) =>
      webpush.sendNotification(sub, payload).catch(console.error)
    )
  );

  res.json({ message: "Notifications sent" });
});

// ----- ROUTES -----
app.use("/tasks", taskRoutes);
app.use("/auth", authRoutes);
app.use("/", userRoutes);

// ----- Health & Default Routes -----
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/", (_req, res) => res.send("Hello, Task Manager API!"));

// ----- MongoDB Connection -----
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

module.exports = app;
