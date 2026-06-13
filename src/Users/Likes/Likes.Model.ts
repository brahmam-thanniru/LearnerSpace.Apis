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
// @index({ postId: 1 })
// @index({ userId: 1 })
// Prevent duplicate likes
@index({ userId: 1, postId: 1 }, { unique: true })
export class Like {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true, type: mongoose.Types.ObjectId })
  public postId!: mongoose.Types.ObjectId;

  @prop({ required: true, type: mongoose.Types.ObjectId })
  public userId!: mongoose.Types.ObjectId;
}

export const LikeModel = getModelForClass(Like);
