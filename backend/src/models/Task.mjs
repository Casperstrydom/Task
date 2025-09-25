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
    isPrivate: { type: Boolean, default: false }, // 👈 add privacy field
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
