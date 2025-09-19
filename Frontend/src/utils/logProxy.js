import { Log } from "logging_middleware";

export async function logEvent(level, message) {
  try {
    await Log(level, `[FRONTEND] ${message}`);
  } catch (err) {
    console.error("Frontend logging failed:", err.message);
  }
}
