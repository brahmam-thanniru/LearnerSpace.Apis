import "reflect-metadata";
import { getModelForClass, prop, index, modelOptions } from "@typegoose/typegoose";
import mongoose, { Types } from "mongoose";

export enum LeadStatus {
  LEAD = "Lead",
  CUSTOMER = "Customer",
}

@index({ _id: 1, assignId: 1, courseId: 1, }, { unique: true })
export class Leads {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true })
  public clientId!: Types.ObjectId;

  @prop({ required: true })
  public courseId!: Types.ObjectId;

  @prop({ required: true, default: Date.now })
  public createdAt!: Date;

  @prop({ required: true, enum: LeadStatus, default: LeadStatus.LEAD })
  public status!: LeadStatus;

  @prop({ required: true })
  public companyId!: Types.ObjectId;

  @prop({})
  public assignTo!: Types.ObjectId;
}

@index(
  { courseId: 1, companyId: 1, year: 1, month: 1, date: 1 },
  { unique: true }
)
export class LeadStats {
  @prop({ required: true })
  courseId!: Types.ObjectId;

  @prop({ required: true })
  companyId!: Types.ObjectId;

  @prop({ required: true })
  year!: number;

  @prop({ required: true })
  month!: number;

  @prop({ required: true })
  date!: number;

  @prop({ required: true, default: 0 })
  leadCount!: number;

  @prop({ required: true, default: 0 })
  convertCount!: number;

  @prop({ required: true, default: 0 })
  conversionRate!: number;

  @prop({ required: true, default: 0 })
  totalEarnings!: number;
}

@modelOptions({
  schemaOptions: { _id: false },
})
export class MonthlyStats {
  @prop({ required: true })
  month!: number;

  @prop({ required: true, default: 0 })
  leads!: number;

  @prop({ required: true, default: 0 })
  convertCount!: number;

  @prop({ required: true, default: 0 })
  totalEarnings!: number;
}

@index({ courseId: 1, companyId: 1, year: 1 }, { unique: true })
export class PeriodicLeadStats {
  @prop({ required: true })
  courseId!: Types.ObjectId;

  @prop({ required: true })
  companyId!: Types.ObjectId;

  @prop({ required: true })
  year!: number;

  @prop({ type: () => [MonthlyStats], default: [] })
  months!: MonthlyStats[];

  @prop({ required: true, default: 0 })
  totalYearLeads!: number;

  @prop({ required: true, default: 0 })
  totalYearConversions!: number;

  @prop({ required: true, default: 0 })
  totalYearEarnings!: number;

  // FIX: Add yearConversionRate to store the derived conversion rate for the year.
  @prop({ required: true, default: 0 })
  public yearConversionRate!: number;
}


export const LeadModel = getModelForClass(Leads, {
  schemaOptions: { timestamps: true },
});

export const LeadStatsModel = getModelForClass(LeadStats, {
  schemaOptions: { timestamps: true },
});

export const PeriodicLeadStatsModel = getModelForClass(PeriodicLeadStats, {
  schemaOptions: { timestamps: true },
});
