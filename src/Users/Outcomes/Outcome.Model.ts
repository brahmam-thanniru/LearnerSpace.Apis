import "reflect-metadata";
import {
  getModelForClass,
  prop,
  modelOptions,
  index,
} from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Role } from "../CommonModel/User.model";

const enum PostedBy {
  COMPANY = Role.COMPANY,
  LEARNER = Role.LEARNER
}

enum OutcomeType {
  PLACEMENT = "PLACEMENT",
  PROJECT = "PROJECT",
  INTERNSHIP = "INTERNSHIP",
  OTHER = "OTHER",
  SALARY_HIKE = "SALARY_HIKE",
  SKILL_OUTCOME = "SKILL_OUTCOME"
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
@index({ userId: 1 })
@index({ courseId: 1 })
export class Outcome {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true })
  public companyPlaced!: string;

  @prop({ default: false })
  public featured!: boolean;

  @prop({ required: true })
  public package!: string;

  @prop({ required: true })
  public courseId!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public description!: string;

  @prop({ required: true })
  public userId!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public link!: string;

  @prop({
    required: true,
    type: String, default: PostedBy.COMPANY
  })
  public postedBy!: PostedBy;

  @prop({ default: false })
  public verified!: boolean;

  @prop({ required: true, type: String })
  public outcomeType!: OutcomeType;

  @prop()
  public studentName?: string;

  @prop()
  public experienceRange?: string;

  @prop()
  public testimonial?: string;

  @prop()
  public tags?: string[];

  // @prop()
  // public role!: Role;
}

export const OutcomeModel = getModelForClass(Outcome);
