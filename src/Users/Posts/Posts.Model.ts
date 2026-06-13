import "reflect-metadata";
import {
  getModelForClass,
  prop,
  modelOptions,
  index,
} from "@typegoose/typegoose";
import mongoose from "mongoose";
export enum PostCategory {
  ALL = 0,
  Tech = 1,
  Career = 2,
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
@index({ userId: 1 })
@index({ courseId: 1 })
export class Posts {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true })
  public description!: string;

  @prop({ required: true })
  public userId!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public likes!: number;

  @prop({ required: true })
  public commentNumber!: number;

  @prop({ required: true })
  public category!: PostCategory;
}
export const PostsModel = getModelForClass(Posts);
