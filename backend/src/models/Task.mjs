import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Task title
    completed: { type: Boolean, default: false }, // Track if done
    dueDate: { type: Date }, // Optional deadline
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true, // Every task must have an owner
    },
    isPrivate: { type: Boolean, default: false }, // 👈 Public by default
  },
  { timestamps: true } // Adds createdAt + updatedAt
);

export default mongoose.model("Task", taskSchema);
