import mongoose from "mongoose";
import { BaseService } from "../../../Base/BaseService";

import { Course, CourseModel, CourseStatus, DurationTime } from "./Course.Model";
import { OutcomeModel } from "../../Outcomes/Outcome.Model";
import { buildValidOutcomes } from "../../Utils/CommonUtils";
import { Role, CompanyModel } from "../../CommonModel/User.model";
import { AdminModel } from "../../Admin/Admin.Model";
import { CompanyCategoryModel, CourseCategoryModel } from "../../Admin/Category/Category.Model";
import { AdminInternModel } from "../../Admin/AdminIntern/AdminIntern.Model";

export interface CourseNameResponse {
  [courseId: string]: string;
}

export interface IDuration {
  unit: DurationTime;
  value: number;
}

export interface IOutcome {
  companyPlaced: string;
  description: string;
  featured: boolean;
  link: string;
  package: string;
  verified: boolean;
}

export interface IRefundPolicy {
  policy: string;
}

export interface ICourseFormData {
  _id?: string;

  companyId: string;

  courseName: string;
  courseUrl: string;
  description: string;

  industry: string;
  courseCategory: string;
  price: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "All";
  mode: "online" | "offline" | "hybrid";
  language: string;

  duration: IDuration;

  courseImage: string[];
  pdf: string[];

  skillsCovered: string[];

  counselor: string[];       // counselor IDs
  noOfLeads: number;

  hasOutcomes: boolean;
  outcomes: IOutcome[];

  placementAssistance: boolean;
  placementType: string;

  hasRefundPolicy: boolean;
  refundPolicy: string[];

  hasEligibility: boolean;
  eligibilityCriteria: string;

  address: string;

  status: CourseStatus;

  createdAt: string;

  postedBy?: { role: string; userId: string; name?: string; email?: string; };
  updatedBy?: { role: string; userId: string; name?: string; email?: string; };
  companyIds?: string[];
}
export class CourseService extends BaseService<Course> {
  constructor() {
    super(CourseModel);
  }

  async getCoursesByCompany(
    companyId: string,
    page = 1,
    limit = 10,
    searchQuery?: string,
    isIntern = false
  ): Promise<{
    data: Course[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const matchStage: any = {
        ...(isIntern
          ? { 'postedBy.userId': new mongoose.Types.ObjectId(companyId) }
          : { companyId: new mongoose.Types.ObjectId(companyId) }
        ),
        $and: [
          {
            $or: [
              {
                status: {
                  $nin: [
                    CourseStatus.DELETED,
                    CourseStatus.DRAFT_AND_DELETED,
                  ],
                },
              },
              { status: { $exists: false } },
            ],
          },
        ],
      };

      // 🔍 Add search condition ONLY if searchQuery exists
      if (searchQuery && searchQuery.trim() !== "") {
        matchStage.$and.push({
          $or: [
            { courseName: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
          ],
        });
      }

      const result = await CourseModel.aggregate([
        { $match: matchStage },

        {
          $lookup: {
            from: "companycategories",
            localField: "industry",
            foreignField: "_id",
            as: "industryData",
          },
        },
        {
          $lookup: {
            from: "coursecategories",
            localField: "courseCategory",
            foreignField: "_id",
            as: "courseCategoryData",
          },
        },
        {
          $addFields: {
            industryData: { $arrayElemAt: ["$industryData", 0] },
            courseCategoryData: { $arrayElemAt: ["$courseCategoryData", 0] },
          },
        },

        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  courseName: 1,
                  price: 1,
                  description: 1,
                  companyId: 1,
                  language: 1,
                  duration: 1,
                  mode: 1,
                  noOfLeads: 1,
                  courseImage: 1,
                  placementAssistance: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  status: 1,
                  level: 1,
                  industryName: "$industryData.name",
                  courseCategoryName: "$courseCategoryData.name",
                  postedBy: 1,
                },
              },
            ],
            totalCount: [{ $count: "count" }],
          },
        },

        {
          $addFields: {
            total: {
              $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
            },
          },
        },
        {
          $project: {
            data: 1,
            total: 1,
          },
        },
      ]);

      return {
        data: result[0]?.data || [],
        total: result[0]?.total || 0,
        page,
        limit,
      };
    } catch (error) {
      throw new Error("Error fetching courses for Company: " + error);
    }
  }

  async getAdminCourses(
    page = 1,
    limit = 10,
    searchQuery?: string
  ): Promise<{
    data: Course[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const matchStage: any = {
        'postedBy.role': { $in: [Role.ADMIN, Role.ADMIN_INTERN] },
        duplicatedFrom: { $exists: false },
        $and: [
          {
            $or: [
              {
                status: {
                  $nin: [
                    CourseStatus.DELETED,
                    CourseStatus.DRAFT_AND_DELETED,
                  ],
                },
              },
              { status: { $exists: false } },
            ],
          },
        ],
      };

      if (searchQuery && searchQuery.trim() !== "") {
        matchStage.$and.push({
          $or: [
            { courseName: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
          ],
        });
      }

      const result = await CourseModel.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: "companycategories",
            localField: "industry",
            foreignField: "_id",
            as: "industryData",
          },
        },
        {
          $lookup: {
            from: "coursecategories",
            localField: "courseCategory",
            foreignField: "_id",
            as: "courseCategoryData",
          },
        },
        {
          $lookup: {
            from: "Companies",
            localField: "companyId",
            foreignField: "_id",
            as: "companyData",
          },
        },
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "duplicatedFrom",
            as: "duplicatedCourses",
          },
        },
        {
          $lookup: {
            from: "Companies",
            localField: "duplicatedCourses.companyId",
            foreignField: "_id",
            as: "duplicatedToCompanies",
          },
        },
        {
          $addFields: {
            industryData: { $arrayElemAt: ["$industryData", 0] },
            courseCategoryData: { $arrayElemAt: ["$courseCategoryData", 0] },
            companyData: { $arrayElemAt: ["$companyData", 0] },
            duplicatedToCompanyNames: "$duplicatedToCompanies.companyname"
          },
        },
        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  courseName: 1,
                  price: 1,
                  description: 1,
                  companyId: 1,
                  language: 1,
                  duration: 1,
                  mode: 1,
                  noOfLeads: 1,
                  courseImage: 1,
                  placementAssistance: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  status: 1,
                  level: 1,
                  industryName: "$industryData.name",
                  courseCategoryName: "$courseCategoryData.name",
                  companyName: "$companyData.companyname",
                  postedBy: 1,
                  duplicatedToCompanyNames: 1,
                },
              },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
        {
          $addFields: {
            total: {
              $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
            },
          },
        },
        {
          $project: {
            data: 1,
            total: 1,
          },
        },
      ]);

      return {
        data: result[0]?.data || [],
        total: result[0]?.total || 0,
        page,
        limit,
      };
    } catch (error) {
      throw new Error("Error fetching courses for Admin: " + error);
    }
  }

  async getAdminInternCourses(
    internId: string,
    page = 1,
    limit = 10,
    searchQuery?: string
  ): Promise<{
    data: Course[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const matchStage: any = {
        'postedBy.role': Role.ADMIN_INTERN,
        'postedBy.userId': new mongoose.Types.ObjectId(internId),
        duplicatedFrom: { $exists: false },
        $and: [
          {
            $or: [
              {
                status: {
                  $nin: [
                    CourseStatus.DELETED,
                    CourseStatus.DRAFT_AND_DELETED,
                  ],
                },
              },
              { status: { $exists: false } },
            ],
          },
        ],
      };

      if (searchQuery && searchQuery.trim() !== "") {
        matchStage.$and.push({
          $or: [
            { courseName: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
          ],
        });
      }

      const result = await CourseModel.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: "companycategories",
            localField: "industry",
            foreignField: "_id",
            as: "industryData",
          },
        },
        {
          $lookup: {
            from: "coursecategories",
            localField: "courseCategory",
            foreignField: "_id",
            as: "courseCategoryData",
          },
        },
        {
          $lookup: {
            from: "Companies",
            localField: "companyId",
            foreignField: "_id",
            as: "companyData",
          },
        },
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "duplicatedFrom",
            as: "duplicatedCourses",
          },
        },
        {
          $lookup: {
            from: "Companies",
            localField: "duplicatedCourses.companyId",
            foreignField: "_id",
            as: "duplicatedToCompanies",
          },
        },
        {
          $addFields: {
            industryData: { $arrayElemAt: ["$industryData", 0] },
            courseCategoryData: { $arrayElemAt: ["$courseCategoryData", 0] },
            companyData: { $arrayElemAt: ["$companyData", 0] },
            duplicatedToCompanyNames: "$duplicatedToCompanies.companyname"
          },
        },
        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  courseName: 1,
                  price: 1,
                  description: 1,
                  companyId: 1,
                  language: 1,
                  duration: 1,
                  mode: 1,
                  noOfLeads: 1,
                  courseImage: 1,
                  placementAssistance: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  status: 1,
                  level: 1,
                  industryName: "$industryData.name",
                  courseCategoryName: "$courseCategoryData.name",
                  companyName: "$companyData.companyname",
                  postedBy: 1,
                  duplicatedToCompanyNames: 1,
                },
              },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
        {
          $addFields: {
            total: {
              $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
            },
          },
        },
        {
          $project: {
            data: 1,
            total: 1,
          },
        },
      ]);

      return {
        data: result[0]?.data || [],
        total: result[0]?.total || 0,
        page,
        limit,
      };
    } catch (error) {
      throw new Error("Error fetching courses for Admin Intern: " + error);
    }
  }

  async getCourseNamesByCompany(companyId: string): Promise<CourseNameResponse> {
    try {
      const courses = await CourseModel.find(
        {
          companyId,
          $or: [
            { status: { $eq: CourseStatus.SUBMITTED }, },
            { status: { $exists: false } },
          ],
        },
        { _id: 1, courseName: 1 }
      )
        .sort({ createdAt: 1 })
        .lean()
        .exec();

      const courseNames: CourseNameResponse = {};
      courses.forEach(course => {
        courseNames[course._id.toString()] = course.courseName;
      });
      return courseNames;
    }
    catch (error) {
      throw new Error("Error fetching course names for Company: " + error);
    }
  }

  async CreateCourses(courseData: ICourseFormData): Promise<Course> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const isUpdate = Boolean(courseData._id);

      const courseCategoryId = courseData.courseCategory
        ? new mongoose.Types.ObjectId(courseData.courseCategory)
        : null;

      const companyCategoryId = courseData.industry
        ? new mongoose.Types.ObjectId(courseData.industry)
        : null;

      const userId = new mongoose.Types.ObjectId(courseData.companyId);

      /* ---------------- UPDATE COURSE ---------------- */
      if (isUpdate) {
        const existingCourse = await CourseModel.findById(courseData._id).session(session);
        if (!existingCourse) {
          throw new Error("Course not found for update");
        }

        const updatedCourse = await CourseModel.findByIdAndUpdate(
          courseData._id,
          {
            ...courseData,
            courseCategory: courseCategoryId,
            industry: companyCategoryId,
          },
          { new: true, session }
        );

        /* 🔹 UPDATE OUTCOMES (ONLY IF VALID) */
        if (courseData.hasOutcomes && courseData.outcomes?.length) {
          const courseId = new mongoose.Types.ObjectId(courseData._id);

          const validOutcomes = buildValidOutcomes(
            courseData.outcomes,
            courseId,
            userId
          );

          // ✅ Touch DB only if ALL required fields are present
          if (validOutcomes.length > 0) {
            await OutcomeModel.deleteMany({ courseId }).session(session);
            await OutcomeModel.insertMany(validOutcomes, { session });
          }
        }

        await session.commitTransaction();
        session.endSession();

        if (
          courseData.status === CourseStatus.SUBMITTED &&
          courseData.companyIds &&
          courseData.companyIds.length > 1
        ) {
          const primaryId = courseData._id as string;
          const remainingIds = courseData.companyIds.filter(id => id !== courseData.companyId);
          if (remainingIds.length > 0 && courseData.updatedBy && primaryId) {
            try {
              await this.duplicateCourseToCompanies(primaryId, remainingIds, courseData.updatedBy);
            } catch (dupError) {
              console.error("Course duplication error:", dupError);
            }
          }
        }

        if (!updatedCourse) {
          throw new Error("Failed to update course");
        }
        return updatedCourse;
      }

      /* ---------------- CREATE COURSE ---------------- */

      const newCourse = new CourseModel({
        ...courseData,
        courseCategory: courseCategoryId,
        industry: companyCategoryId,
        postedBy: courseData.postedBy ? {
          role: courseData.postedBy.role,
          userId: new mongoose.Types.ObjectId(courseData.postedBy.userId)
        } : undefined,
        updatedBy: courseData.updatedBy ? {
          role: courseData.updatedBy.role,
          userId: new mongoose.Types.ObjectId(courseData.updatedBy.userId)
        } : undefined,
      });

      await newCourse.save({ session });

      /* 🔹 CREATE OUTCOMES (ONLY IF VALID) */
      if (courseData.hasOutcomes && courseData.outcomes?.length) {
        const validOutcomes = buildValidOutcomes(
          courseData.outcomes,
          newCourse._id,
          userId
        );

        if (validOutcomes.length > 0) {
          await OutcomeModel.insertMany(validOutcomes, { session });
        }
      }

      /* ---------------- CATEGORY COUNTERS ---------------- */

      if (courseCategoryId && companyCategoryId) {
        await CourseCategoryModel.findOneAndUpdate(
          { _id: courseCategoryId, companyCategoryId },
          { $inc: { NoOfCoursesListing: 1 } },
          { session }
        );
      }

      if (companyCategoryId) {
        await CompanyCategoryModel.findByIdAndUpdate(
          companyCategoryId,
          { $inc: { NoOfCompanies: 1 } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      if (
        courseData.status === CourseStatus.SUBMITTED &&
        courseData.companyIds &&
        courseData.companyIds.length > 1
      ) {
        const primaryId = newCourse._id.toString();
        const remainingIds = courseData.companyIds.filter(id => id !== courseData.companyId);
        if (remainingIds.length > 0 && courseData.updatedBy) {
          try {
            await this.duplicateCourseToCompanies(primaryId, remainingIds, courseData.updatedBy);
          } catch (dupError) {
            console.error("Course duplication error:", dupError);
          }
        }
      }

      return newCourse;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }




  async deleteCourse(courseId: string): Promise<string> {
    try {
      const course = await this.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }
      let toggleDelete = null;
      if (course.status === CourseStatus.DRAFT) {
        toggleDelete = CourseStatus.DRAFT_AND_DELETED;
      } else {
        toggleDelete = CourseStatus.DELETED;
      }
      await CourseModel.findByIdAndUpdate(courseId, { status: toggleDelete });
      return course.courseName;
    } catch (error) {
      throw new Error("Error deleting course: " + error);
    }
  }

  async getCourseById(courseId: string,): Promise<ICourseFormData | null> {
    const [course, outcomes] = await Promise.all([
      CourseModel.findById(courseId).lean(),
      OutcomeModel.find({ courseId }).lean(),
    ]);

    if (!course) return null;

    let postedByName, postedByEmail, updatedByName, updatedByEmail;

    const fetchUserDetails = async (role: string, userId: string) => {
      let user: any;
      if (role === Role.ADMIN) {
         user = await AdminModel.findById(userId).lean();
      } else if (role === Role.ADMIN_INTERN) {
         user = await AdminInternModel.findById(userId).lean();
      } else if (role === Role.COMPANY) {
         user = await CompanyModel.findById(userId).lean();
      }
      return user ? { name: user.name, email: user.email || user.PersonalEmail } : null;
    };

    if (course.postedBy) {
      const details = await fetchUserDetails(course.postedBy.role, course.postedBy.userId.toString());
      if (details) {
        postedByName = details.name;
        postedByEmail = details.email;
      }
    }

    if (course.updatedBy) {
      const details = await fetchUserDetails(course.updatedBy.role, course.updatedBy.userId.toString());
      if (details) {
        updatedByName = details.name;
        updatedByEmail = details.email;
      }
    }

    return {
      _id: course._id.toString(),
      companyId: course.companyId ? course.companyId.toString() : "",
      courseName: course.courseName,
      courseUrl: course.courseUrl,
      description: course.description,

      industry: course.industry ? course.industry.toString() : "",
      courseCategory: course.courseCategory ? course.courseCategory.toString() : "",

      price: course.price,
      level: course.level as "Beginner" | "Intermediate" | "Advanced",
      mode: course.mode,
      language: course.language,
      duration: course.duration,

      courseImage: course.courseImage,
      pdf: course.pdf as string[],
      skillsCovered: course.skillsCovered as string[],

      counselor: course.counselor.map(id => id.toString()),
      noOfLeads: course.noOfLeads,

      hasOutcomes: outcomes.length > 0,
      outcomes: outcomes.map(o => ({
        _id: o._id.toString(),
        companyPlaced: o.companyPlaced,
        package: o.package,
        description: o.description,
        link: o.link,
        featured: o.featured,
        verified: o.verified,
        postedBy: o.postedBy,
        userId: o.userId.toString(),
      })),

      placementAssistance: course.placementAssistance,
      placementType: course.placementType as string,

      hasRefundPolicy: course.hasRefundPolicy,
      refundPolicy: course.refundPolicy as string[],

      hasEligibility: course.hasEligibility as boolean,
      eligibilityCriteria: course.eligibilityCriteria as string,

      address: course.address as string,
      status: course.status as CourseStatus,
      createdAt: course.createdAt ? course.createdAt.toISOString() : new Date().toISOString(),
      postedBy: course.postedBy ? { role: course.postedBy.role, userId: course.postedBy.userId.toString(), name: postedByName, email: postedByEmail } : undefined,
      updatedBy: course.updatedBy ? { role: course.updatedBy.role, userId: course.updatedBy.userId.toString(), name: updatedByName, email: updatedByEmail } : undefined,
    };
  }

  async duplicateCourseToCompanies(courseId: string, companyIds: string[], updatedBy: { role: string, userId: string }): Promise<number> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const course = await CourseModel.findById(courseId).lean();
      if (!course) throw new Error("Course not found");

      // 🛡️ Only SUBMITTED (verified/published) courses can be duplicated
      if (course.status !== CourseStatus.SUBMITTED) {
        throw new Error("Only submitted (published) courses can be duplicated to companies");
      }

      const outcomes = await OutcomeModel.find({ courseId }).lean();

      let duplicatedCount = 0;

      for (const targetCompanyId of companyIds) {
        // Prevent duplicating to the same company
        if (course.companyId.toString() === targetCompanyId) continue;

        // Check if course with same name already exists in target company
        const existing = await CourseModel.findOne({
          courseName: course.courseName,
          companyId: targetCompanyId,
          status: { $ne: CourseStatus.DELETED }
        }).session(session);

        if (existing) continue;

        const newCourseData: any = {
          ...course,
          companyId: new mongoose.Types.ObjectId(targetCompanyId),
          postedBy: course.postedBy || { role: Role.ADMIN, userId: new mongoose.Types.ObjectId(targetCompanyId) },
          updatedBy: { role: updatedBy.role, userId: new mongoose.Types.ObjectId(updatedBy.userId) },
          duplicatedFrom: course._id,
        };
        delete newCourseData._id;
        delete newCourseData.createdAt;
        delete newCourseData.updatedAt;

        const newCourse = new CourseModel(newCourseData);
        await newCourse.save({ session });

        if (outcomes.length > 0) {
          const newOutcomes = outcomes.map(o => {
            const out: any = { ...o, courseId: newCourse._id, userId: new mongoose.Types.ObjectId(targetCompanyId), postedBy: Role.ADMIN };
            delete out._id;
            delete out.createdAt;
            delete out.updatedAt;
            return out;
          });
          await OutcomeModel.insertMany(newOutcomes, { session });
        }

        if (newCourse.courseCategory && newCourse.industry) {
          await CourseCategoryModel.findOneAndUpdate(
            { _id: newCourse.courseCategory, companyCategoryId: newCourse.industry },
            { $inc: { NoOfCoursesListing: 1 } },
            { session }
          );
        }

        if (newCourse.industry) {
          await CompanyCategoryModel.findByIdAndUpdate(
            newCourse.industry,
            { $inc: { NoOfCompanies: 1 } },
            { session }
          );
        }

        duplicatedCount++;
      }

      await session.commitTransaction();
      session.endSession();
      return duplicatedCount;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Error duplicating course: " + error);
    }
  }

}