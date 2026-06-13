import { getModelForClass, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";

export class CompanyCategory {
    public _id?: mongoose.Types.ObjectId;

    @prop({ required: true })
    public name!: string;

    @prop({ type: () => [String], required: true })
    public imageUrl!: string[];

    @prop({ default: 0 })
    public NoOfCompanies!: number;
}

export class CourseCategory {
    public _id?: mongoose.Types.ObjectId;

    @prop({ required: true })
    public name!: string;

    @prop({ type: () => [String], required: true })
    public imageUrl!: string[];

    @prop({ required: true })
    public companyCategoryId!: mongoose.Types.ObjectId;

    @prop({ default: 0 })
    public NoOfCoursesListing!: number;
}

export const CompanyCategoryModel = getModelForClass(CompanyCategory);
export const CourseCategoryModel = getModelForClass(CourseCategory);