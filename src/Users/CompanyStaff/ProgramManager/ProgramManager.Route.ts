import express from "express";
import { ProgramManagerController } from "./ProgramManager.Controller";
import { AuthController } from "../../../Auth/Auth";
import { Role } from "../../CommonModel/User.model";
import { ProgramManagerModel } from "./ProgramManager.Model";

const ProgramManagerRoute = express.Router();
const PMCObj = new ProgramManagerController();

ProgramManagerRoute.get("/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceList("companyId"), (req, res) => PMCObj.handleGetAllByCompnayId(req, res));

ProgramManagerRoute.get("/map/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceList("companyId"), (req, res) => PMCObj.GetProgramManagerNamesAsMap(req, res));

ProgramManagerRoute.get("/single/:PMId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "PMId", model: ProgramManagerModel }), (req, res) => PMCObj.handleGetProgramManagerById(req, res));

ProgramManagerRoute.post("/", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "", model: ProgramManagerModel, }), (req, res) => PMCObj.handleCreate(req, res));

ProgramManagerRoute.patch("/:PMId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "PMId", model: ProgramManagerModel }), (req, res) => PMCObj.handleToggle(req, res));

export { ProgramManagerRoute };