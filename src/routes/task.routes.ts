/**
 * src/routes/task.routes.ts
 *
 * Route definitions cho Task CRUD.
 * CHỈ khai báo: path, middleware, controller method.
 */

import { Router } from 'express';
import { Knex } from 'knex';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../validators/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  assignTaskSchema,
  taskParamsSchema,
} from '../validators/task.validator';
import { TaskService } from '../services/task.service';
import { TaskController } from '../controllers/task.controller';

export function taskRoutes(db: Knex): Router {
  const router = Router();

  // Dependency injection
  const taskService = new TaskService(db);
  const controller = new TaskController(taskService);

  // ── Task endpoints ──────────────────────────────────

  // Nested under project (tạo + list cần context project)
  router.post(
    '/projects/:id/tasks',
    authMiddleware,
    validate(createTaskSchema),
    controller.createTask
  );

  router.get(
    '/projects/:id/tasks',
    authMiddleware,
    validate(listTasksQuerySchema),
    controller.listTasks
  );

  // Flat (thao tác trực tiếp trên task, không cần project context)
  router.get(
    '/tasks/:id',
    authMiddleware,
    validate(taskParamsSchema),
    controller.getTask
  );

  router.patch(
    '/tasks/:id',
    authMiddleware,
    validate(updateTaskSchema),
    controller.updateTask
  );

  router.delete(
    '/tasks/:id',
    authMiddleware,
    validate(taskParamsSchema),
    controller.deleteTask
  );

  router.patch(
    '/tasks/:id/assign',
    authMiddleware,
    validate(assignTaskSchema),
    controller.assignTask
  );

  return router;
}
