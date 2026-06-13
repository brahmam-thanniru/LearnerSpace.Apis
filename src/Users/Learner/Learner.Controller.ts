import { BaseController } from "../../Base/BaseController";
import { Learner } from "../CommonModel/User.model";
import { CommonUserService as LearnerService } from "./Learner.Service";
import { Request, Response } from "express";

export class LearnerController extends BaseController<Learner> {
  protected service: LearnerService;
  constructor() {
    const userService = new LearnerService();
    super(new LearnerService());
    this.service = userService;
  }
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await this.service.loginUser(email, password, res);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: err.message || "Login failed",
      });
    }
  }
  async handleSignup(req: Request, res: Response) {
    try {
      const user = await this.service.signUp(req.body);
      res.status(201).json({
        success: true,
        data: user,
        message: "User created successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
  async handleChangePassword(req: any, res: any) {
    try {
      const userId = req.user.uid; // from JWT middleware
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Current password and new password are required",
        });
      }

      const result = await this.service.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to change password",
      });
    }
  }
}
