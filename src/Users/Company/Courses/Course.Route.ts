import { Router } from "express";
import { CourseController } from "./Course.Controller";
import { AuthController } from "../../../Auth/Auth";
import { Role } from "../../CommonModel/User.model";
import { CourseModel } from "./Course.Model";

const router = Router();
const courseController = new CourseController();

router.post("/", AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "", model: CourseModel }), (req, res) => courseController.handleCourseCreate(req, res));

// Admin-only: create / update a template course (no company ownership check)
router.post("/admin", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => courseController.handleAdminCourseCreate(req, res));

router.get("/admin", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => courseController.handleAdminGetCourses(req, res));
router.post("/admin/duplicate", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => courseController.handleDuplicateCourseToCompanies(req, res));
router.get("/admin-intern", AuthController.middleWare, AuthController.authorize(Role.ADMIN_INTERN), (req, res) => courseController.handleAdminInternGetCourses(req, res));
router.get("/admin-intern/:id", AuthController.middleWare, AuthController.authorize(Role.ADMIN_INTERN), (req, res) => courseController.handleAdminInternGetCourseById(req, res));
router.post("/admin-intern", AuthController.middleWare, AuthController.authorize(Role.ADMIN_INTERN), (req, res) => courseController.handleAdminInternCourseCreate(req, res));
router.get("/:id", AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "id", model: CourseModel }), (req, res) => courseController.GetCourseById(req, res));

router.get("/names/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN),
    AuthController.authorizeCompanyResourceList("companyId"), (req, res) => courseController.handleGetCourseNamesByComapany(req, res));

router.get("/company/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN),
    AuthController.authorizeCompanyResourceList("companyId"), (req, res) => courseController.handleGetByComapany(req, res));

router.patch("/delete/:courseId", AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "courseId", model: CourseModel }), (req, res) => courseController.deleteCourse(req, res));

export default router;
