import "reflect-metadata";
import { getModelForClass, prop, index } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Role } from "../../CommonModel/User.model";


@index({ email: 1 })
@index({ companyId: 1 })

export class Counselor {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public companyId!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public email!: string;

  @prop()
  public password?: string;

  @prop({ default: false })
  public isDisabled!: boolean;

  @prop({

    enum: Role,
    type: String,
    default: Role.COUNSELOR
  })
  public role!: Role;

  @prop({ type: () => [mongoose.Types.ObjectId], default: [] })
  public leadIds!: mongoose.Types.ObjectId[];

  @prop({ type: () => [mongoose.Types.ObjectId] })
  public assignedCourse!: mongoose.Types.ObjectId[]

  @prop({ type: () => [mongoose.Types.ObjectId] })
  public ProgramManagerId!: mongoose.Types.ObjectId[];
}

export const CounselorModel = getModelForClass(Counselor);
