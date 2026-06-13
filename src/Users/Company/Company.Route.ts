import { Router } from "express";
import { CompanyController } from "./Company.Controller";
import { AuthController } from "../../Auth/Auth";
import { Role } from "../CommonModel/User.model";

const router = Router();
const companyController = new CompanyController();

// STATIC ROUTES FIRST
// router.post("/login", (req, res) => companyController.login(req, res));
router.get("/overview", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => companyController.getCompanyOverView(req, res));

router.patch("/changeStatus", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => companyController.ChangeCompanyStatus(req, res));
router.get("/names", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => companyController.getVerifiedCompanyNames(req, res));
router.post("/", (req, res) => companyController.handleCreate(req, res))
    ;
router.get("/", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => companyController.handleGetAllCompany(req, res));

router.get("/dashboard/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceList("companyId"), (req, res) => companyController.Dashboard(req, res));

router.get("/:id", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => companyController.GetCompanyById(req, res));

router.put("/:id", AuthController.middleWare, AuthController.authorize(Role.ADMIN), (req, res) => companyController.handleUpdate(req, res));
// router.delete("/:id", (req, res) => companyController.handleDelete(req, res));

export default router;
