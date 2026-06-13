
import { BaseController } from "../../../Base/BaseController";
import { Role } from "../../CommonModel/User.model";
import { Course } from "./Course.Model";
import { CourseService, ICourseFormData } from "./Course.Service";
import { Request, Response } from "express";
import mongoose from "mongoose";

export class CourseController extends BaseController<Course> {
  private courseService: CourseService;

  constructor() {
    const service = new CourseService();
    super(service);
    this.courseService = service;
  }

  async handleGetByComapany(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "Invalid company ID format"
        });
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const serchQuery = req.query.search as string | undefined;

      const isIntern = req.user?.role === Role.ADMIN_INTERN;

      const courses = await this.courseService.getCoursesByCompany(
        companyId,
        page,
        limit,
        serchQuery,
        isIntern
      );
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Courses fetched successfully",
        response: courses
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: error.message
      });
    }
  }

  async handleAdminGetCourses(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const serchQuery = req.query.search as string | undefined;

      const courses = await this.courseService.getAdminCourses(
        page,
        limit,
        serchQuery,
      );
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Courses fetched successfully",
        response: courses
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: error.message
      });
    }
  }

  async handleDuplicateCourseToCompanies(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { courseId, companyIds } = req.body;
      
      if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ status: 400, success: false, message: "Invalid course ID" });
      }

      if (!Array.isArray(companyIds) || companyIds.length === 0) {
        return res.status(400).json({ status: 400, success: false, message: "companyIds must be a non-empty array" });
      }

      const invalidIds = companyIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ 
          status: 400, 
          success: false, 
          message: `Invalid company ID(s) found: ${invalidIds.join(", ")}` 
        });
      }

      const duplicatedCount = await this.courseService.duplicateCourseToCompanies(
        courseId, 
        companyIds,
        { role: Role.ADMIN, userId: adminId as string }
      );
      return res.status(200).json({
        status: 200,
        success: true,
        message: `Course duplicated to ${duplicatedCount} companies successfully`,
        response: duplicatedCount
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ status: statusCode, success: false, message: error.message });
    }
  }

  async handleGetCourseNamesByComapany(req: Request, res: Response) {
    try {
      const { companyId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "Invalid company ID format"
        });
      }

      const courseNames = await this.courseService.getCourseNamesByCompany(
        companyId
      );
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Course names fetched successfully",
        response: courseNames
      });
    } catch (error: any) {
      return res.status(500).json({ status: 500, success: false, message: error.message });
    }
  }

  async handleCourseCreate(req: Request, res: Response) {
    try {
      const courseData: ICourseFormData = req.body;

      if (!courseData._id) {
        courseData.postedBy = {
          role: req.user?.role as string,
          userId: req.user?.id as string
        };
      } else {
        delete courseData.postedBy;
      }
      courseData.updatedBy = {
        role: req.user?.role as string,
        userId: req.user?.id as string
      };
      
      const response = await this.courseService.CreateCourses(courseData);
      return res.status(200).json({
        status: 200,
        success: true,
        message: `Course ${courseData.courseName ? `with name ${courseData.courseName} ` : ''}${courseData?._id ? 'updated' : 'created'} successfully`,
        response: response
      });
    }
    catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ status: statusCode, success: false, message: error.message });
    }
  }

  async handleAdminCourseCreate(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User ID not found" });
      }

      const courseData: ICourseFormData = {
        ...req.body,
        companyId: adminId,
        updatedBy: { role: Role.ADMIN, userId: adminId },
      };
      if (!req.body._id) {
        courseData.postedBy = { role: Role.ADMIN, userId: adminId };
      } else {
        delete courseData.postedBy;
      }
      const response = await this.courseService.CreateCourses(courseData);
      return res.status(200).json({
        status: 200,
        success: true,
        message: `Course ${courseData.courseName ? `"${courseData.courseName}" ` : ""}${courseData?._id ? 'updated' : 'created'} successfully`,
        response: response
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ status: statusCode, success: false, message: error.message });
    }
  }

  async handleAdminInternGetCourses(req: Request, res: Response) {
    try {
      const internId = req.user?.id;
      if (!internId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User ID not found" });
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const serchQuery = req.query.search as string | undefined;

      const courses = await this.courseService.getAdminInternCourses(
        internId,
        page,
        limit,
        serchQuery,
      );
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Courses fetched successfully",
        response: courses
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: error.message
      });
    }
  }

  async handleAdminInternGetCourseById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "Invalid course ID format"
        });
      }

      const response = await this.courseService.getCourseById(id);
      
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Course fetched successfully",
        response: response
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ status: statusCode, success: false, message: error.message });
    }
  }

  async handleAdminInternCourseCreate(req: Request, res: Response) {
    try {
      const internId = req.user?.id;
      if (!internId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User ID not found" });
      }

      const courseData: ICourseFormData = {
        ...req.body,
        updatedBy: { role: Role.ADMIN_INTERN, userId: internId },
      };
      if (!req.body._id) {
        courseData.postedBy = { role: Role.ADMIN_INTERN, userId: internId };
      } else {
        delete courseData.postedBy;
      }
      // companyId should be provided by the frontend in req.body
      
      const response = await this.courseService.CreateCourses(courseData);
      return res.status(200).json({
        status: 200,
        success: true,
        message: `Course ${courseData.courseName ? `"${courseData.courseName}" ` : ""}${courseData?._id ? 'updated' : 'created'} successfully`,
        response: response
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ status: statusCode, success: false, message: error.message });
    }
  }

  async deleteCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "Invalid course ID format"
        });
      }

      const response = await this.courseService.deleteCourse(courseId);
      return res.status(200).json({
        status: 200,
        success: true,
        message: `${response} Course deleted successfully`,
        response: response
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ status: statusCode, success: false, message: error.message });
    }
  }

  async GetCourseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const course = await this.courseService.getCourseById(id);
      
      if (!course) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Course not found",
        });
      }

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Course fetched successfully",
        response: course
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}