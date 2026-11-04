import { db } from "./db.js";

/** Looks up the user for the bearer token and stores it on req.user. */
export function requireUser(req, res, next) {
  const token = (req.get("authorization") ?? "").replace(/^Bearer /, "");
  const user = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: "forbidden" });
  next();
}
