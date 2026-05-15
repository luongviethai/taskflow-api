/**
 * src/routes/workspace.routes.ts
 *
 * Route definitions cho Workspace + Project.
 * CHỈ khai báo: path, middleware, controller method.
 * KHÔNG chứa logic.
 *
 * Đọc file này 30 giây là hiểu toàn bộ Workspace/Project API.
 */

import { Router } from "express";
import { Knex } from "knex";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../validators/validate";
import {
  createWorkspaceSchema,
  workspaceParamsSchema,
  addMemberSchema,
  createProjectSchema,
} from "../validators/workspace.validator";
import { WorkspaceService } from "../services/workspace.service";
import { WorkspaceController } from "../controllers/workspace.controller";

export function workspaceRoutes(db: Knex): Router {
  const router = Router();

  // Dependency injection thủ công
  const workspaceService = new WorkspaceService(db);
  const controller = new WorkspaceController(workspaceService);

  // ── Workspace endpoints ─────────────────────────────

  router.post(
    "/workspaces",
    authMiddleware,
    validate(createWorkspaceSchema),
    controller.createWorkspace,
  );

  router.get("/workspaces", authMiddleware, controller.listWorkspaces);

  router.get(
    "/workspaces/:id",
    authMiddleware,
    validate(workspaceParamsSchema),
    controller.getWorkspace,
  );

  router.post(
    "/workspaces/:id/members",
    authMiddleware,
    validate(addMemberSchema),
    controller.addMember,
  );

  // ── Project endpoints (nested under workspace) ──────

  router.post(
    "/workspaces/:id/projects",
    authMiddleware,
    validate(createProjectSchema),
    controller.createProject,
  );

  router.get(
    "/workspaces/:id/projects",
    authMiddleware,
    validate(workspaceParamsSchema),
    controller.listProjects,
  );

  return router;
}
