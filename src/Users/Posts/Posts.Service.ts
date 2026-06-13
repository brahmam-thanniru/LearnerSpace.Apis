// Posts.service.ts

import { BaseService } from "../../Base/BaseService";
import { Posts, PostsModel } from "./Posts.Model";
import mongoose from "mongoose";

export class PostsService extends BaseService<Posts> {
  constructor() {
    super(PostsModel);
  }

  async getAllPosts(userId: string): Promise<any[]> {
    const posts = await this.model.aggregate([
      // Join user info
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

      // Join Likes
      {
        $lookup: {
          from: "likes", // collection name in MongoDB
          localField: "_id",
          foreignField: "postId",
          as: "likesData",
        },
      },

      // Add likes count + isLiked
      {
        $addFields: {
          likes: { $size: "$likesData" },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(userId), "$likesData.userId"],
          },
        },
      },

      // Score for sorting feed
      {
        $addFields: {
          _score: {
            $add: [
              { $multiply: [{ $ifNull: ["$likes", 0] }, 2] },
              { $ifNull: ["$commentNumber", 0] },
            ],
          },
        },
      },

      { $sort: { _score: -1, createdAt: -1 } },

      {
        $project: {
          _score: 0,
          likesData: 0,
          user: 0,
        },
      },
    ]);

    return posts;
  }

  async getPostsByUserId(userId: string): Promise<any[]> {
    return this.model.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
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

      // Join Likes
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likesData",
        },
      },

      {
        $addFields: {
          likes: { $size: "$likesData" },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(userId), "$likesData.userId"],
          },
        },
      },

      { $sort: { createdAt: -1 } },

      { $project: { likesData: 0, user: 0 } },
    ]);
  }

  async getPostsByCategory(category: number, userId: string): Promise<any[]> {
    return this.model.aggregate([
      { $match: { category } },

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

      // Likes join
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likesData",
        },
      },

      {
        $addFields: {
          likes: { $size: "$likesData" },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(userId), "$likesData.userId"],
          },
        },
      },

      {
        $addFields: {
          _score: {
            $add: [
              { $multiply: [{ $ifNull: ["$likes", 0] }, 2] },
              { $ifNull: ["$commentNumber", 0] },
            ],
          },
        },
      },

      { $sort: { _score: -1, createdAt: -1 } },

      { $project: { _score: 0, likesData: 0, user: 0 } },
    ]);
  }

  async createPost(data: Partial<Posts>): Promise<Posts> {
    try {
      if (!data.description) throw new Error("description is required");
      if (!data.userId) throw new Error("userId is required");

      const post = new this.model({
        ...data,
        likes: data.likes ?? 0,
        commentNumber: data.commentNumber ?? 0,
      });

      return await post.save();
    } catch (error) {
      throw new Error(
        `Failed to create post: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async updatePost(
    postId: string,
    updates: Partial<Posts>
  ): Promise<Posts | null> {
    try {
      return await this.model.findByIdAndUpdate(
        postId,
        { $set: updates },
        { new: true }
      );
    } catch (error) {
      throw new Error(
        `Failed to update post: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      const result = await this.model.deleteOne({
        _id: new mongoose.Types.ObjectId(postId),
      });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete post: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async incrementCommentCount(postId: string): Promise<Posts | null> {
    return this.model.findByIdAndUpdate(
      postId,
      { $inc: { commentNumber: 1 } },
      { new: true }
    );
  }
}
