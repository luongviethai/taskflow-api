/**
 * src/controllers/task.controller.ts
 *
 * Parse HTTP request → gọi TaskService → format response.
 * KHÔNG chứa business logic. KHÔNG query DB.
 */

import { Request, Response, NextFunction } from "express";
import { TaskService } from "../services/task.service";

export class TaskController {
  constructor(private taskService: TaskService) {}

  // POST /projects/:id/tasks
  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let projectId: number;

      if (typeof req.params.id === "string") {
        projectId = parseInt(req.params.id);
      } else {
        projectId = parseInt(req.params.id[0]);
      }
      const userId = req.user!.id;
      const task = await this.taskService.createTask(
        projectId,
        userId,
        req.body,
      );
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  };

  // GET /projects/:id/tasks
  listTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let projectId: number;

      if (typeof req.params.id === "string") {
        projectId = parseInt(req.params.id);
      } else {
        projectId = parseInt(req.params.id[0]);
      }
      const userId = req.user!.id;
      const { status } = req.query as { status?: string };
      const tasks = await this.taskService.listTasks(projectId, userId, {
        status,
      });
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  };

  // GET /tasks/:id
  getTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let taskId: number;
      if (typeof req.params.id === "string") {
        taskId = parseInt(req.params.id);
      } else {
        taskId = parseInt(req.params.id[0]);
      }
      const userId = req.user!.id;
      const task = await this.taskService.getTask(taskId, userId);
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  // PATCH /tasks/:id
  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let taskId: number;
      if (typeof req.params.id === "string") {
        taskId = parseInt(req.params.id);
      } else {
        taskId = parseInt(req.params.id[0]);
      }
      const userId = req.user!.id;
      const task = await this.taskService.updateTask(taskId, userId, req.body);
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /tasks/:id
  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let taskId: number;
      if (typeof req.params.id === "string") {
        taskId = parseInt(req.params.id);
      } else {
        taskId = parseInt(req.params.id[0]);
      }
      const userId = req.user!.id;
      await this.taskService.deleteTask(taskId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // PATCH /tasks/:id/assign
  assignTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let taskId: number;
      if (typeof req.params.id === "string") {
        taskId = parseInt(req.params.id);
      } else {
        taskId = parseInt(req.params.id[0]);
      }
      const userId = req.user!.id;
      const { assignee_id } = req.body;
      const task = await this.taskService.assignTask(
        taskId,
        userId,
        assignee_id,
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  };
}
