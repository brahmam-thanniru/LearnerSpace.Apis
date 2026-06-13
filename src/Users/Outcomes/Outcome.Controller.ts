import { Request, Response } from "express";
import { BaseController } from "../../Base/BaseController";
import { OutcomeService } from "./Outcome.Service";
import { Outcome } from "./Outcome.Model";

export interface OutcomeFilters {
  courseId?: string;
  outcomeType?: string;
  search?: string;
  verified?: boolean;
  featured?: boolean;
}
export class OutcomeController extends BaseController<Outcome> {
  protected service: OutcomeService;

  constructor() {
    const outcomeService = new OutcomeService();
    super(outcomeService);
    this.service = outcomeService;
  }

  async handleCreate(req: Request, res: Response): Promise<void> {
    try {
      const outcome = await this.service.createOutcome(req.body);

      res.status(201).json({
        success: true,
        data: outcome,
        message: "Outcome created successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async getOutcomeById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Outcome ID is required",
        });
      }

      const outcome = await this.service.getOutcomeById(id);

      return res.status(200).json({
        success: true,
        data: outcome || {},
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async getOutcomesByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const outcomes = await this.service.getOutcomesByUserId(userId);

      return res.status(200).json({
        success: true,
        data: outcomes,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async getOutcomesByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
      }

      const outcomes = await this.service.getOutcomesByCourseId(courseId);

      return res.status(200).json({
        success: true,
        data: outcomes,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async updateOutcome(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Outcome ID is required",
        });
      }

      const updated = await this.service.updateOutcome(id, req.body);

      return res.status(200).json({
        success: true,
        data: updated,
        message: "Outcome updated successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async getFeaturedOutcomes(req: Request, res: Response) {
    try {
      const data = await this.service.getFeaturedOutcomes();
      return res.status(200).json({
        success: true,
        data: data,
        message: "Outcome updated successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async deleteOutcome(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Outcome ID is required",
        });
      }

      const deleted = await this.service.deleteOutcome(id);

      return res.status(200).json({
        success: true,
        message: deleted ? "Outcome deleted successfully" : "Outcome not found",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async handleGetAll(req: Request, res: Response): Promise<void> {
    try {
      const outcomes = await this.service.getAllOutcomes();

      res.status(200).json({
        success: true,
        data: outcomes,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
  async verifyOutcome(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Outcome ID is required",
        });
      }

      if (verified === undefined) {
        return res.status(400).json({
          success: false,
          message: "verified value is required (true/false)",
        });
      }

      const updated = await this.service.verifyOutcome(id, verified);

      return res.status(200).json({
        success: true,
        data: updated,
        message: `Outcome ${verified ? "verified" : "unverified"} successfully`,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async postOutcomesByCourse(req: Request, res: Response) {
    try {
      const outcome = await this.service.postOutcomesByCourse(req.body);
      res.status(201).json({
        success: true,
        data: outcome,
        message: `Outcome ${req.body._id ? "updated" : "posted"} successfully`,
      });
    }
    catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async getOutcomesByCompany(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { courseId, outcomeType, search, verified, featured } = req.query;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "Company ID is required",
        });
      }

      const filters: OutcomeFilters = {};

      if (courseId) filters.courseId = courseId as string;
      if (outcomeType) filters.outcomeType = outcomeType as string;
      if (search) filters.search = search as string;

      if (verified !== undefined) {
        filters.verified = verified === "true";
      }

      if (featured !== undefined) {
        filters.featured = featured === "true";
      }

      const outcomes = await this.service.getOutcomesByCompanyId(
        companyId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: outcomes,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async getOutcomeByIdCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.service.getOutComeByIdCompany(id);
      res.status(200).json({
        success: true,
        data: result,
        message: "outcome retived"
      })
    } catch (e: any) {
      res.status(400).json({
        success: false,
        error: e.message
      })
    }
  }
}
