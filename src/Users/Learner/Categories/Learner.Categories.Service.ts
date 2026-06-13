import { Types } from "mongoose";
import { BaseService } from "../../../Base/BaseService";
import {
  CompanyCategory,
  CompanyCategoryModel,
} from "../../Admin/Category/Category.Model";

export class LearnerCategoriesService extends BaseService<CompanyCategory> {
  constructor() {
    super(CompanyCategoryModel);
  }
  async getCategoriesWithCourseCategories() {
    return this.model.aggregate([
      {
        $lookup: {
          from: "coursecategories",
          localField: "_id",
          foreignField: "companyCategoryId",
          as: "courseCategories",
        },
      },
      {
        $sort: {
          companyCategoryId: 1,
        },
      },
      {
        $project: {
          _id: 1,
          companyCategoryId: 1,
          name: 1,
          imageUrl: 1,
          courseCategories: {
            $map: {
              input: "$courseCategories",
              as: "c",
              in: {
                CourseCategoryId: "$$c._id",
                name: "$$c.name",
                imageUrl: "$$c.imageUrl",
              },
            },
          },
        },
      },
    ]);
  }

  async getCourseCountByCompanyCategory(companyCategoryId: string) {
    return this.model.aggregate([
      { $match: { _id: new Types.ObjectId(companyCategoryId) } },

      {
        $lookup: {
          from: "coursecategories",
          localField: "_id",
          foreignField: "companyCategoryId",
          as: "courseCategories",
        },
      },

      {
        $project: {
          _id: 0,
          companyCategoryId: 1,
          courseCount: {
            $sum: "$courseCategories.NoOfCoursesListing",
          },
        },
      },
    ]);
  }
}
