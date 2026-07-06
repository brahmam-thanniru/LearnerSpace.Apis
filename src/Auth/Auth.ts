/* eslint-disable linebreak-style */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CompanyModel, Role } from "../Users/CommonModel/User.model";
import bcrypt from "bcrypt";
import { AdminModel } from "../Users/Admin/Admin.Model";

import { Model, Types } from "mongoose";
import { v4 as uuid } from "uuid";
import { AdminInternModel } from "../Users/Admin/AdminIntern/AdminIntern.Model";
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        sessionId: string;
      };
    }
  }
}

interface Options {
  paramKey: string;
  model: Model<any>;
  companyField?: string;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 1000 * 60 * 60 * 1, // 1 hour
};



const JWT_SECRET = {
  value: () => process.env.JWT_SECRET || "your_jwt_secret_key",
};

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const collections: Array<{ mod: any; role: string }> = [
        { mod: AdminModel, role: Role.ADMIN },
        { mod: CompanyModel, role: Role.COMPANY },
        { mod: AdminInternModel, role: Role.ADMIN_INTERN },
      ];

      let user: any = null;
      const sessionId = uuid();
      for (const col of collections) {
        const found = await (col.mod as any).findOne({ email }).exec();
        if (found) {
          user = found;
          break;
        }
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      }

      // 🔐 Password Check
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid password",
        });
      }

      const accessToken = jwt.sign(
        {
          uid: user._id,
          email: user.email,
          role: user.role,
          sessionId: sessionId,
        },
        JWT_SECRET.value(),
        { expiresIn: "1h" }
      );

      const refreshTokenDurationStr = rememberMe ? "30d" : "1d";
      const refreshTokenCookieMaxAge = rememberMe 
        ? 1000 * 60 * 60 * 24 * 30 // 30 days
        : 1000 * 60 * 60 * 24 * 1; // 1 day

      const refreshToken = jwt.sign(
        {
          uid: user._id,
          email: user.email,
          role: user.role,
          sessionId: sessionId,
        },
        JWT_SECRET.value(),
        { expiresIn: refreshTokenDurationStr }
      );

      res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
      res.cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: refreshTokenCookieMaxAge,
      });

      const baseUser = {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name ?? null,
        sessionId: sessionId,
      };

      let companyFields = {};

      if (user.role === Role.COMPANY) {
        companyFields = {
          companyname: user.companyname ?? null,
          PersonalEmail: user.PersonalEmail ?? null,
          isVerified: user.isVerified ?? 0,
          companycategory: user.category ?? null,
        };
      }
      if (user.role === Role.COMPANY) {
        user.activeSessionToken = sessionId;
        await CompanyModel.updateOne(
          { _id: user._id },
          { $set: { activeSessionToken: sessionId } }
        );
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          ...baseUser,
          ...companyFields,
        },
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  }

  static async ResetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res
          .status(400)
          .json({ message: "Email and newPassword required" });
      }

      const collections = [
        { mod: AdminModel, role: Role.ADMIN },
        { mod: CompanyModel, role: Role.COMPANY },
        { mod: AdminInternModel, role: Role.ADMIN_INTERN },
      ];

      let user = null;

      // Find user in Admin or Company collection
      for (const col of collections) {
        const found = await (col.mod as any).findOne({ email });
        if (found) {
          user = found;
          break;
        }
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash and update password

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      if (user.role === Role.ADMIN) {
        await AdminModel.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
      } else if (user.role === Role.COMPANY) {
        await CompanyModel.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
      } else if (user.role === Role.ADMIN_INTERN) {
        await AdminInternModel.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
      }

      return res.status(200).json({
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("ResetPassword error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async middleWare(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, JWT_SECRET.value()) as {
        uid: string;
        email: string;
        role: Role;
        sessionId: string;
      };

      if (decoded && decoded.role === Role.COMPANY) {
        const companyUser = await CompanyModel.findById(decoded.uid)
          .select("activeSessionToken")
          .lean();

        if (!companyUser) {
          return res
            .status(401)
            .json({ message: "Unauthorized: User not found" });
        }
        if (companyUser.activeSessionToken !== decoded.sessionId) {
          return res.status(401).json({
            message: "Unauthorized: you have logined on another device",
          });
        }
      }

      req.user = {
        id: decoded.uid,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
      };

      next();
      return;
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }

  static async verifyUser(req: Request, res: Response) {
    try {
      const token = req.cookies?.accessToken;

      if (!token) {
        return res.status(401).json({ message: "Access token missing" });
      }

      const decoded = jwt.verify(token, JWT_SECRET.value()) as {
        email: string;
        uid: string;
      };

      if (!decoded?.email) {
        return res
          .status(403)
          .json({ message: "Invalid token: email missing" });
      }

      const user = await CompanyModel.findOne({ email: decoded.email });
      if (!user) {
        return res.status(404).json({ message: "User not found in database" });
      }

      return res.status(200).json({
        message: "User is verified",
        status: 200,
      });
    } catch (error) {
      console.error("Verification error:", error);
      return res.status(401).json({ message: "Unauthorized access" });
    }
  }

  static authorize =
    (...allowedRoles: Role[]) =>
      (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({
            message: "Forbidden: Insufficient permissions",
          });
        }

        next();
        return;
      };

  static authorizeCompanyResourceSingle = ({
    paramKey,
    model,
    companyField = "companyId",
  }: Options) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authUser = req.user;

        if (!authUser) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // ✅ Admin bypass
        if (authUser.role === Role.ADMIN) {
          return next();
        }

        const method = req.method;

        if (authUser.role === Role.ADMIN_INTERN) {
          if (method === "POST") {
            const bodyCompanyId = req.body?.[companyField];
            if (!bodyCompanyId) {
              return res.status(400).json({
                message: `${companyField} is required`,
              });
            }
            if (bodyCompanyId.toString() === authUser.id) {
              return next();
            }
            const intern = await AdminInternModel.findById(authUser.id).lean();
            if (!intern) {
              return res.status(403).json({ message: "Intern profile not found" });
            }
            const assignedIds = (intern.assignedCompanies || []).map(id => id.toString());
            if (!assignedIds.includes(bodyCompanyId.toString())) {
              return res.status(403).json({
                message: "Unauthorized to create resource for this company",
              });
            }
            return next();
          }

          const resourceId = req.params[paramKey];
          if (!Types.ObjectId.isValid(resourceId)) {
            return res.status(400).json({ message: "Invalid resource id" });
          }
          const resource = await model.findById(resourceId).lean();
          if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
          }
          const createdBy = (resource as any).createdBy?.toString();
          const companyValue = (resource as Record<string, any>)?.[companyField]?.toString();
          if (createdBy === authUser.id) {
            return next();
          }
          const intern = await AdminInternModel.findById(authUser.id).lean();
          if (!intern) {
            return res.status(403).json({ message: "Intern profile not found" });
          }
          const assignedIds = (intern.assignedCompanies || []).map(id => id.toString());
          if (companyValue && assignedIds.includes(companyValue)) {
            return next();
          }
          return res.status(403).json({
            message: "Unauthorized to access this resource",
          });
        }

        // Post Method
        if (method === "POST") {
          const bodyCompanyId = req.body?.[companyField];

          if (!bodyCompanyId) {
            return res.status(400).json({
              message: `${companyField} is required`,
            });
          }

          if (bodyCompanyId !== authUser.id) {
            return res.status(403).json({
              message: "Unauthorized to create resource for another company",
            });
          }

          return next();
        }
        // For other methods
        const resourceId = req.params[paramKey];

        if (!Types.ObjectId.isValid(resourceId)) {
          return res.status(400).json({ message: "Invalid resource id" });
        }

        const resource = await model
          .findById(resourceId)
          .select(companyField)
          .lean();
        const companyValue = (resource as Record<string, any>)?.[companyField];
        if (!resource || !companyValue) {
          return res.status(404).json({ message: "Resource not found" });
        }

        if (companyValue.toString() !== authUser.id) {
          return res.status(403).json({
            message: "Unauthorized to access this resource",
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({ message: "Authorization failed" });
      }
    };
  };

  static authorizeCompanyResourceList = (paramKey = "companyId") => {
    return (req: Request, res: Response, next: NextFunction) => {
      const authUser = req.user;
      const paramCompanyId = req.params[paramKey];

      if (!authUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // ✅ Admin can access all companies
      if (authUser.role === Role.ADMIN) {
        return next();
      }

      if (
        (authUser.role === Role.COMPANY || authUser.role === Role.ADMIN_INTERN) &&
        authUser.id === paramCompanyId
      ) {
        return next();
      }

      return res.status(403).json({
        message: "Unauthorized to access this company data",
      });
    };
  };

  static async logouthandler(req: Request, res: Response) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      return res
        .status(200)
        .json({ status: 200, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async protectedRoute(req: Request, res: Response) {
    try {
      const accessToken = req.cookies?.accessToken;

      if (!accessToken) {
        return res.status(401).json({
          success: false,
          message: "Access token not found",
          status: 401,
        });
      }

      const decoded = jwt.verify(accessToken, JWT_SECRET.value()) as {
        uid: string;
        email: string;
        role: Role;
        sessionId: string;
      };

      // ✅ POPULATE req.user
      req.user = {
        id: decoded.uid,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
      };


      return res.status(200).json({
        success: true,
        status: 200,
        user: {
          role: req.user.role,
        },
      });
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        status: 401,
      });
    }
  }

}
