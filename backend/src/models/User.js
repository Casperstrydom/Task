// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // only store the hashed password
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
