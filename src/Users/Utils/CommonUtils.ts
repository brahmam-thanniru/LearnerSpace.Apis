import bcrypt from "bcrypt";
import { AdminModel } from "../Admin/Admin.Model";
import { CompanyModel, LearnerModel, Role } from "../CommonModel/User.model";
import mongoose from "mongoose";
import { CounselorModel } from "../CompanyStaff/Counselor/Counselor.model";
import { ProgramManagerModel } from "../CompanyStaff/ProgramManager/ProgramManager.Model";

export async function hashPassword(password: string) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export async function CheckExisitingAccount(email: string) {
    try {
        const collections = [
            { role: Role.ADMIN, model: AdminModel },
            { role: Role.COUNSELOR, model: CounselorModel },
            { role: Role.COMPANY, model: CompanyModel },
            { role: Role.LEARNER, model: LearnerModel },
            { role: Role.PROGRAM_MANAGER, model: ProgramManagerModel}
        ];

        for (const { role, model } of collections) {
            const found = await (model as any).findOne({ email }).lean().exec();
            if (found) return { exists: true, role };
        }
        return { exists: false };
    } catch (error) {
        throw new Error("Error checking account: " + (error as Error).message);
    }
}

export const toTitleCase = (text: string) =>
    text.toLowerCase().replace(/^\w/, c => c.toUpperCase());


export const buildValidOutcomes = (
  outcomes: any[],
  courseId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) => {
  return outcomes
    .filter(isValidOutcome)
    .map(outcome => ({
      companyPlaced: outcome.companyPlaced.trim(),
      package: outcome.package.trim(),
      description: outcome.description.trim(),
      link: outcome.link.trim(),
      featured: Boolean(outcome.featured),
      verified: false,
      courseId,
      userId,
      postedBy: Role.COMPANY,
    }));
};




export const isValidOutcome = (outcome: any): boolean => {
  return Boolean(
    outcome &&
    outcome.companyPlaced?.trim() &&
    outcome.package?.trim() &&
    outcome.description?.trim() &&
    outcome.link?.trim()
  );
};
