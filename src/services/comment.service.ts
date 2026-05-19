import { Knex } from "knex";
import { NotFoundError } from "../errors/app-errors";

export class CommentService {
  constructor(private db: Knex) {}

  async createComment(
    taskId: string,
    userId: string,
    content: string,
    trx?: Knex.Transaction,
  ) {
    const query = trx || this.db;

    const task = await query("tasks")
      .join("projects", "projects.id", "tasks.project_id")
      .where("tasks.id", taskId)
      .select("tasks.id", "projects.workspace_id")
      .first();

    if (!task) {
      throw new NotFoundError("Task");
    }

    return task;
  }
}
