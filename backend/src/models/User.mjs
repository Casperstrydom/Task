// backend/src/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // store hashed password

    // Friend system
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // incoming
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // outgoing
    isPrivate: { type: Boolean, default: false }, // profile visibility
  },
  { timestamps: true }
);

// ✅ Export as ESM
export default mongoose.model("User", UserSchema);
