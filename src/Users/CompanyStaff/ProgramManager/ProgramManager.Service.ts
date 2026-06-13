import { BaseService } from "../../../Base/BaseService";
import { ProgramManager, ProgramManagerModel } from "./ProgramManager.Model";
import { CheckExisitingAccount, hashPassword } from "../../Utils/CommonUtils";
import { CompanyModel } from "../../CommonModel/User.model";
import mongoose from "mongoose";

type PMMap = {
    [PMId: string]: string;
}
export class ProgramManagerService extends BaseService<ProgramManager> {
    constructor() {
        super(ProgramManagerModel)
    }

    async getProgramManagerById(id: string): Promise<ProgramManager | null> {
        try {
            const programManager = await this.model.findOne({ _id: id }).exec();
            return programManager;
        } catch (e) {
            console.error(`error in fetching in program manager ${e}`);
            return null;
        }
    }

    async getAllProgramManagerByCmpId(id: string): Promise<ProgramManager[] | null> {
        try {
            const cmpObjId = new mongoose.Types.ObjectId(id);
            const res = await this.model.find({ companyId: cmpObjId }).exec();
            return res;
        }
        catch (e) {
            console.error(`error in fetching the data of Program Manger CompanyId ${id}`, e);
            return null;
        }
    }

    async ToggleProgramManager(id: string): Promise<ProgramManager | null> {
        try {
            const exitingPm = await this.getProgramManagerById(id);
            if (!exitingPm) throw new Error(`No existing program manager found under id ${id}`);
            const toggle = !exitingPm.isDisabled;
            const res = await this.model.findByIdAndUpdate(exitingPm._id, { isDisabled: toggle }, { new: true }).exec();
            return res;

        } catch (e) {
            console.error(`error in toggle Program Manager ${e}`);
            return null;
        }
    }

    async CreateOrUpdate(data: ProgramManager) {
        try {
            if (data._id) {
                const existingManager = await this.getProgramManagerById(data._id.toString());

                if (!existingManager) {
                    throw new Error(`No Program Manager found with id ${data._id}`);
                }

                const updatedPM = await this.model.findOneAndUpdate(
                    { _id: data._id },
                    {
                        ...data,
                        password: existingManager.password,
                    },
                    { new: true }
                ).exec();

                if (!updatedPM) {
                    throw new Error("Failed to update Program Manager");
                }

                return updatedPM;
            }
            const existing = await CheckExisitingAccount(data.email);
            if (existing.exists) {
                throw new Error(
                    `Account with this email already exists as ${existing.role}`
                );
            }
            data.password = "welcome";
            const hashedPassword = await hashPassword(data.password);

            const createNewPm = await new this.model({
                ...data,
                password: hashedPassword
            }).save();

            if (!createNewPm) {
                throw new Error("Failed to create Program Manager");
            }

            try {
                const compIdObj = new mongoose.Types.ObjectId(data.companyId);

                await CompanyModel.findOneAndUpdate(
                    { _id: compIdObj },
                    { $inc: { "NoOfStaff.ProgramManager": 1 } }
                ).exec();
            } catch (e) {
                console.error("Error incrementing ProgramManager count:", e);
            }

            return createNewPm;

        } catch (e: any) {
            console.error("Error in CreateOrUpdate Program Manager:", e);
            throw new Error(e?.message || "Unknown error in CreateOrUpdate");
        }
    }

    async getProgramManagerAsMap(id: string): Promise<PMMap> {
        try {
            const PM = await this.model.find({ companyId: id }, { _id: 1, name: 1 }).exec();
            const PMNamesMap: PMMap = {}
            PM.forEach((pm) => {
                PMNamesMap[pm._id.toString()] = pm.name;
            })
            return PMNamesMap;
        } catch (e) {
            console.error(`Error in fetching the Program Manger Names as Map ${e}`);
            return {};
        }
    }
}

