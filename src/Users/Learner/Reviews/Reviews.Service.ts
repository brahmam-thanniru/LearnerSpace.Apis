// Reviews.service.ts

import { BaseService } from "../../../Base/BaseService";
import mongoose from "mongoose";
import { Review, ReviewModel } from "./Reviews.Model";

export class ReviewsService extends BaseService<Review> {
  constructor() {
    super(ReviewModel);
  }

  async createReview(data: Partial<Review>): Promise<Review> {
    try {
      if (!data.courseId || !data.userId || !data.stars) {
        throw new Error("courseId, userId, and stars are required");
      }

      const exists = await this.model.findOne({
        courseId: data.courseId,
        userId: data.userId,
      });

      if (exists) {
        throw new Error("User has already reviewed this course");
      }

      const review = new this.model(data);
      return await review.save();
    } catch (error) {
      throw new Error(
        `Failed to create review: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  async getReviewsByCourseId(courseId: string): Promise<any[]> {
    return this.model.aggregate([
      {
        $match: {
          courseId: new mongoose.Types.ObjectId(courseId),
        },
      },

      {
        $lookup: {
          from: "Learners",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $addFields: {
          userName: { $arrayElemAt: ["$user.name", 0] },
          userProfilePic: { $arrayElemAt: ["$user.profilePic", 0] },
        },
      },

      { $sort: { createdAt: -1 } },

      { $project: { user: 0 } },
    ]);
  }

  async getReviewsByUserId(userId: string): Promise<any[]> {
    return this.model.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },

      {
        $lookup: {
          from: "Learners",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $addFields: {
          userName: { $arrayElemAt: ["$user.name", 0] },
          userProfilePic: { $arrayElemAt: ["$user.profilePic", 0] },
        },
      },

      { $sort: { createdAt: -1 } },

      { $project: { user: 0 } },
    ]);
  }

  async updateReview(
    reviewId: string,
    updates: Partial<Review>
  ): Promise<Review> {
    try {
      const updated = await this.model.findByIdAndUpdate(
        reviewId,
        { $set: updates },
        { new: true }
      );

      if (!updated) {
        throw new Error("Review not found or failed to update");
      }

      return updated;
    } catch (error) {
      throw new Error(
        `Failed to update review: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    try {
      const result = await this.model.deleteOne({
        _id: new mongoose.Types.ObjectId(reviewId),
      });

      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete review: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getAllReviews(): Promise<any[]> {
    return this.model.aggregate([
      {
        $lookup: {
          from: "Learners",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $addFields: {
          userName: { $arrayElemAt: ["$user.name", 0] },
          userProfilePic: { $arrayElemAt: ["$user.profilePic", 0] },
        },
      },

      { $sort: { createdAt: -1 } },

      { $project: { user: 0 } },
    ]);
  }
}
