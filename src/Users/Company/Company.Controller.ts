import { Request, Response } from "express";
import { BaseController } from "../../Base/BaseController";
import { Company } from "../CommonModel/User.model";
import { CompanyService } from "./Company.service";
import { toTitleCase } from "../Utils/CommonUtils";
// import { MailService } from "../../Mail/mail.service";

export enum CompanyStatus {
  UNVERIFIED = 0,
  ONHOLD = 1,
  VERIFIED = 2,
  DISABLE = 3,
}
export class CompanyController extends BaseController<Company> {
  protected service: CompanyService;

  constructor() {
    const companyService = new CompanyService();
    super(companyService);
    this.service = companyService;
  }

  async handleCreate(req: Request, res: Response) {
    try {
      const Company = await this.service.createCompany(req.body);
      // await MailService.sendSignupMail(Company.email, Company.name);
      res.status(201).json({
        success: true,
        data: Company,
        message: "company created successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async handleGetAllCompany(req: Request, res: Response) {
    try {
      const Company = await this.service.getAllCompany();
      res.status(201).json({
        success: true,
        status: 200,
        response: Company,
        message: "Companies fetched successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        staus: 200,
        error: err.message,
      });
    }
  }

  async Dashboard(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const company = await this.service.DashboardData(companyId);
      if (!company) {
         res
          .status(404)
          .json({ success: false, message: "Company not found" });
          return
      }

      res.status(200).json({
        success: true,
        status: 200,
        message: "company dashboard fetched successfully",
        response: company,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        status: 400,
        error: err.message,
      });
    }
  }

  async getCompanyOverView(req: Request, res: Response) {
    try {
      const company = await this.service.getCompanyOverView();
      res.status(200).json({
        success: true,
        status: 200,
        message: "company overview fetched successfully",
        response: company,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async ChangeCompanyStatus(req: Request, res: Response) {
    try {
      const result = await this.service.ChangeStatus(req.body);

      if (!result) {
        return res
          .status(404)
          .json({ success: false, message: "Company not found" });
      }

      const statusLabel = toTitleCase(CompanyStatus[result.isVerified]);

      return res.status(200).json({
        success: true,
        status: 200,
        response: result,
        message: `Company Status changed to ${statusLabel}`,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

    async GetCompanyById(req: Request, res: Response) {
      try {
        const { id } = req.params;
        const company = await this.service.getCompanyById(id);
        if (!company) {
           res
            .status(404)
            .json({ success: false, message: "Company not found" });
            return;
        }
  
        res.status(200).json({
          success: true,
          status: 200,
          message: "Company fetched successfully",
          response: company,
        });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: err.message,
        });
      }
    }

      async getVerifiedCompanyNames(req: Request, res: Response) {
        try {
          const names = await this.service.getVerifiedCompanyNames();
          res.status(200).json({
            success: true,
            status: 200,
            message: "Verified company names fetched successfully",
            response: names,
          });
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      }
}