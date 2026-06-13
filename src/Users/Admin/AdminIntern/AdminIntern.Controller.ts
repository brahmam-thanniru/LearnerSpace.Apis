import { Request, Response } from "express";
import { AdminIntern } from "./AdminIntern.Model";
import { AdminInternService } from "./AdminIntern.Service";
import { BaseController } from "../../../Base/BaseController";

export class AdminInternController extends BaseController<AdminIntern> {
    private internService: AdminInternService;

    constructor() {
        const service = new AdminInternService();
        super(service as any);
        this.internService = service;
    }

    async handleCreate(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.internService.handleCreate(req.body);
            res.status(201).json({
                success: true,
                status: 201,
                response: result,
                message: "Admin Intern created successfully"
            });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    async handleUpdate(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.internService.handleUpdate(req.params.id, req.body);
            res.status(200).json({
                success: true,
                status: 200,
                response: result,
                message: "Admin Intern updated successfully"
            });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    async handleGetAssignedCompanies(req: Request, res: Response): Promise<void> {
        try {
            const internId = req.user?.id;
            if (!internId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const result = await this.internService.getAssignedCompanies(internId);
            res.status(200).json({
                success: true,
                status: 200,
                response: result,
                message: "Fetched assigned companies successfully"
            });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    async handleGetAll(req: Request, res: Response): Promise<void> {
        try {
            const result = await (this.internService as any).findAll();
            res.status(200).json({
                success: true,
                status: 200,
                response: result,
                message: "Admin Interns fetched successfully"
            });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.internService.delete(req.params.id);
            if (!result) {
                res.status(404).json({ success: false, status: 404, message: "Not found" });
                return;
            }
            res.status(200).json({
                success: true,
                status: 200,
                response: result,
                message: "Admin Intern deleted successfully"
            });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }
}
