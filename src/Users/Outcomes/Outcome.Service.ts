// Outcome.service.ts

import { BaseService } from "../../Base/BaseService";
import { OutcomeFilters } from "./Outcome.Controller";
import { Outcome, OutcomeModel } from "./Outcome.Model";
import mongoose from "mongoose";

export class OutcomeService extends BaseService<Outcome> {
  constructor() {
    super(OutcomeModel);
  }

  async createOutcome(data: Partial<Outcome>): Promise<Outcome> {
    try {
      if (!data.userId) throw new Error("userId is required");
      if (!data.courseId) throw new Error("courseId is required");

      const outcome = new this.model(data);
      return await outcome.save();
    } catch (error) {
      throw new Error(
        `Failed to create outcome: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getOutcomeById(id: string) {
    const result = await this.model.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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

      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $addFields: { courseName: { $arrayElemAt: ["$course.courseName", 0] } },
      },
    ]);

    return result[0] ?? null;
  }

  async getOutcomesByUserId(userId: string) {
    return this.model.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },

      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $addFields: { courseName: { $arrayElemAt: ["$course.courseName", 0] } },
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
    ]);
  }
  async getFeaturedOutcomes() {
    return this.model.aggregate([
      {
        $match: {
          featured: true,
          verified: true,
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
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $addFields: {
          courseName: { $arrayElemAt: ["$course.courseName", 0] },
        },
      },

      {
        $project: {
          user: 0,
          course: 0,
        },
      },

      { $sort: { createdAt: -1 } },
    ]);
  }

  async getOutcomesByCourseId(courseId: string) {
    return this.model.aggregate([
      {
        $match: {
          courseId: new mongoose.Types.ObjectId(courseId),
          verified: true,
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
    ]);
  }

  async getAllOutcomes() {
    return this.model.aggregate([
      { $match: {} },

      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $addFields: { courseName: { $arrayElemAt: ["$course.courseName", 0] } },
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
    ]);
  }

  async verifyOutcome(id: string, value: boolean): Promise<Outcome> {
    try {
      const updated = await this.model.findByIdAndUpdate(
        id,
        { $set: { verified: value } },
        { new: true }
      );

      if (!updated) throw new Error("Outcome not found");

      return updated;
    } catch (error) {
      throw new Error(
        `Failed to verify outcome: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  async updateOutcome(id: string, data: Partial<Outcome>): Promise<Outcome> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid Outcome ID");
      }

      delete (data as any)._id;
      delete (data as any).userId;
      delete (data as any).courseId;

      const updated = await this.model.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!updated) {
        throw new Error("Outcome not found");
      }

      return updated;
    } catch (error) {
      throw new Error(
        `Failed to update outcome: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async deleteOutcome(id: string): Promise<boolean> {
    try {
      const result = await this.model.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete outcome: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }


  async postOutcomesByCourse(data: Outcome) {
    if (data.courseId) {
      return this.model.create(data);
    }
    throw new Error("Course ID is required");
  }

  async getOutComeByIdCompany(id: string): Promise<Outcome | null> {
    try {
      if (!id) return null;

      return await this.model.findById(id).exec();
    } catch (error) {
      console.error("Error in retrieving the outcome", id, error);
      return null;
    }
  }

  async getOutcomesByCompanyId(
    companyId: string,
    filters?: OutcomeFilters
  ) {
    const matchStage: any = {
      userId: new mongoose.Types.ObjectId(companyId),
    };

    if (filters?.courseId) {
      matchStage.courseId = new mongoose.Types.ObjectId(filters.courseId);
    }

    if (filters?.outcomeType) {
      matchStage.outcomeType = filters.outcomeType;
    }

    if (filters?.verified !== undefined) {
      matchStage.verified = filters.verified;
    }

    if (filters?.featured !== undefined) {
      matchStage.featured = filters.featured;
    }

    if (filters?.search) {
      matchStage.$or = [
        { description: { $regex: filters.search, $options: "i" } },
        { companyPlaced: { $regex: filters.search, $options: "i" } },
        { studentName: { $regex: filters.search, $options: "i" } },
        { tags: { $in: [new RegExp(filters.search, "i")] } },
      ];
    }

    return this.model
      .find(matchStage)
      .sort({ createdAt: -1 });
  }
}
