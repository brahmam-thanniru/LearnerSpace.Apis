import { Router } from "express";
import { AdminLeadController } from "./AdminLead.Controller";
import { Role } from "../../CommonModel/User.model";
import { AuthController } from "../../../Auth/Auth";
import { AdminPeriodicLeadStatsModel } from "./AdminLead.Model";

const router = Router();
const adminLeadObj = new AdminLeadController();

router.patch("/update-convert", AuthController.middleWare, AuthController.authorize(Role.ADMIN),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "", model: AdminPeriodicLeadStatsModel }), (req, res) => adminLeadObj.handleUpdateConvert(req, res));

router.get("/getStats", AuthController.middleWare, AuthController.authorize(Role.ADMIN),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "", model: AdminPeriodicLeadStatsModel }), (req, res) => adminLeadObj.fetchStats(req, res));

router.get("/dashboard", AuthController.middleWare, AuthController.authorize(Role.ADMIN),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "", model: AdminPeriodicLeadStatsModel }), (req, res) => adminLeadObj.fetchDashoard(req, res));

export default router;