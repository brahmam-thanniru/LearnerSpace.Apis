import { Request, Response } from "express";
import { BaseController } from "../../../Base/BaseController";
import { Leads } from "./Lead.Model";
import { LeadService } from "./Lead.Service";
export class LeadController extends BaseController<Leads> {
  private leadService: LeadService;

  constructor() {
    const service = new LeadService();
    super(service);
    this.leadService = service;
  }

  async handleConvertToCustomer(req: Request, res: Response) {
    try {
      const { leadId } = req.params;

      if (!leadId) {
        return res.status(400).json({
          success: false,
          message: "Lead ID is required",
        });
      }

      const convertedLead = await this.leadService.convertToCustomer(leadId);

      return res.status(200).json({
        success: true,
        message: "Lead successfully converted to customer",
        data: convertedLead,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to convert lead to customer",
      });
    }
  }

  async getLeadsByCompanyId(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { search, status } = req.query;
      const leads = await this.leadService.getLeadsByCompany(
        companyId,
        search as string,
        status as string
      );
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Leads fetched successfully",
        response: leads
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "failed to fetch the leads",
      });
    }
  }

  async getLeadStatsByCourseId(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const leadStats = await this.leadService.getLeadsStatsByCourse(
        courseId
      );
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Lead stats fetched successfully",
        response: leadStats
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "failed to fetch the leads stats",
      });
    }
  }

  async getOverallLeadStats(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const overallStats = await this.leadService.getOverAllLeadStatsByCompany(companyId);
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Overall lead stats fetched successfully",
        response: overallStats
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "failed to fetch the overall lead stats",
      });
    }
  }

  async AssignLeads(req: Request, res: Response) {
    try {
      const response = await this.leadService.assignLead(req.body);
      res.status(200).json(response)
    }
    catch (e) {
      console.error("error in assigning leads ", e)
      res.status(500).json(e);
    }
  }
}
