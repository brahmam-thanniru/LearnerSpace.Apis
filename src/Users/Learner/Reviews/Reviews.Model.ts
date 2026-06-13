import "reflect-metadata";
import {
  getModelForClass,
  prop,
  modelOptions,
  index,
} from "@typegoose/typegoose";
import mongoose from "mongoose";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
@index({ courseId: 1 })
@index({ userId: 1 })
export class Review {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true, min: 1, max: 5 })
  public stars!: number;

  @prop({ required: true })
  public description!: string;

  @prop({ required: true, ref: "Course" })
  public courseId!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public userId!: string;
}

export const ReviewModel = getModelForClass(Review);
