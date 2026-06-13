import express from "express";
import StorageUtils from "./Util.Controller";
import { Role } from "../CommonModel/User.model";
import { AuthController } from "../../Auth/Auth";

const router = express.Router();

router.post("/upload",AuthController.middleWare, AuthController.authorize(Role.COMPANY, Role.ADMIN, Role.COUNSELOR, Role.PROGRAM_MANAGER, Role.ADMIN_INTERN), StorageUtils.storageHandler);

export default router;
