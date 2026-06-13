import { Request, Response } from "express";
import { BaseController } from "../../Base/BaseController";
import { Posts } from "./Posts.Model";
import { PostsService } from "./Posts.Service";

export class PostsController extends BaseController<Posts> {
  protected service: PostsService;

  constructor() {
    const postsService = new PostsService();
    super(postsService);
    this.service = postsService;
  }

  async getAllPosts(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const posts = await this.service.getAllPosts(userId);

      res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async getPostsByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const posts = await this.service.getPostsByUserId(userId);

      return res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async getPostsByCategory(req: Request, res: Response) {
    try {
      const { category, userId } = req.params;

      if (category === undefined) {
        return res.status(400).json({
          success: false,
          message: "Category is required",
        });
      }

      const posts = await this.service.getPostsByCategory(
        Number(category),
        userId
      );

      return res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async handleCreate(req: Request, res: Response): Promise<void> {
    try {
      const post = await this.service.createPost(req.body);

      res.status(201).json({
        success: true,
        data: post,
        message: "Post created successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      const updated = await this.service.updatePost(postId, req.body);

      return res.status(200).json({
        success: true,
        data: updated,
        message: "Post updated successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      const deleted = await this.service.deletePost(postId);

      return res.status(200).json({
        success: true,
        message: deleted ? "Post deleted successfully" : "Post not found",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
}
