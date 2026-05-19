/**
 * src/controllers/workspace.controller.ts
 *
 * Parse HTTP request → gọi WorkspaceService → format response.
 * KHÔNG chứa business logic. KHÔNG query DB.
 */

import { Request, Response, NextFunction } from "express";
import { WorkspaceService } from "../services/workspace.service";

export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  // POST /workspaces
  createWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const workspace = await this.workspaceService.createWorkspace(
        userId,
        req.body,
      );
      res.status(201).json(workspace);
    } catch (error) {
      next(error);
    }
  };

  // GET /workspaces
  listWorkspaces = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const workspaces = await this.workspaceService.listWorkspaces(userId);
      res.json(workspaces);
    } catch (error) {
      next(error);
    }
  };

  // GET /workspaces/:id
  getWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let workspaceId: string;
      if (typeof req.params.id === "string") {
        workspaceId = req.params.id;
      } else {
        workspaceId = req.params.id[0];
      }
      const userId = req.user!.id;
      const workspace = await this.workspaceService.getWorkspace(
        workspaceId,
        userId,
      );
      res.json(workspace);
    } catch (error) {
      next(error);
    }
  };

  // POST /workspaces/:id/members
  addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let workspaceId: string;
      if (typeof req.params.id === "string") {
        workspaceId = req.params.id;
      } else {
        workspaceId = req.params.id[0];
      }
      const userId = req.user!.id;
      const result = await this.workspaceService.addMember(
        workspaceId,
        userId,
        req.body,
      );
      res.status(201).json({
        message: "Member added successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /workspaces/:id/projects
  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let workspaceId: string;
      if (typeof req.params.id === "string") {
        workspaceId = req.params.id;
      } else {
        workspaceId = req.params.id[0];
      }
      const userId = req.user!.id;
      const project = await this.workspaceService.createProject(
        workspaceId,
        userId,
        req.body,
      );
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  };

  // GET /workspaces/:id/projects
  listProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let workspaceId: string;
      if (typeof req.params.id === "string") {
        workspaceId = req.params.id;
      } else {
        workspaceId = req.params.id[0];
      }
      const userId = req.user!.id;
      const projects = await this.workspaceService.listProjects(
        workspaceId,
        userId,
      );
      res.json(projects);
    } catch (error) {
      next(error);
    }
  };
}
