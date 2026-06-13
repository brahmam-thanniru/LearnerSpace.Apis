import { BaseService } from "../../Base/BaseService";
import { Learner, LearnerModel } from "../CommonModel/User.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const JWT_SECRET = {
  value: () => process.env.JWT_SECRET || "your_jwt_secret_key",
};
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 1000 * 60 * 60 * 1, // 1 hour
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
};
export interface LoginInstructorResult {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: {
      firstName: string;
      lastName: string;
      middleName?: string;
    };
    role: string;
  };
}
export class CommonUserService extends BaseService<Learner> {
  constructor() {
    super(LearnerModel);
  }
  async loginUser(
    email: string,
    password: string,
    res: any
  ): Promise<LoginInstructorResult> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    //  Generate Access Token
    const accessToken = jwt.sign(
      {
        uid: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET.value(),
      { expiresIn: "1h" }
    );

    //  Generate Refresh Token
    const refreshToken = jwt.sign(
      {
        uid: user._id,
        email: user.email,
      },
      JWT_SECRET.value(),
      { expiresIn: "30d" }
    );

    //  Set cookies
    res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    return {
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: {
          firstName: user.name?.firstname || "",
          lastName: user.name?.lastname || "",
          middleName: user.name?.middlename,
        },
        role: user.role,
      },
    };
  }
  async signUp(data: Partial<Learner>) {
    if (data.email) {
      const existingByEmail = await this.findByEmail(data.email);
      if (existingByEmail) {
        throw new Error("User with this email already exists");
      }
    }

    if (data.password) {
      data.password = await this.hashPassword(data.password);
    }

    return await this.create(data);
  }
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await this.model.findById(userId).exec();

    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      throw new Error("New password cannot be the same as the old password");
    }

    const hashedPassword = await this.hashPassword(newPassword);

    user.password = hashedPassword;

    user.set("passwordChangedAt", new Date());

    await user.save();

    return {
      message: "Password changed successfully",
    };
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
}
