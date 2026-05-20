import { Request, Response, NextFunction } from "express";
import { CommentService } from "../services/comment.service";
import { getParamsId } from "../utils";

export class CommentController {
  constructor(private commentService: CommentService) {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      const taskId = getParamsId(req.params.id);
      const userId = req.user!.id;
      const comment = await this.commentService.createComment(
        taskId,
        userId,
        content,
      );
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  };

  listComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = getParamsId(req.params.id);
      const comments = await this.commentService.listComments(taskId);
      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const commentId = getParamsId(req.params.id);
      const userId = req.user!.id;
      await this.commentService.deleteComment(commentId, userId);
      res.status(204).json({ message: "Comment deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
