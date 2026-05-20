import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  createCommentSchema,
  commentParamsSchema,
} from "../validators/comment.validator";
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

  router.get(
    "/tasks/:id/comments",
    authMiddleware,
    validate(commentParamsSchema),
    commentController.listComments,
  );

  router.delete(
    "/comments/:id",
    authMiddleware,
    validate(commentParamsSchema),
    commentController.deleteComment,
  );

  return router;
}
