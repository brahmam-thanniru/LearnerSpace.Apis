import { Router } from "express";
import { AuthController } from "./Auth";


const router = Router();
router.post("/login", AuthController.login)
router.get("/verify", AuthController.verifyUser);
router.post("/logout", AuthController.logouthandler);
router.post("/resetpassword", AuthController.ResetPassword);
router.get("/protected", AuthController.protectedRoute);

export default router;
