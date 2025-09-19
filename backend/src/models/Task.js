const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date }, // <-- added
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
