import { BaseController } from "../../../Base/BaseController";
import { CompanyCategory, CourseCategory } from "./Category.Model";
import { CompanyCategoryService, CourseCategoryService } from "./Category.Service";
import { Request, Response } from "express";

export class CompanyCategoryController extends BaseController<CompanyCategory> {
    protected service: CompanyCategoryService;

    constructor() {
        const categoryService = new CompanyCategoryService();
        super(categoryService);
        this.service = categoryService;
    }

    async getAllCategories(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.service.getAllCategories();
            res.status(200).json({
                success: true,
                status: 200,
                message: 'Categories fetched successfully',
                response: response
            });
        }
        catch (e) {
            res.status(500).json({ status: 500, success: false, message: e || "Internal Server Error" });
        }
    }

    async getCategoryById(req: Request, res: Response): Promise<void> {
        const id = req.params.id;
        const response = await this.service.getCategoryById(id);
        if (response) {
            res.status(200).json(response);
        } else {
            res.status(404).json({ message: "Category not found" });
        }
    }

    async createCategory(req: Request, res: Response): Promise<void> {
        try {
            const CompanycategoryData: Partial<CompanyCategory> = req.body;

            const response = await this.service.createCategory(CompanycategoryData);

            res.status(201).json(response);
        } catch (error) {
            console.error("Create category error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async GetCompanyCatogryasMap(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.service.getCompanyCategoryAsMap();
            res.status(200).json({
                success: true,
                status: 200,
                message: 'Industry Map fetched successfully',
                response: response
            });
        }
        catch (error) {
            console.error("Fetch category error:", error);
            res.status(500).json({
                success: false,
                status: 500,
                message: "Internal Server Error"
            });
        }
    }

}


export class CourseCategoryController extends BaseController<CourseCategory> {

    protected service: CourseCategoryService;

    constructor() {
        const categoryService = new CourseCategoryService();
        super(categoryService);
        this.service = categoryService;
    }

    async getAllCourseCategories(req: Request, res: Response): Promise<void> {
        try {

            const companyIdParam = req.params.companyId as string | undefined;


            if (companyIdParam === undefined) {
                res.status(400).json({ message: "Missing or invalid company ID parameter in route." });
                return;
            }

            const response = await this.service.getAllCourseCategories(companyIdParam as string);

            res.status(200).json({
                success: true,
                status: 200,
                message: 'Categories fetched successfully',
                response: response
            });

        } catch (error: any) {
            console.error("Error retrieving all course categories:", error.message);
            res.status(500).json({ status: 500, success: false, message: "Failed to retrieve categories", error: error.message });
        }
    }

    async getCourseCategoryById(req: Request, res: Response): Promise<void> {
        try {

            const categoryId = req.params.categoryId;

            if (categoryId === undefined) {
                res.status(400).json({ message: "Invalid category ID provided." });
                return;
            }

            const category = await this.service.getCourseCategoryById(categoryId);

            if (!category) {
                res.status(404).json({ message: `Category with ID ${categoryId} not found.` });
                return;
            }

            res.status(200).json(category);

        } catch (error: any) {
            console.error("Error retrieving course category by ID:", error.message);
            res.status(500).json({ message: "Failed to retrieve category", error: error.message });
        }
    }


    async createOrUpdateCourseCategory(req: Request, res: Response): Promise<void> {
        try {
            const CourseCategoryData: Partial<CourseCategory> = req.body;
            const createdOrUpdatedCategory = await this.service.createCourseCategory(CourseCategoryData);

            const isUpdate = CourseCategoryData._id !== undefined;
            const status = isUpdate ? 200 : 201;

            res.status(status).json(createdOrUpdatedCategory);

        } catch (error: any) {
            console.error("Error creating or updating course category:", error.message);

            res.status(400).json({ message: "Operation failed", error: error.message });
        }
    }


    async deleteCourseCategory(req: Request, res: Response): Promise<void> {
        try {
            const categoryId = parseInt(req.params.id as string, 10);

            if (isNaN(categoryId)) {
                res.status(400).json({ message: "Invalid category ID provided." });
                return;
            }

            const result = await (this.service as any).deleteById(categoryId);

            if (!result) {
                res.status(404).json({ message: `Category with ID ${categoryId} not found for deletion.` });
                return;
            }

            res.status(204).send();

        } catch (error: any) {
            console.error("Error deleting course category:", error.message);
            res.status(500).json({ message: "Failed to delete category", error: error.message });
        }
    }
    async getCourseCategoryMap(req: Request, res: Response): Promise<void> {
        try {
            const companyId = req.params.companyId;

            const response = await this.service.getCourseCategoryAsMap(companyId);
            res.status(200).json({
                status: 200,
                success: true,
                message: 'Course Category Map fetched successfully',
                response: response
            });
        } catch (error) {
            res.status(500).json({ message: "Failed to load map" });
        }
    }

    async getAllCourseCategoryMap(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.service.getAllCourseCategoryAsMap();
            res.status(200).json(response);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to load map" });
        }
    }
}