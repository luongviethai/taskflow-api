/**
 * src/services/task.service.ts
 *
 * Business logic cho Task CRUD.
 * KHÔNG biết HTTP. Nhận data thuần → trả data thuần hoặc throw AppError.
 *
 * Permission chain: task → project → workspace → workspace_members
 * Mỗi thao tác task cần verify user là member của workspace chứa project.
 */

import { Knex } from "knex";
import { NotFoundError, BadRequestError } from "../errors/app-errors";

// ── Types ─────────────────────────────────────────────

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "done";
  assignee_id?: string | null;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: "todo" | "in_progress" | "done";
  assignee_id?: string | null;
}

interface ListTasksFilters {
  status?: string;
}

// ── Service ───────────────────────────────────────────

export class TaskService {
  constructor(private db: Knex) {}

  /**
   * Verify user có quyền truy cập project.
   * Check: project tồn tại + user là member của workspace chứa project.
   *
   * Trả project object nếu OK, throw NotFoundError nếu không.
   */
  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.db("projects").where({ id: projectId }).first();

    if (!project) {
      throw new NotFoundError("Project");
    }

    const membership = await this.db("workspace_members")
      .where({
        workspace_id: project.workspace_id,
        user_id: userId,
      })
      .first();

    if (!membership) {
      // 404 thay vì 403 — không lộ project tồn tại
      throw new NotFoundError("Project");
    }

    return { project, membership };
  }

  /**
   * Verify user có quyền truy cập task.
   * Chain: task → project → workspace → members.
   */
  private async verifyTaskAccess(taskId: string, userId: string) {
    const task = await this.db("tasks").where({ id: taskId }).first();

    if (!task) {
      throw new NotFoundError("Task");
    }

    const { project, membership } = await this.verifyProjectAccess(
      task.project_id,
      userId,
    );

    return { task, project, membership };
  }

  /**
   * Verify user là member của workspace.
   * Dùng khi check assignee.
   */
  private async verifyWorkspaceMember(workspaceId: string, userId: string) {
    const membership = await this.db("workspace_members")
      .where({
        workspace_id: workspaceId,
        user_id: userId,
      })
      .first();

    if (!membership) {
      throw new BadRequestError("Assignee must be a member of the workspace");
    }

    return membership;
  }

  // ── CREATE TASK ─────────────────────────────────────

  async createTask(projectId: string, userId: string, input: CreateTaskInput) {
    // Check user có access project
    const { project } = await this.verifyProjectAccess(projectId, userId);

    // Check assignee nếu có
    if (input.assignee_id) {
      await this.verifyWorkspaceMember(project.workspace_id, input.assignee_id);
    }

    const [task] = await this.db("tasks")
      .insert({
        project_id: projectId,
        title: input.title,
        description: input.description || "",
        status: input.status || "todo",
        assignee_id: input.assignee_id || null,
        created_at: new Date(),
      })
      .returning("*");

    return task;
  }

  // ── LIST TASKS ──────────────────────────────────────

  async listTasks(
    projectId: string,
    userId: string,
    filters: ListTasksFilters,
  ) {
    // Check access
    await this.verifyProjectAccess(projectId, userId);

    // Build query động
    let query = this.db("tasks")
      .where({ project_id: projectId })
      .orderBy("created_at", "desc");

    if (filters.status) {
      query = query.andWhere({ status: filters.status });
    }

    // Limit 100 — tháng 2 sẽ làm cursor-based pagination
    return query.limit(100);
  }

  // ── GET TASK BY ID ──────────────────────────────────

  async getTask(taskId: string, userId: string) {
    const { task } = await this.verifyTaskAccess(taskId, userId);
    return task;
  }

  // ── UPDATE TASK ─────────────────────────────────────

  async updateTask(taskId: string, userId: string, updates: UpdateTaskInput) {
    const { task, project } = await this.verifyTaskAccess(taskId, userId);

    // Check assignee nếu đổi
    if (updates.assignee_id !== undefined && updates.assignee_id !== null) {
      await this.verifyWorkspaceMember(
        project.workspace_id,
        updates.assignee_id,
      );
    }

    const [updatedTask] = await this.db("tasks")
      .where({ id: taskId })
      .update(updates)
      .returning("*");

    return updatedTask;
  }

  // ── DELETE TASK ─────────────────────────────────────

  async deleteTask(taskId: string, userId: string): Promise<void> {
    await this.verifyTaskAccess(taskId, userId);
    await this.db("tasks").where({ id: taskId }).del();
  }

  // ── ASSIGN TASK ─────────────────────────────────────

  async assignTask(taskId: string, userId: string, assigneeId: string) {
    const { project } = await this.verifyTaskAccess(taskId, userId);

    // Check assignee là member
    await this.verifyWorkspaceMember(project.workspace_id, assigneeId);

    const [updatedTask] = await this.db("tasks")
      .where({ id: taskId })
      .update({ assignee_id: assigneeId })
      .returning("*");

    return updatedTask;
  }

  //

  async getTaskDetails(projectId: string) {
    const tasks = await this.db("tasks")
      .select(
        "tasks.*",
        "users.name as assignee_name",
        "users.email as assignee_email",
      )
      .leftJoin("users", "users.id", "tasks.assignee_id")
      .where("tasks.project_id", projectId)
      .orderBy("tasks.created_at", "desc")
      .limit(50);

    const taskIds = tasks.map((t) => t.id);
    const comments = await this.db("comments")
      .whereIn("task_id", taskIds)
      .orderBy("created_at", "desc");

    const commentMap = new Map<string, any[]>();
    for (const c of comments) {
      if (!commentMap.has(c.task_id)) commentMap.set(c.task_id, []);
      const arr = commentMap.get(c.task_id)!;
      if (arr.length < 5) arr.push(c); // chỉ giữ 5 comment mới nhất
    }

    return tasks.map((task) => ({
      ...task,
      assignee: task.assignee_name
        ? { name: task.assignee_name, email: task.assignee_email }
        : null,
      comments: commentMap.get(task.id) || [],
    }));
  }
}
