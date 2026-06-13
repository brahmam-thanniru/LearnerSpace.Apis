import { BaseController } from "../../../Base/BaseController";
import { Course } from "../../Company/Courses/Course.Model";
import { LearnerCourseService } from "./Learner.Course.Services";
import { Request, Response } from "express";

export class LeanerCourseController extends BaseController<Course> {
  protected service: LearnerCourseService;
  constructor() {
    const userService = new LearnerCourseService();
    super(new LearnerCourseService());
    this.service = userService;
  }
  async getRecommendedCourses(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const courses = await this.service.getRecommendedCourses(userId);

      return res.status(200).json({
        success: true,
        message: "Recommended courses fetched successfully",
        data: courses,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
  async getRecommendedCoursesByCompanyCategory(req: Request, res: Response) {
    try {
      const { userId, companyCategoryId } = req.params;

      if (!companyCategoryId || !userId) {
        return res.status(400).json({
          success: false,
          message: "companyCategoryId and userId are required",
        });
      }

      const courses = await this.service.getRecommendedCoursesByCompanyCategory(
        companyCategoryId,
        userId
      );

      return res.status(200).json({
        success: true,
        message: "Company-category recommended courses fetched successfully",
        data: courses,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
  async getCourses(req: Request, res: Response) {
    try {
      const q = req.query;

      const normalizeArray = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);

      const normalize = (v: any) =>
        v === undefined ||
        v === null ||
        v === "" ||
        v === "{}" ||
        (typeof v === "object" && Object.keys(v).length === 0)
          ? null
          : v;

      const page = Number(q.page) || 1;
      const limit = Number(q.limit) || 20;

      const categories = normalizeArray(q.category);
      const industries = normalizeArray(q.companyCategory);

      const priceMin = normalize(q.priceMin) ? Number(q.priceMin) : null;
      const priceMax = normalize(q.priceMax) ? Number(q.priceMax) : null;

      const mode = normalize(q.mode) ? String(q.mode) : null;
      const languages = normalizeArray(q.language);

      const placementAssistance =
        q.placementAssistance === "true"
          ? true
          : q.placementAssistance === "false"
          ? false
          : null;

      const instructorId = normalize(q.instructorId)
        ? String(q.instructorId)
        : null;

      const search = normalize(q.search) ? String(q.search) : null;

      const filters = {
        categories,
        industries,
        priceMin,
        priceMax,
        mode,
        languages,
        placementAssistance,
        instructorId,
        search,
      };

      const courses = await this.service.getCourses(page, limit, filters);

      return res.status(200).json({
        success: true,
        message: "Courses fetched successfully",
        data: courses,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
  async getCourseById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
      }

      let course: any = null;
      try {
        if (typeof (this.service as any).getCourseById === "function") {
          course = await (this.service as any).getCourseById(id);
        }
      } catch (e) {
        course = null;
      }

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Course fetched successfully",
        data: course,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}
