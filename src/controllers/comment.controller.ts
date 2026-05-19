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
}
