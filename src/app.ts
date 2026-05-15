/**
 * src/app.ts
 *
 * Tạo Express app, đăng ký middleware và routes.
 * Tách riêng khỏi index.ts để test có thể import app mà không start server.
 */

import express from "express";
import db from "./db";
import { timingMiddleware } from "./middlewares/timing";
import { errorHandler } from "./middlewares/error-handler";
import { authRoutes } from "./routes/auth.routes";
import { workspaceRoutes } from "./routes/workspaces.routes";
import { taskRoutes } from "./routes/task.routes";

const app = express();

// ── Global middleware (chạy TRƯỚC mọi route) ──────────

app.use(express.json()); // Parse JSON request body
app.use(timingMiddleware); // Log response time

// ── Routes ────────────────────────────────────────────

app.use(authRoutes(db)); // POST /auth/register, /auth/login
app.use(workspaceRoutes(db)); // /workspaces, /workspaces/:id/...
app.use(taskRoutes(db)); // /projects/:id/tasks, /tasks/:id

// ── Error handler (chạy SAU mọi route) ────────────────
// Express nhận diện error middleware bằng 4 params

app.use(errorHandler);

export default app;
