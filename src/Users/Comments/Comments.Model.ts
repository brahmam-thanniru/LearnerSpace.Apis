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
@index({ postId: 1 })
@index({ userId: 1 })
export class Comment {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true, type: mongoose.Types.ObjectId })
  public postId!: mongoose.Types.ObjectId;

  @prop({ required: true, type: mongoose.Types.ObjectId })
  public userId!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public text!: string;

  @prop({ default: 0 })
  public likes!: number;

  @prop({ type: mongoose.Types.ObjectId, default: null })
  public parentCommentId?: mongoose.Types.ObjectId | null;
}

export const CommentModel = getModelForClass(Comment);
