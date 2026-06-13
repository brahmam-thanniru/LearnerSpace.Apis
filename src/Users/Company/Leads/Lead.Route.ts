import { Router } from "express";
import { LeadController } from "./Lead.Controller";
import { Role } from "../../CommonModel/User.model";
import { AuthController } from "../../../Auth/Auth";
import { LeadModel } from "./Lead.Model";

const router = Router();
const leadObj = new LeadController();

router.post("/", (req, res) => leadObj.handleCreate(req, res));

router.patch("/:leadId/convert", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "leadId", model: LeadModel }), (req, res) => leadObj.handleConvertToCustomer(req, res));

// router.get("/", (req, res) => leadObj.handleGetAll(req, res));

router.get("/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceList("companyId"), (req, res) => leadObj.getLeadsByCompanyId(req, res));

router.get("/stats/:courseId", AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN), (req, res) => leadObj.getLeadStatsByCourseId(req, res));

router.get("/over-all/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceList("companyId"), (req, res) => leadObj.getOverallLeadStats(req, res));

router.get("/assign", (req, res) => leadObj.AssignLeads(req, res));

export default router;
