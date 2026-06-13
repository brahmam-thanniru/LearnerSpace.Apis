import express from 'express';
import { CounselorController } from './Counselor.Controller';
import { AuthController } from '../../../Auth/Auth';
import { Role } from '../../CommonModel/User.model';
import { CounselorModel } from './Counselor.model';

const CounselorObj = new CounselorController();
const CounselorRouter = express.Router();

CounselorRouter.post("/", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "", model: CounselorModel }), (req, res) => CounselorObj.handleCreate(req, res));

CounselorRouter.get("/:companyId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceList("companyId"), (req, res) => CounselorObj.getStaffByCompanyId(req, res));

CounselorRouter.patch("/toggle-status/:staffId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "staffId", model: CounselorModel }), (req, res) => CounselorObj.toggleStaffStatus(req, res));

CounselorRouter.put("/", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "", model: CounselorModel }), (req, res) => CounselorObj.updateStaff(req, res));

CounselorRouter.get("/single/:staffId", AuthController.middleWare, AuthController.authorize(Role.COMPANY),
    AuthController.authorizeCompanyResourceSingle({ paramKey: "staffId", model: CounselorModel }), (req, res) => CounselorObj.getStaffById(req, res));

export { CounselorRouter }