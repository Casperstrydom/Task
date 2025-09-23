// backend/src/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // 👈 owner of the task
  },
  { timestamps: true }
);

// ✅ Export as ESM
export default mongoose.model("Task", taskSchema);
