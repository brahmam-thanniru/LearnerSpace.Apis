import { Router } from "express";
import { CompanyCategoryController, CourseCategoryController } from "./Category.Controller";
import { AuthController } from "../../../Auth/Auth";
import { Role } from "../../CommonModel/User.model";


const categoryRouter = Router();
const CourseCategoryRouter = Router();
const categoryObj = new CompanyCategoryController();
const CourseCategoryObj = new CourseCategoryController()

categoryRouter.get("/map", AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN), (req, res) => categoryObj.GetCompanyCatogryasMap(req, res));
categoryRouter.get("/", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => categoryObj.getAllCategories(req, res));
categoryRouter.get("/:id", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => categoryObj.getCategoryById(req, res));
categoryRouter.post("/", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => categoryObj.createCategory(req, res));

CourseCategoryRouter.get("/map", (req, res) => CourseCategoryObj.getAllCourseCategoryMap(req, res));
CourseCategoryRouter.get("/map/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN), (req, res) => CourseCategoryObj.getCourseCategoryMap?.(req, res));
CourseCategoryRouter.get("/:companyId", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => CourseCategoryObj.getAllCourseCategories(req, res));
CourseCategoryRouter.get("/:categoryId", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => CourseCategoryObj.getCourseCategoryById(req, res));
CourseCategoryRouter.post("/", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => CourseCategoryObj.createOrUpdateCourseCategory(req, res));


export { categoryRouter, CourseCategoryRouter };
