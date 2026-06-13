import { BaseController } from "../../../Base/BaseController";
import { LearnerCategoriesService } from "./Learner.Categories.Service";
import { Request, Response } from "express";
import { CompanyCategory } from "../../Admin/Category/Category.Model";
import { CourseCategoryService } from "../../Admin/Category/Category.Service";

export class LeanerCategoryController extends BaseController<CompanyCategory> {
  protected service: LearnerCategoriesService;
  protected companyCategoryService: LearnerCategoriesService;
  protected courseCategoryService: CourseCategoryService;

  constructor() {
    const categoryService = new LearnerCategoriesService();
    const companyCategoryService = new LearnerCategoriesService();
    const courseCategoryService = new CourseCategoryService();
    super(new LearnerCategoriesService());
    this.service = categoryService;
    this.companyCategoryService = companyCategoryService;
    this.courseCategoryService = courseCategoryService;
  }

  async getAllCategories(req: Request, res: Response) {
    try {
      const categories =
        await this.companyCategoryService.getCategoriesWithCourseCategories();

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
  async getCompanyCategoryCount(req: Request, res: Response) {
    try {
      const { companyCategoryId } = req.params;

      if (!companyCategoryId) {
        return res.status(400).json({
          success: false,
          message: "companyCategoryId is required",
        });
      }

      const countResult =
        await this.companyCategoryService.getCourseCountByCompanyCategory(
          companyCategoryId
        );

      return res.status(200).json({
        success: true,
        data: countResult[0] ?? { courseCount: 0 },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}
