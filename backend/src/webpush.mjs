// backend/src/webpush.mjs
import webpush from "web-push";
import dotenv from "dotenv";

// ✅ Load .env variables right here
dotenv.config();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn(
    "⚠️ VAPID keys are missing. Run `npx web-push generate-vapid-keys`."
  );
} else {
  webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export default webpush;
