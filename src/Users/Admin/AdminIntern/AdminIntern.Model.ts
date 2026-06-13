import { prop, getModelForClass, index } from "@typegoose/typegoose";
import mongoose, { Types } from "mongoose";
import { Role } from "../../CommonModel/User.model";

@index({ email: 1 })
export class AdminIntern {
    @prop({ required: true, unique: true })
    public email!: string;

    @prop({ required: true })
    public name!: string;

    @prop({ required: true, enum: Object.values(Role), default: Role.ADMIN_INTERN })
    public role!: Role;

    @prop({ required: true })
    public password!: string;

    @prop({ type: () => [mongoose.Schema.Types.ObjectId], ref: "Company", default: [] })
    public assignedCompanies!: Types.ObjectId[];

    @prop({ default: Date.now })
    public createdAt?: Date;

    @prop({ default: Date.now })
    public updatedAt?: Date;
}

export const AdminInternModel = getModelForClass(AdminIntern, {
    schemaOptions: { timestamps: true, collection: "admin_interns" },
});
