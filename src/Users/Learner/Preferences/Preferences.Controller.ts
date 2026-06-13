import { Request, Response } from "express";
import { BaseController } from "../../../Base/BaseController";
import { PreferencesService } from "./Preferences.Service";
import { LearnerPreferences } from "./Preferences.Model";

export class PreferencesController extends BaseController<LearnerPreferences> {
  protected service: PreferencesService;

  constructor() {
    const preferencesService = new PreferencesService();
    super(preferencesService);
    this.service = preferencesService;
  }

  async getUserPreferences(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const prefs = await this.service.getPreferencesByUserId(userId);

      return res.status(200).json({
        success: true,
        data: prefs || {},
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async handleCreate(req: Request, res: Response): Promise<void> {
    try {
      const prefs = await this.service.createPreferences(req.body);

      res.status(201).json({
        success: true,
        data: prefs,
        message: "Preferences created successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async updateUserPreferences(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const updated = await this.service.updatePreferences(userId, req.body);

      return res.status(200).json({
        success: true,
        data: updated,
        message: "Preferences updated successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async deleteUserPreferences(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const deleted = await this.service.deletePreferences(userId);

      return res.status(200).json({
        success: true,
        message: deleted
          ? "Preferences deleted successfully"
          : "Preferences not found",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async handleGetAllPreferences(req: Request, res: Response) {
    try {
      const prefs = await this.service.getAllPreferences();

      return res.status(200).json({
        success: true,
        data: prefs,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async resetUserPreferences(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const prefs = await this.service.resetPreferences(userId);

      return res.status(200).json({
        success: true,
        data: prefs,
        message: "Preferences reset successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
}
