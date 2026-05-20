import { Knex } from "knex";
import { ForbiddenError, NotFoundError } from "../errors/app-errors";
import { logActivity } from "./activity-log.service";

export class CommentService {
  constructor(private db: Knex) {}

  async createComment(taskId: string, userId: string, content: string) {
    const task = await this.db("tasks")
      .join("projects", "projects.id", "tasks.project_id")
      .where("tasks.id", taskId)
      .select("tasks.id", "projects.workspace_id")
      .first();

    if (!task) {
      throw new NotFoundError("Task");
    }

    const comment = await this.db.transaction(async (trx) => {
      const [newComment] = await trx("comments")
        .insert({
          id: crypto.randomUUID(),
          task_id: taskId,
          user_id: userId,
          content,
          created_at: new Date(),
        })
        .returning("*");

      await logActivity(
        {
          workspaceId: task.workspace_id,
          userId,
          entityType: "comment",
          entityId: newComment.id,
          action: "created",
          metadata: { task_id: taskId, content_preview: content.slice(0, 100) },
        },
        trx,
      );

      return newComment;
    });

    return comment;
  }

  async listComments(taskId: string) {
    const comments = await this.db("comments")
      .leftJoin("users", "comments.user_id", "users.id")
      .where("task_id", taskId)
      .orderBy("created_at", "desc")
      .select("comments.*", "users.name", "users.email");

    return comments;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.db("comments").where("id", commentId).first();

    if (!comment) {
      throw new NotFoundError("Comment");
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenError("You can only delete your own comments");
    }

    const task = await this.db("tasks")
      .join("projects", "projects.id", "tasks.project_id")
      .where("tasks.id", comment.task_id)
      .select("projects.workspace_id")
      .first();

    await this.db.transaction(async (trx) => {
      await trx("comments").where("id", commentId).del();

      await logActivity(
        {
          workspaceId: task.workspace_id,
          userId,
          entityType: "comment",
          entityId: commentId,
          action: "deleted",
          metadata: { task_id: comment.task_id },
        },
        trx,
      );
    });
  }
}
