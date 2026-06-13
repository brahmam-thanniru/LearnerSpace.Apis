// Likes.service.ts

import { BaseService } from "../../Base/BaseService";
import mongoose from "mongoose";
import { Like, LikeModel } from "./Likes.Model";
import { PostsModel } from "../Posts/Posts.Model";

export class LikesService extends BaseService<Like> {
  constructor() {
    super(LikeModel);
  }

  async likePost(postId: string, userId: string) {
    try {
      const result = await this.model.updateOne(
        { postId, userId },
        {
          $setOnInsert: { postId, userId },
        },
        { upsert: true }
      );

      const isNewLike = result.upsertedCount === 1;

      if (isNewLike) {
        await PostsModel.findByIdAndUpdate(postId, {
          $inc: { likes: 1 },
        });
      }

      return { success: true, isNewLike };
    } catch (err) {
      throw new Error(`Failed to like post: ${err}`);
    }
  }

  // Unlike a post

  async unlikePost(postId: string, userId: string) {
    try {
      const result = await this.model.deleteOne({ postId, userId });

      const wasDeleted = result.deletedCount === 1;

      if (wasDeleted) {
        await PostsModel.findByIdAndUpdate(postId, {
          $inc: { likes: -1 },
        });
      }

      return wasDeleted;
    } catch (error) {
      throw new Error(
        `Failed to unlike post: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  //Check if a user liked a post

  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const like = await this.model.findOne({ postId, userId });
      return !!like;
    } catch (error) {
      throw new Error(
        `Failed to check like: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Get all users who liked a post

  async getLikes(postId: string) {
    try {
      return await this.model.aggregate([
        {
          $match: {
            postId: new mongoose.Types.ObjectId(postId),
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
        { $project: { user: 0 } },
      ]);
    } catch (error) {
      throw new Error(
        `Failed to fetch likes: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
