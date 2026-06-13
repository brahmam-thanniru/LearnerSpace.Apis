import "reflect-metadata";
import { Role } from "../../CommonModel/User.model";
import {
  getModelForClass,
  prop,
  modelOptions,
  index,
} from "@typegoose/typegoose";
import mongoose, { Types } from "mongoose";
import { generateEmbedding } from "../../Utils/AiEmbedding";

export enum CourseStatus {
  DRAFT = 0,
  DELETED = 1,
  SUBMITTED = 2,
  DRAFT_AND_DELETED = 3,
}

export enum DurationTime {
  HOURS = 0,
  DAYS = 1,
  MONTH = 2,
  YEAR = 3,
}

export enum Level {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

export enum Mode {
  ONLINE = "online",
  OFFLINE = "offline",
  HYBRID = "hybrid",
}

export enum Language {
  ENGLISH = "english",
  HINDI = "hindi",
  TELUGU = "telugu",
}

@modelOptions({ schemaOptions: { _id: false } })
class Duration {
  @prop({ required: true })
  public value!: number;

  @prop({ required: true, enum: DurationTime })
  public unit!: DurationTime;
}

@modelOptions({ schemaOptions: { _id: false } })
class Chapter {
  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public weeks!: number;
}

@modelOptions({ schemaOptions: { _id: false } })
export class PostedBy {
  @prop({ type: () => String, enum: Role, required: true })
  public role!: Role;

  @prop({ type: () => Types.ObjectId, required: true })
  public userId!: Types.ObjectId;
}

@index({ price: 1 })
@index({ placementAssistance: 1 })
@index({ courseCategory: 1 })
@index(
  {
    courseName: "text",
    description: "text",
    skillsCovered: "text",
  },
  {
    default_language: "none",
    language_override: "none",
  }
)
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class Course {
  public _id?: mongoose.Types.ObjectId;

  @prop({})
  public courseName!: string;

  @prop({ required: true, default: 0 })
  public noOfLeads!: number;

  @prop({})
  public courseUrl!: string;

  @prop({})
  public courseCategory!: Types.ObjectId;

  @prop({})
  public industry!: Types.ObjectId;

  @prop({ required: true, default: 0 })
  public price!: number;

  @prop({ required: true })
  public companyId!: Types.ObjectId;

  @prop({})
  public description!: string;

  @prop({ type: () => [String], })
  public courseImage!: string[];

  @prop({ required: true, default: Mode.ONLINE })
  public mode!: Mode;

  @prop()
  public address?: string;

  @prop({ default: false })
  public placementAssistance!: boolean;

  @prop()
  public placementType?: string;

  @prop({ required: true, default: Language.HINDI })
  public language!: Language;

  @prop({ _id: false })
  public duration!: Duration;

  @prop({ type: () => [String] })
  public pdf?: string[];

  @prop()
  public level?: Level;

  @prop({ type: () => [Chapter] })
  public curriculum?: Chapter[];

  @prop({ default: false })
  public hasOutcomes!: boolean;

  @prop({ default: false })
  public hasRefundPolicy!: boolean;

  @prop({ type: () => [String] })
  public refundPolicy?: string[];

  @prop({ type: () => [String] })
  public skillsCovered?: string[];

  @prop()
  public hasEligibility?: boolean;

  @prop({ type: () => String })
  public eligibilityCriteria?: string;

  @prop({ type: () => [Types.ObjectId] })
  public programManagerIds!: Types.ObjectId[];

  @prop({ type: () => [Types.ObjectId] })
  public counselor!: Types.ObjectId[];

  @prop()
  public batchSize?: number;
  @prop({ type: () => [Number], default: [] })
  public embedding!: number[];

  @prop({ default: Date.now })
  public createdAt?: Date;

  @prop({ default: CourseStatus.DRAFT, enum: CourseStatus })
  status?: CourseStatus;

  @prop({ type: () => PostedBy })
  public postedBy?: PostedBy;

  @prop({ type: () => PostedBy })
  public updatedBy?: PostedBy;

  @prop({ type: () => Types.ObjectId, ref: 'Course' })
  public duplicatedFrom?: Types.ObjectId;
}

export const CourseModel = getModelForClass(Course);
const CourseSchema = CourseModel.schema;
CourseSchema.pre("save", async function (next) {
  if (
    !this.isModified("courseName") &&
    !this.isModified("description") &&
    !this.isModified("skillsCovered")
  ) {
    return next();
  }

  const combinedText = `
    ${this.courseName}
    ${this.description}
    ${(this.skillsCovered || []).join(" ")}
  `;

  this.embedding = await generateEmbedding(combinedText);

  next();
});
