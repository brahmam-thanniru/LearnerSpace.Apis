import { Request, Response } from "express";
import { BaseController } from "../../../Base/BaseController";
import { ProgramManager } from "./ProgramManager.Model";
import { ProgramManagerService } from "./ProgramManager.Service";

export class ProgramManagerController extends BaseController<ProgramManager> {
    protected service: ProgramManagerService;
    constructor() {
        const ProManagerService = new ProgramManagerService();
        super(ProManagerService);
        this.service = ProManagerService
    }
    async handleCreate(req: Request, res: Response): Promise<void> {
        try {
            const data: ProgramManager = req.body;
            const response = await this.service.CreateOrUpdate(data);

            res.status(200).json({
                status: 200,
                message: `Program Manager ${data._id ? "Updated" : "Created"} Successfully`,
                response: response,
            });

        } catch (e: any) {
            console.error("Error in creating/updating Program Manager:", e);

            res.status(500).json({
                status: 500,
                message: e?.message || "Error in creating/updating Program Manager",
            });
        }
    }


    async handleGetAllByCompnayId(req: Request, res: Response): Promise<void> {
        try {
            const { companyId } = req.params;
            const response = await this.service.getAllProgramManagerByCmpId(companyId);
            res.status(200).json({
                status: 200,
                message: 'Fetched successfully',
                response: response,
            })
        } catch (e) {
            console.error(`Error in retiving the Program manager ${e}`);
            res.status(500).json({
                status: 500,
                message: `Error in fetching Program Managers ${e}`
            })
        }
    }

    async handleGetProgramManagerById(req: Request, res: Response): Promise<void> {
        try {
            const { PMId } = req.params;
            const response = await this.service.getProgramManagerById(PMId);
            res.status(200).json({
                status: 200,
                message: `Program Manager with id ${PMId} fetched successfully`,
                response: response
            })
        } catch (e) {
            console.error(`Error in retiving the Program Manager ${e}`);
            res.status(500).json({
                status: 500,
                message: e
            })
        }
    }

    async handleToggle(req: Request, res: Response): Promise<void> {
        try {
            const { PMId } = req.params;
            const response = await this.service.ToggleProgramManager(PMId);
            res.status(200).json({
                status: 200,
                message: `Program Manager ${response?.name} Account ${response?.isDisabled ? "Disabled" : "Enabled"}`,
            })
        }
        catch (e) {
            res.status(500).json({
                status: 500,
                message: `Error in Enable/Disable Accont of Program Manager ${e}`
            })
        }
    }

    async GetProgramManagerNamesAsMap(req: Request, res: Response): Promise<void> {
        try {
            const { companyId } = req.params;
            const response = await this.service.getProgramManagerAsMap(companyId);
            res.status(200).json({
                status: 200,
                message: "Program Manager Fetched as Map successfully",
                response: response,
            })
        } catch (e) {
            console.error(`Error in fetching the Program Managers as Map ${e}`);
            res.status(500).json({
                status: 500,
                message: e
            })
        }
    }
}