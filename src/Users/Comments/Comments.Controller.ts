import { Request, Response } from "express";
import { BaseController } from "../../Base/BaseController";
import { CommentsService } from "./Comments.Service";
import { Comment } from "./Comments.Model";

export class CommentsController extends BaseController<Comment> {
  protected service: CommentsService;

  constructor() {
    const commentsService = new CommentsService();
    super(commentsService);
    this.service = commentsService;
  }

  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const comment = await this.service.addComment(req.body);

      res.status(201).json({
        success: true,
        data: comment,
        message: "Comment added successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
  async addReply(req: Request, res: Response): Promise<void> {
    try {
      const { parentCommentId } = req.params;

      if (!parentCommentId) {
        res.status(400).json({
          success: false,
          message: "Parent Comment ID is required",
        });
      }

      const reply = await this.service.addReply({
        ...req.body,
        parentCommentId,
      });

      res.status(201).json({
        success: true,
        data: reply,
        message: "Reply added successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
  async getCommentsForPost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      const comments = await this.service.getCommentsByPostId(
        postId,
        page,
        limit
      );

      return res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async getReplies(req: Request, res: Response) {
    try {
      const { commentId } = req.params;

      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: "Comment ID is required",
        });
      }

      const replies = await this.service.getReplies(commentId);

      return res.status(200).json({
        success: true,
        data: replies,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async deleteComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;

      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: "Comment ID is required",
        });
      }

      const deleted = await this.service.deleteComment(commentId);

      return res.status(200).json({
        success: true,
        message: deleted ? "Comment deleted successfully" : "Comment not found",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
}
