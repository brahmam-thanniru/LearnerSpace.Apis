import { BaseService } from "../../../Base/BaseService";
import { AdminIntern, AdminInternModel } from "./AdminIntern.Model";
import { CompanyModel, CompanyStatus } from "../../CommonModel/User.model";
import { CheckExisitingAccount, hashPassword } from "../../Utils/CommonUtils";

export class AdminInternService extends BaseService<AdminIntern> {
    constructor() {
        super(AdminInternModel);
    }

    async handleCreate(data: Partial<AdminIntern>) {
        try {
            if (!data.email || !data.password || !data.name) {
                throw new Error("Name, email, and password are required");
            }

            // Check if email exists
            const existing = await CheckExisitingAccount(data.email);
            if (existing.exists) {
                throw new Error(`Account with this email already exists as ${existing.role}`);
            }

            const hashedPassword = await hashPassword(data.password);
            const intern = new this.model({
                ...data,
                password: hashedPassword,
            });

            return await intern.save();
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    async handleUpdate(id: string, data: Partial<AdminIntern>) {
        try {
            const existingIntern = await this.model.findById(id);
            if (!existingIntern) {
                throw new Error("Intern not found");
            }

            if (data.email && data.email !== existingIntern.email) {
                const existing = await CheckExisitingAccount(data.email);
                if (existing.exists) {
                    throw new Error(`Account with this email already exists as ${existing.role}`);
                }
            }

            const updateData: any = { ...data };
            if (data.password && data.password.trim() !== "") {
                updateData.password = await hashPassword(data.password);
            } else {
                delete updateData.password;
            }

            const updated = await this.model.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            ).exec();

            return updated;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    async getAssignedCompanies(internId: string) {
        try {
            const intern = await this.model.findById(internId).exec();
            if (!intern) {
                throw new Error("Intern not found");
            }

            const companies = await CompanyModel.find({
                _id: { $in: intern.assignedCompanies },
                isVerified: CompanyStatus.VERIFIED,
            }).select("companyname _id").lean().exec();

            return companies;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }
}
