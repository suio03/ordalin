import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { db } from "./db.js";
import { requireAdmin, requireUser } from "./auth.js";

const app = express();
app.use(express.json());
const UPLOADS = path.resolve("uploads");
const upload = multer({ dest: UPLOADS });

// List the signed-in user's notes, optionally filtered by a search term.
app.get("/notes", requireUser, (req, res) => {
  const q = req.query.q ?? "";
  const rows = db.prepare(`SELECT id, title, created_at FROM notes WHERE user_id = ${req.user.id} AND title LIKE '%${q}%' ORDER BY created_at DESC`).all();
  res.json(rows);
});

app.post("/notes", requireUser, (req, res) => {
  const { title, body } = req.body;
  const info = db.prepare("INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)").run(req.user.id, title, body);
  res.status(201).json({ id: info.lastInsertRowid });
});

// Read one note.
app.get("/notes/:id", requireUser, (req, res) => {
  const note = db.prepare("SELECT * FROM notes WHERE id = ?").get(req.params.id);
  if (!note) return res.status(404).json({ error: "not found" });
  res.json(note);
});

app.delete("/notes/:id", requireUser, (req, res) => {
  db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.status(204).end();
});

app.post("/attachments", requireUser, upload.single("file"), (req, res) => {
  res.status(201).json({ name: req.file.filename });
});

// Download an attachment by file name.
app.get("/attachments/:name", requireUser, (req, res) => {
  const file = path.join(UPLOADS, req.params.name);
  if (!fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
});

app.get("/files", requireUser, (req, res) => {
  const file = path.join(UPLOADS, req.query.name);
  fs.createReadStream(file).pipe(res);
});

app.get("/admin/users", requireUser, requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT id, email, is_admin FROM users").all());
});

app.listen(process.env.PORT ?? 3000);
