import "reflect-metadata";
import {
    getModelForClass,
    prop,
    index,
    modelOptions,
} from "@typegoose/typegoose";

export enum LeadStatus {
    LEAD = "Lead",
    CUSTOMER = "Customer",
}

/* -------------------- DAILY STATS -------------------- */
@modelOptions({
    schemaOptions: { _id: false },
})
export class DailyStats {
    @prop({ required: true })
    date!: string; // format: YYYY-MM-DD

    @prop({ required: true, default: 0 })
    leads!: number;

    @prop({ required: true, default: 0 })
    convertCount!: number;

    @prop({ required: true, default: 0 })
    totalEarnings!: number;

    @prop({ type: () => [String], required: true, default: [] })
    leadIds!: string[];
}

/* -------------------- MONTHLY STATS -------------------- */
@modelOptions({
    schemaOptions: { _id: false },
})
export class MonthlyStats {
    @prop({ required: true })
    month!: number; // 1–12

    @prop({ required: true, default: 0 })
    leads!: number;

    @prop({ required: true, default: 0 })
    convertCount!: number;

    @prop({ required: true, default: 0 })
    totalEarnings!: number;

    @prop({ type: () => [DailyStats], default: [] })
    days!: DailyStats[];
}

/* -------------------- YEARLY STATS -------------------- */
@index({ year: 1 }, { unique: true })
export class AdminPeriodicLeadStats {

    @prop({ required: true })
    year!: number;

    @prop({ type: () => [MonthlyStats], default: [] })
    months!: MonthlyStats[];

    // Aggregated Year Stats
    @prop({ required: true, default: 0 })
    totalYearLeads!: number;

    @prop({ required: true, default: 0 })
    totalYearConversions!: number;

    @prop({ required: true, default: 0 })
    totalYearEarnings!: number;
}

/* -------------------- MODELS -------------------- */
export const AdminPeriodicLeadStatsModel = getModelForClass(AdminPeriodicLeadStats, {
    schemaOptions: { timestamps: true },
});
