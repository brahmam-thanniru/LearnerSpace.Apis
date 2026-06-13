// Preferences.service.ts

import { BaseService } from "../../../Base/BaseService";
import {
  LearnerPreferences,
  LearnerPreferencesModel,
} from "./Preferences.Model";

export class PreferencesService extends BaseService<LearnerPreferences> {
  constructor() {
    super(LearnerPreferencesModel);
  }

  async getPreferencesByUserId(
    userId: string
  ): Promise<LearnerPreferences | null> {
    return this.model.findOne({ userId: userId }).exec();
  }

  async createPreferences(data: Partial<LearnerPreferences>) {
    try {
      if (!data.userId) {
        throw new Error("userId is required to create preferences");
      }

      const exists = await this.getPreferencesByUserId(data.userId);

      if (exists) {
        throw new Error("Preferences already exist for this user");
      }

      const preferences = new this.model(data);
      return await preferences.save();
    } catch (error) {
      throw new Error(
        `Failed to create preferences: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async updatePreferences(
    userId: string,
    updates: Partial<LearnerPreferences>
  ): Promise<LearnerPreferences> {
    try {
      const updated = await this.model.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true } // Create if not exists
      );

      if (!updated) throw new Error("Failed to update preferences");

      return updated;
    } catch (error) {
      throw new Error(
        `Failed to update preferences: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async deletePreferences(userId: string): Promise<boolean> {
    try {
      const result = await this.model.deleteOne({ userId });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete preferences: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getAllPreferences(): Promise<LearnerPreferences[]> {
    return this.model.find().sort({ updatedAt: -1 }).exec();
  }

  async resetPreferences(userId: string): Promise<LearnerPreferences> {
    const defaultData: Partial<LearnerPreferences> = {
      preferredCompanyCategories: [],
      preferredCourseCategories: [],
      preferredModes: [],
      preferredLanguages: [],
      minPrice: undefined,
      maxPrice: undefined,
      placementRequired: undefined,
      maxDurationValue: undefined,
      keywordTags: [],
      autoRecommend: true,
    };

    return await this.updatePreferences(userId, defaultData);
  }
}
