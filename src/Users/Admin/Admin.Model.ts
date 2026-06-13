import { prop, getModelForClass, index } from "@typegoose/typegoose";
@index({ email: 1 })
export class Admin {
    @prop({ required: true })
    public email!: string;

    @prop({ required: true })
    public name!: string

    @prop({ required: true, default: "admin" })
    public role!: string;

    @prop({ required: true })
    public companyname!: string;

    @prop({ required: true })
    public companyemail!: string;

    @prop({ required: true })
    public password!: string;

    @prop({ default: Date.now })
    public createdAt?: Date;

    @prop({ default: Date.now })
    public updatedAt?: Date;

      @prop({ required: true, default: 0, index: true })
      public totalNoleads!: number;
    
      @prop({ default: 0 })
      public totalConversions!: number;
}

export const AdminModel = getModelForClass(Admin, {
    schemaOptions: { timestamps: true, collection: "admins" },
});
