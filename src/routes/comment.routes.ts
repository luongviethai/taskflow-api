import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { createCommentSchema } from "../validators/comment.validator";
import { validate } from "../validators/validate";
import { CommentController } from "../controllers/comment.controller";
import { CommentService } from "../services/comment.service";
import { Knex } from "knex";

export function commentRoutes(db: Knex): Router {
  const router = Router();

  const commentService = new CommentService(db);
  const commentController = new CommentController(commentService);

  router.post(
    "/tasks/:id/comments",
    authMiddleware,
    validate(createCommentSchema),
    commentController.createComment,
  );

  return router;
}
