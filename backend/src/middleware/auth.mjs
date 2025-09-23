// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    // Verify JWT with fallback secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    if (err.name === "TokenExpiredError") {
      return res
        .status(403)
        .json({ error: "Token expired. Please log in again." });
    }
    res.status(403).json({ error: "Invalid token. Please log in again." });
  }
};

export default auth;
