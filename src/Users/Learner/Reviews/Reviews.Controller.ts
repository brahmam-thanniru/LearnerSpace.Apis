import { Request, Response } from "express";
import { BaseController } from "../../../Base/BaseController";
import { ReviewsService } from "./Reviews.Service";
import { Review } from "./Reviews.Model";

export class ReviewsController extends BaseController<Review> {
  protected service: ReviewsService;

  constructor() {
    const reviewsService = new ReviewsService();
    super(reviewsService);
    this.service = reviewsService;
  }

  async getReviewsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
      }

      const reviews = await this.service.getReviewsByCourseId(courseId);

      return res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async getReviewsByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const reviews = await this.service.getReviewsByUserId(userId);

      return res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async handleCreate(req: Request, res: Response): Promise<void> {
    try {
      const review = await this.service.createReview(req.body);

      res.status(201).json({
        success: true,
        data: review,
        message: "Review submitted successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async updateReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        return res.status(400).json({
          success: false,
          message: "Review ID is required",
        });
      }

      const updated = await this.service.updateReview(reviewId, req.body);

      return res.status(200).json({
        success: true,
        data: updated,
        message: "Review updated successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async deleteReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        return res.status(400).json({
          success: false,
          message: "Review ID is required",
        });
      }

      const deleted = await this.service.deleteReview(reviewId);

      return res.status(200).json({
        success: true,
        message: deleted ? "Review deleted successfully" : "Review not found",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async handleGetAllReviews(req: Request, res: Response) {
    try {
      const reviews = await this.service.getAllReviews();

      return res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
}
