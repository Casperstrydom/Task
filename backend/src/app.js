// Importing required packages
const express = require("express"); // Express framework for building APIs
const mongoose = require("mongoose"); // MongoDB ODM
const cors = require("cors"); // Middleware for Cross-Origin Resource Sharing
const swaggerJsdoc = require("swagger-jsdoc"); // Swagger JSDoc generator
const swaggerUi = require("swagger-ui-express"); // Swagger UI to serve API docs

// Load environment variables from .env file
require("dotenv").config(); // 🔹 ADDED - needed for database URI, port, etc.

// Import routes
const taskRoutes = require("./routes/taskRoute"); // Tasks API routes
const authRoutes = require("./routes/authRoute"); // Authentication API routes 🔹 ADDED

// Create Express app instance
const app = express();

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse incoming JSON requests

// ----------------- Swagger/OpenAPI Configuration -----------------
const options = {
  definition: {
    openapi: "3.0.0", // OpenAPI version
    info: {
      title: "Task API", // API title
      version: "1.0.0", // API version
      description: "API documentation for Task Manager", // Description
    },
    servers: [
      {
        url: "http://localhost:5000", // Server URL
      },
    ],
  },
  apis: ["./src/routes/*.js"], // 🔹 CHANGED - updated path to match your route folder structure for JSDoc
};

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Serve Swagger UI at /api-docs

// ----------------- Routes -----------------
app.use("/tasks", taskRoutes); // Use task routes
app.use("/auth", authRoutes); // 🔹 ADDED - use auth routes

// Health check route
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" }); // 🔹 CHANGED - return JSON with status for tests
});

// Default root route
app.get("/", (req, res) => res.send("Hello, Task Manager API!"));

// ----------------- MongoDB Connection -----------------
// 🔹 CHANGED: Only connect and start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI) // Connect to MongoDB using URI from .env
    .then(() => {
      console.log("✅ MongoDB connected"); // Log success
      app.listen(process.env.PORT || 5000, () => {
        console.log(
          `✅ Server running on http://localhost:${process.env.PORT || 5000}`
        ); // Log server URL
        console.log(
          `📘 Swagger docs available at http://localhost:${
            process.env.PORT || 5000
          }/api-docs`
        ); // Log Swagger URL
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err); // Log error if connection fails
      process.exit(1); // Exit process on DB connection failure
    });
}

// ----------------- Export app -----------------
module.exports = app; // 🔹 CHANGED/ADDED - export app for testing with Jest/supertest
