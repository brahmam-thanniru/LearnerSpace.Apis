import "reflect-metadata";
import {
  getModelForClass,
  prop,
  modelOptions,
  index,
} from "@typegoose/typegoose";
import mongoose, { Types } from "mongoose";

// ----------------- ENUMS -----------------
export enum Role {
  LEARNER = "learner",
  COMPANY = "organization",
  ADMIN = "admin",
  PROGRAM_MANAGER = "program_manager",
  COUNSELOR = "counselor",
  ADMIN_INTERN = "admin_intern"
}

export enum CourseCategory {
  EDTECH = "edtech",
  PHOTOGRAPHY = "photography",
}

export enum CompanyStatus {
  UNVERIFIED = 0,
  ONHOLD = 1,
  VERIFIED = 2,
  DISABLE = 3,
}
// ----------------- SUBDOCUMENTS -----------------

class StaffCount {
  @prop({ default: 0 })
  public ProgramManager!: number;

  @prop({ default: 0 })
  public Counselor!: number;
}

@modelOptions({
  schemaOptions: { _id: false },
})
class Name {
  @prop({ required: true })
  public firstname!: string;

  @prop({ default: "" })
  public middlename!: string;

  @prop({ required: true })
  public lastname!: string;
}

// ----------------- BASE USER -----------------
@index({ createdAt: -1 })
@index({ updatedAt: -1 })
@modelOptions({
  schemaOptions: {
    collection: "Learners",
    timestamps: true,
  },
})
export class Learner {
  public _id?: mongoose.Types.ObjectId;

  @prop({ type: () => Name, required: true })
  public name!: Name;

  @prop({ required: true, unique: true, index: true })
  public email!: string;

  @prop({ required: true, index: true, default: Role.LEARNER })
  public role!: Role;

  @prop({ required: true })
  public age!: number;

  @prop({ required: true })
  public number!: number;

  @prop({ required: true })
  public password!: string;


}

// ----------------- Company -----------------
@index({ createdAt: -1 })
@index({ updatedAt: -1 })
@modelOptions({
  schemaOptions: {
    collection: "Companies",
    timestamps: true,
  },
})

export class Company {
  public _id?: mongoose.Types.ObjectId;

  @prop()
  public name?: string;

  @prop({ unique: true, index: true })
  public PersonalEmail?: string;

  @prop({
    required: true,
    enum: Object.values(Role),
    default: Role.COMPANY,
    index: true,
  })
  public role!: Role;

  @prop({ required: true })
  public companyname!: string;

  @prop({ required: true })
  public email!: string;

  @prop({ required: true, default: 0, index: true })
  public totalNoleads!: number;

  @prop({ default: 0 })
  public totalConversions!: number;

  @prop({ type: () => [String] })
  public courseIds?: Types.ObjectId[];

  @prop()
  public linkedinUrl?: string;

  @prop({ required: true, default: CompanyStatus.UNVERIFIED })
  public isVerified!: CompanyStatus;

  @prop({ required: true })
  public password!: string;

  @prop({ _id: false, type: () => StaffCount, default: {} })
  public NoOfStaff!: StaffCount;

  @prop({ required: true, unique: true, index: true })
  public number?: string;

  @prop()
  public activeSessionToken?: string;
}

// ----------------- MODELS -----------------
export const LearnerModel = getModelForClass(Learner);
export const CompanyModel = getModelForClass(Company);