import { Router } from "express";
import { AdminInternController } from "./AdminIntern.Controller";
import { AuthController } from "../../../Auth/Auth";
import { Role } from "../../CommonModel/User.model";

const AdminInternRouter = Router();
const controller = new AdminInternController();

AdminInternRouter.get(
    "/assigned-companies",
    AuthController.middleWare,
    AuthController.authorize(Role.ADMIN_INTERN),
    (req, res) => controller.handleGetAssignedCompanies(req, res)
);

AdminInternRouter.post(
    "/",
    AuthController.middleWare,
    AuthController.authorize(Role.ADMIN),
    (req, res) => controller.handleCreate(req, res)
);

AdminInternRouter.get(
    "/",
    AuthController.middleWare,
    AuthController.authorize(Role.ADMIN),
    (req, res) => controller.handleGetAll(req, res)
);

AdminInternRouter.get(
    "/:id",
    AuthController.middleWare,
    AuthController.authorize(Role.ADMIN),
    (req, res) => controller.handleGetById(req, res)
);

AdminInternRouter   .put(
    "/:id",
    AuthController.middleWare,
    AuthController.authorize(Role.ADMIN),
    (req, res) => controller.handleUpdate(req, res)
);

AdminInternRouter.delete(
    "/:id",
    AuthController.middleWare,
    AuthController.authorize(Role.ADMIN),
    (req, res) => controller.handleDelete(req, res)
);

export { AdminInternRouter};
