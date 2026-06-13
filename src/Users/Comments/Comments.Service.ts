// Comments.service.ts

import { BaseService } from "../../Base/BaseService";
import { Comment, CommentModel } from "./Comments.Model";
import mongoose from "mongoose";
import { PostsModel } from "../Posts/Posts.Model";

export class CommentsService extends BaseService<Comment> {
  constructor() {
    super(CommentModel);
  }

  async addComment(data: Partial<Comment>): Promise<Comment> {
    try {
      if (!data.postId) throw new Error("postId is required");
      if (!data.userId) throw new Error("userId is required");
      if (!data.text) throw new Error("text is required");

      const comment = new this.model({
        ...data,
        likes: 0,
        parentCommentId: data.parentCommentId ?? null,
      });

      const saved = await comment.save();

      // Increment comment count in Post
      await PostsModel.findByIdAndUpdate(data.postId, {
        $inc: { commentNumber: 1 },
      });

      return saved;
    } catch (error) {
      throw new Error(
        `Failed to add comment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getCommentsByPostId(postId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const comments = await this.model.aggregate([
        {
          $match: {
            postId: new mongoose.Types.ObjectId(postId),
            parentCommentId: null,
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

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      const total = await this.model.countDocuments({
        postId,
        parentCommentId: null,
      });

      return {
        page,
        limit,
        total,
        comments,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch comments: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async addReply(data: Partial<Comment>): Promise<Comment> {
    try {
      if (!data.postId) throw new Error("postId is required");
      if (!data.userId) throw new Error("userId is required");
      if (!data.text) throw new Error("text is required");
      if (!data.parentCommentId) throw new Error("parentCommentId is required");

      const parent = await this.model.findById(data.parentCommentId);
      if (!parent) {
        throw new Error("Parent comment not found");
      }

      if (String(parent.postId) !== String(data.postId)) {
        throw new Error("Reply postId mismatch with parent comment");
      }

      const reply = new this.model({
        ...data,
        likes: 0,
        parentCommentId: data.parentCommentId,
      });

      const saved = await reply.save();

      // Increment total comment count for the post
      await PostsModel.findByIdAndUpdate(data.postId, {
        $inc: { commentNumber: 1 },
      });

      return saved;
    } catch (error) {
      throw new Error(
        `Failed to add reply: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getReplies(commentId: string) {
    try {
      return await this.model.aggregate([
        {
          $match: {
            parentCommentId: new mongoose.Types.ObjectId(commentId),
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

        { $sort: { createdAt: 1 } }, // oldest first for threaded replies
      ]);
    } catch (error) {
      throw new Error(
        `Failed to fetch replies: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const comment = await this.model.findById(commentId);

      if (!comment) return false;

      const result = await this.model.deleteOne({
        _id: new mongoose.Types.ObjectId(commentId),
      });

      // Decrement comment count in post
      await PostsModel.findByIdAndUpdate(comment.postId, {
        $inc: { commentNumber: -1 },
      });

      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete comment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
