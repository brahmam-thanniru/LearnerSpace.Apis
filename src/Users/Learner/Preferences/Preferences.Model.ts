import "reflect-metadata";
import {
  getModelForClass,
  prop,
  modelOptions,
  index,
} from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Language, Mode } from "../../Company/Courses/Course.Model";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
@index({ userId: 1 }) // fast lookup
export class LearnerPreferences {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true, unique: true })
  public userId!: string;

  @prop({ type: () => [Number], default: [] })
  public preferredCompanyCategories!: number[];

  @prop({ type: () => [Number], default: [] })
  public preferredCourseCategories!: number[];

  @prop()
  public minPrice?: number;

  @prop()
  public maxPrice?: number;

  @prop({ type: () => [String], enum: Mode, default: [] })
  public preferredModes!: Mode[];

  @prop({ type: () => [String], enum: Language, default: [] })
  public preferredLanguages!: Language[];

  @prop()
  public placementRequired?: boolean;

  @prop()
  public maxDurationValue?: number;

  @prop({ type: () => [String], default: [] })
  public keywordTags!: string[];

  @prop({ default: true })
  public autoRecommend!: boolean;
}

export const LearnerPreferencesModel = getModelForClass(LearnerPreferences);
