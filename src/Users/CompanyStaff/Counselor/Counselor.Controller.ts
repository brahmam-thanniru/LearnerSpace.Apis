import { Request, Response } from "express";
import { BaseController } from "../../../Base/BaseController";
import { Counselor } from "./Counselor.model";
import { CounselorService } from "./Counselor.Service";

export class CounselorController extends BaseController<Counselor> {
    protected service: CounselorService;

    constructor() {
        const CounselorServiceObj = new CounselorService();
        super(CounselorServiceObj);
        this.service = CounselorServiceObj;
    }

    async handleCreate(req: Request, res: Response): Promise<void> {
        try {
            const data: Counselor = req.body;
            const response = await this.service.handleCreateOrUpdate(data);
            res.status(200).json(response);

        } catch (e: any) {
            console.error("Error in handleCreate:", e);
            const status = e.status || 500;
            res.status(status).json({
                success: false,
                message: e.message || "Internal server error",
                error: e
            });
        }
    }

    async toggleStaffStatus(req: Request, res: Response): Promise<void> {
        try {
            const { staffId } = req.params;
            const response = await this.service.toggleStaffStatus(staffId);
            res.status(200).json({
                status: 200,
                message: "Fetched successfully",
                response: response
            });
        } catch (e: any) {
            console.error("Error in toggleStaffStatus:", e);
            const status = e.status || 500;
            res.status(status).json({
                success: false,
                message: e.message || "Internal server error",
                error: e
            });
        }
    }

    async getStaffByCompanyId(req: Request, res: Response): Promise<void> {
        try {
            const { companyId } = req.params;
            const response = await this.service.getStaffByCompanyId(companyId);
            res.status(200).json({
                status: 200,
                message: "Counselors fetched successfully",
                response: response
            });
        }
        catch (e: any) {
            console.error("Error in getStaffByCompanyId:", e);
            const status = e.status || 500;
            res.status(status).json({
                success: false,
                message: e.message || "Internal server error",
                error: e
            });
        }
    }

    async updateStaff(req: Request, res: Response): Promise<void> {
        try {
            const data: Counselor = req.body;
            const response = await this.service.updateStaff(data);
            res.status(200).json(response);
        }

        catch (e: any) {
            console.error("Error in updateStaff:", e);
            const status = e.status || 500;
            res.status(status).json({
                success: false,
                message: e.message || "Internal server error",
                error: e
            });
        }
    }

    async getStaffById(req: Request, res: Response): Promise<void> {
        try {
            const { staffId } = req.params;
            if (!staffId) {
                console.log('staff id requeirrd')
            }
            const response = await this.service.getStaffById(staffId);
            res.status(200).json({
                status: 200,
                message: "Fetched successfully",
                response: response
            });
        }
        catch (e: any) {
            console.error("Error in getStaffById:", e);
            const status = e.status || 500;
            res.status(status).json({
                success: false,
                message: e.message || "Internal server error",
                error: e
            });
        }
    }
}