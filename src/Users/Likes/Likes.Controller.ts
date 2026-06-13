import { Request, Response } from "express";
import { BaseController } from "../../Base/BaseController";
import { LikesService } from "./Likes.Service";
import { Like } from "./Likes.Model";

export class LikesController extends BaseController<Like> {
  protected service: LikesService;

  constructor() {
    const likesService = new LikesService();
    super(likesService);
    this.service = likesService;
  }

  /**
   * Like a post
   */
  async likePost(req: Request, res: Response): Promise<void | any> {
    try {
      const { postId } = req.params;
      const { userId } = req.body;

      if (!postId || !userId) {
        return res.status(400).json({
          success: false,
          message: "postId and userId are required",
        });
      }

      const like = await this.service.likePost(postId, userId);

      res.status(201).json({
        success: true,
        data: like,
        message: "Post liked successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(req: Request, res: Response): Promise<void | any> {
    try {
      const { postId } = req.params;
      const { userId } = req.body;

      if (!postId || !userId) {
        return res.status(400).json({
          success: false,
          message: "postId and userId are required",
        });
      }

      const removed = await this.service.unlikePost(postId, userId);

      res.status(200).json({
        success: true,
        message: removed
          ? "Post unliked successfully"
          : "Like not found for this user",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  /**
   * Check if a user liked the post
   */
  async checkUserLike(req: Request, res: Response) {
    try {
      const { postId, userId } = req.params;

      if (!postId || !userId) {
        return res.status(400).json({
          success: false,
          message: "postId and userId are required",
        });
      }

      const liked = await this.service.hasUserLiked(postId, userId);

      return res.status(200).json({
        success: true,
        data: liked,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  /**
   * Get all likes for a post
   */
  async getLikes(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      if (!postId) {
        res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
        return;
      }

      const likes = await this.service.getLikes(postId);

      res.status(200).json({
        success: true,
        data: likes,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
}
