import { BaseService } from "../../../Base/BaseService";
import { AdminPeriodicLeadStats, AdminPeriodicLeadStatsModel } from "./AdminLead.Model";
import {CourseModel, CourseStatus } from "../../Company/Courses/Course.Model";
import { CompanyModel } from "../../CommonModel/User.model";
import mongoose from "mongoose";


export class AdminLeadService extends BaseService<AdminPeriodicLeadStats> {
    constructor() {
        super(AdminPeriodicLeadStatsModel)
    }
    async updateConvert() {
        const date = new Date();
        const dateString = date.toISOString().split("T")[0];
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const EARNING_INCREMENT = 1000; // add this amount for each conversion

        let yearlyStat = await AdminPeriodicLeadStatsModel.findOne({ year });

        if (!yearlyStat) {
            // Create new yearly record
            yearlyStat = new AdminPeriodicLeadStatsModel({
                year,
                months: [
                    {
                        month,
                        leads: 1,
                        convertCount: 1,
                        totalEarnings: EARNING_INCREMENT,
                        days: [
                            {
                                date: dateString,
                                leads: 0,
                                convertCount: 1,
                                totalEarnings: EARNING_INCREMENT,
                                leadIds: [],
                            },
                        ],
                    },
                ],
                totalYearLeads: 0,
                totalYearConversions: 1,
                totalYearEarnings: EARNING_INCREMENT,
            });

            await yearlyStat.save();
        } else {
            let monthlyStat = yearlyStat.months.find((m) => m.month === month);

            if (!monthlyStat) {
                // Create new month
                monthlyStat = {
                    month,
                    leads: 1,
                    convertCount: 1,
                    totalEarnings: EARNING_INCREMENT,
                    days: [
                        {
                            date: dateString,
                            leads: 0,
                            convertCount: 1,
                            totalEarnings: EARNING_INCREMENT,
                            leadIds: [],
                        },
                    ],
                };
                yearlyStat.months.push(monthlyStat);
            } else {
                // Update existing month
                let dailyStat = monthlyStat.days.find((d) => d.date === dateString);

                if (!dailyStat) {
                    dailyStat = {
                        date: dateString,
                        leads: 0,
                        convertCount: 1,
                        totalEarnings: EARNING_INCREMENT,
                        leadIds: [],
                    };
                    monthlyStat.days.push(dailyStat);
                } else {
                    dailyStat.convertCount += 1;
                    dailyStat.totalEarnings += EARNING_INCREMENT;
                }

                monthlyStat.convertCount += 1;
                monthlyStat.totalEarnings += EARNING_INCREMENT;
            }

            yearlyStat.totalYearConversions += 1;
            yearlyStat.totalYearEarnings += EARNING_INCREMENT;

            await yearlyStat.save();
        }

        // ✅ Return a clean response
        const data = {
            year: yearlyStat.year,
            totalYearConversions: yearlyStat.totalYearConversions,
            totalYearEarnings: yearlyStat.totalYearEarnings,
            updatedMonth: month,
            updatedDate: dateString,
        }
        return data;
    }

    async fetchAnalytics() {
        try {
            const res = await AdminPeriodicLeadStatsModel.find()
                .sort({ year: 1 })
                .lean();

            const sortedData = res.map((yearDoc) => ({
                ...yearDoc,
                months: yearDoc.months.sort((a, b) => a.month - b.month),
            }));

            return sortedData;
        } catch (error) {
            console.error("Error fetching analytics:", error);
            throw new Error("Failed to fetch analytics data");
        }
    }

    async dashboard(category?: string) {
        try {
            // 🔹 Step 1: Filters (if category is provided)
            const courseFilter = category ? { category } : {};
            const companyFilter = category ? { category } : {};

            // 🔹 Step 2: Total Courses
            const totalCourses = await CourseModel.countDocuments(courseFilter);

            // 🔹 Step 3: Total Courses Category-wise
            const categoryWiseCourses = await CourseModel.aggregate([
                {
                    $match: {
                        status: { $eq: CourseStatus.SUBMITTED },
                        ...(category && {
                            $expr: {
                                $eq: ["$industry", new mongoose.Types.ObjectId(category)],
                            },
                        }),
                    },
                },
                {
                    $group: {
                        _id: "$courseCategory", // category ObjectId
                        total: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: "coursecategories", // 🔴 collection name of CourseCategoryModel
                        localField: "_id",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                {
                    $unwind: "$category",
                },
                {
                    $project: {
                        _id: 0,
                        courseCategoryId: "$category._id",
                        courseCategoryName: "$category.name", // ✅ category name
                        total: 1,
                    },
                },
            ]);



            // 🔹 Step 4: Total Companies
            const totalCompanies = await CompanyModel.countDocuments(companyFilter);

            // 🔹 Step 5: Total Leads, Converts, and Ratio
            const adminStats = await AdminPeriodicLeadStatsModel.findOne(
                {},
                {},
                { sort: { year: -1 } }
            );

            const totalLeads = adminStats?.totalYearLeads || 0;
            const totalConverts = adminStats?.totalYearConversions || 0;
            const conversionRatio =
                totalLeads > 0 ? ((totalConverts / totalLeads) * 100).toFixed(2) : "0";

            // 🔹 Step 6: Get current month and current day earnings
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

            let currentMonthEarnings = 0;
            let currentDayEarnings = 0;

            if (adminStats && adminStats.months?.length > 0) {
                const monthStats = adminStats.months.find((m) => m.month === currentMonth);
                if (monthStats) {
                    currentMonthEarnings = monthStats.totalEarnings;

                    const dayStat = monthStats.days.find((d) => d.date === currentDate);
                    if (dayStat) {
                        currentDayEarnings = dayStat.totalEarnings;
                    }
                }
            }

            // 🔹 Step 7: Final Response
            const data = {
                summary: {
                    totalCourses,
                    totalCompanies,
                    totalLeads,
                    totalConverts,
                    conversionRatio: `${conversionRatio}%`,
                    currentMonthEarnings,
                    currentDayEarnings,
                },
                categoryWiseCourses,
            };
            return data;
        } catch (error) {
            console.error("Error in admin dashboard:", error);
            return {
                success: false,
                message: "Failed to load admin dashboard",
            };
        }
    }
}



