import { BaseService } from "../../../Base/BaseService";
import { AdminPeriodicLeadStats, AdminPeriodicLeadStatsModel } from "./AdminLead.Model";
import { AdminLeadService } from "./AdminLead.Service";
import { Request, Response } from "express";

export class AdminLeadController extends BaseService<AdminPeriodicLeadStats> {
    private adminLeadService: AdminLeadService;

    constructor() {
        super(AdminPeriodicLeadStatsModel);
        this.adminLeadService = new AdminLeadService();
    }
    async handleUpdateConvert(req: Request, res: Response) {
        try {
            const result = await this.adminLeadService.updateConvert();
            res.status(200).json({
                success: true,
                status: 200,
                response: result,
                message: "Conversion stats updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                status: 500,
                message: err instanceof Error ? err.message : "Internal server error"
            });
        }
    }

    async fetchStats(req: Request, res: Response) {
        try {
            const result = await this.adminLeadService.fetchAnalytics();
            res.status(200).json({
                success: true,
                status: 200,
                response: result,
                message: "Fetched stats  successfully"
            })
        } catch (err) {
            res.status(500).json({
                success: false,
                status: 500,
                message: err instanceof Error ? err.message : "Internal server error"
            });
        }
    }

    async fetchDashoard(req: Request, res: Response) {
        try {
            const { category } = req.query;
            const result = await this.adminLeadService.dashboard(category as any);
            res.json({
                success: true,
                status: 200,
                message: `DashBoard data for ${category} fetched successfully`,
                response: result
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err instanceof Error ? err.message : "Internal server error"
            });
        }
    }
}
