import { BaseController } from "../../Base/BaseController";
import { Learner } from "../CommonModel/User.model";
import { CommonUserService } from "./User.Service";
import { Request, Response } from "express";

export class CommonUserController extends BaseController<Learner> {
  protected service: CommonUserService;
  constructor() {
    const userService = new CommonUserService();
    super(new CommonUserService());
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
}
