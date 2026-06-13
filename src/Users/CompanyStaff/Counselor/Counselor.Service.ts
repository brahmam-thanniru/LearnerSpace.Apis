import mongoose from "mongoose";
import { BaseService } from "../../../Base/BaseService";
import { CompanyModel } from "../../CommonModel/User.model";
import { CheckExisitingAccount, hashPassword } from "../../Utils/CommonUtils";
import { Counselor, CounselorModel } from "./Counselor.model";

export class CounselorService extends BaseService<Counselor> {
    constructor() {
        super(CounselorModel)
    }

    async FindOne(email: string) {
        const response = await this.model.findOne({ email }).exec();
        return response;
    }
    async handleCreateOrUpdate(data: Counselor) {
        try {
            // 🔹 If _id exists → UPDATE MODE
            if (data._id) {
                const existingStaff = await this.model.findById(data._id);
                if (!existingStaff) throw new Error("Staff not found");

                const updatedStaff = await this.model
                    .findByIdAndUpdate(
                        data._id,
                        {
                            ...data,
                            password: existingStaff.password, // keep password unchanged
                        },
                        { new: true }
                    )
                    .exec();

                return updatedStaff;
            }

            const company = await CompanyModel.findById(data.companyId)
                .select("NoOfStaff")
                .exec();

            if (!company) throw new Error("Company not found");

            if (company.NoOfStaff.Counselor === 3) {
                throw new Error("Staff limit reached for this company");
            }

            // 2. Check if email exists
            const existing = await CheckExisitingAccount(data.email);
            if (existing.exists) {
                throw new Error(
                    `Account with this email already exists as ${existing.role}`
                );
            }

            // 3. Create new staff
            data.password = "welcome";
            const hashedPassword = await hashPassword(data.password);

            const newStaff = await new this.model({
                ...data,
                password: hashedPassword,
            }).save();

            // 4. Increment staff count
            try {
                await CompanyModel.findByIdAndUpdate(data.companyId, {
                    $inc: { "NoOfStaff.Counselor": 1 },
                }).exec();
            } catch (err) {
                console.error("Error updating company staff count:", err);
            }

            return newStaff;
        } catch (err) {
            throw new Error((err as Error).message);
        }
    }



    async getStaffByCompanyId(companyId: string) {
        try {
            const companyIdObj = new mongoose.Types.ObjectId(companyId);
            const staff: Counselor[] = await this.model.find({ companyId: companyIdObj }).exec();
            return staff;
        } catch (err) {
            throw new Error((err as Error).message);
        }
    }

    async getStaffById(_id: string) {
        try {
            const staff: Counselor | null = await this.model.findById(_id).exec();
            return staff;
        } catch (err) {
            throw new Error((err as Error).message);
        }
    }

    async toggleStaffStatus(staffId: string) {
        try {
            const staff = await this.getStaffById(staffId);
            if (!staff) {
                return {
                    success: false,
                    message: "Staff not found",
                    data: null
                };
            }

            const updatedStaff = await this.model.findByIdAndUpdate(
                staffId,
                { isDisabled: !staff.isDisabled },
                { new: true }
            ).exec();

            return {
                success: true,
                message: staff.isDisabled ? "Staff enabled successfully" : "Staff disabled successfully",
                data: updatedStaff
            };

        } catch (err) {
            return {
                success: false,
                message: (err as Error).message,
                data: null
            };
        }
    }


    async updateStaff(data: Counselor) {
        try {
            const id = String(data._id);
            const staff = await this.getStaffByCompanyId(id);
            if (!staff) throw new Error('Staff not found');
            const updatedStaff = await this.model.findByIdAndUpdate(data._id, data, { new: true }).exec();
            return updatedStaff;
        }
        catch (err) {
            throw new Error((err as Error).message);
        }
    }

}