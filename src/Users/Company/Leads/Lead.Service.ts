import { BaseService } from "../../../Base/BaseService";
import {
  LeadModel,
  Leads,
  LeadStatsModel,
  LeadStatus,
  PeriodicLeadStatsModel,
} from "./Lead.Model";
import { CourseModel, CourseStatus } from "../Courses/Course.Model";
import mongoose, { PipelineStage, Types } from "mongoose";
import { CompanyModel, Role } from "../../CommonModel/User.model";
import { CounselorModel } from "../../CompanyStaff/Counselor/Counselor.model";


interface IAssignLeadData {
  isAssignEqually?: boolean;
  leadIds?: string[];
  assignTo?: string;
  companyId?: string;
}

export class LeadService extends BaseService<Leads> {
  constructor() {
    super(LeadModel);
  }

  async create(payload: Partial<Leads>) {
    if (!payload.clientId || !payload.courseId) {
      throw new Error("Client ID and Course ID are required");
    }

    const existingLead = await LeadModel.findOne({
      clientId: payload.clientId,
      courseId: payload.courseId,
    });

    if (existingLead) {
      throw new Error("This client already has a lead for this course");
    }

    const lead = await super.create(payload);

    const date = new Date(lead.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    await CompanyModel.findByIdAndUpdate(
      lead.companyId,
      { $inc: { totalNoleads: 1 } },
      { new: true }
    );

    const updatedCourse = await CourseModel.findByIdAndUpdate(
      lead.courseId,
      { $inc: { noOfLeads: 1 } },
      { new: true }
    );

    if (!updatedCourse) {
      throw new Error("Course not found");
    }

    await this.updateLeadStats(
      lead.courseId,
      year,
      month,
      lead.companyId,
      true
    );

    return lead;
  }

  private async updateLeadStats(
    courseId: Types.ObjectId | string,
    year: number,
    month: number,
    companyId: Types.ObjectId | string,
    isLead = false,
    leadIncrement = 1,
    convertIncrement = 1
  ) {
    // date of month as integer (1..31)
    const date = new Date().getDate();

    let leadChange = 0;
    let convertChange = 0;
    let earningsIncrement = 0;

    const course = await CourseModel.findById(courseId);
    if (!course) throw new Error("Course not found");

    if (isLead) {
      leadChange = leadIncrement;
      convertChange = 0;
    } else {
      leadChange = 0;
      convertChange = convertIncrement;
      earningsIncrement = (course.price ?? 0) * convertIncrement;

      await CourseModel.findByIdAndUpdate(
        courseId,
        { $inc: { noOfLeads: -1 } },
        { new: true }
      );
    }

    // update or create daily LeadStats
    const existingDaily = await LeadStatsModel.findOneAndUpdate(
      { courseId, companyId, year, month, date },
      {
        $inc: {
          leadCount: leadChange,
          convertCount: convertChange,
          totalEarnings: earningsIncrement,
        },
      },
      { upsert: true, new: true }
    );

    // Recompute conversion rate for the daily record (guard divide-by-zero)
    existingDaily.conversionRate =
      existingDaily.leadCount > 0
        ? (existingDaily.convertCount / existingDaily.leadCount) * 100
        : 0;

    await existingDaily.save();

    // ---------------------------
    // Periodic (yearly) stats
    // ---------------------------
    const periodic = await PeriodicLeadStatsModel.findOne({
      courseId,
      companyId,
      year,
    });

    if (!periodic) {
      // compute totals and conversion rate from initial values
      const totalYearLeads = Math.max(leadChange, 0);
      const totalYearConversions = convertChange;
      const totalYearEarnings = earningsIncrement;

      // FIX: Set yearConversionRate on creation using totals (derived metric)
      const yearConversionRate =
        totalYearLeads > 0 ? (totalYearConversions / totalYearLeads) * 100 : 0;

      await PeriodicLeadStatsModel.create({
        courseId,
        companyId,
        year,
        months: [
          {
            month,
            leads: Math.max(leadChange, 0),
            convertCount: convertChange,
            totalEarnings: totalYearEarnings,
          },
        ],
        totalYearLeads,
        totalYearConversions,
        totalYearEarnings,
        yearConversionRate, // FIX: added here
      });
    } else {
      // update existing month entry or push a new month
      const monthIndex = periodic.months.findIndex((m) => m.month === month);

      if (monthIndex >= 0) {
        periodic.months[monthIndex].leads += leadChange;
        periodic.months[monthIndex].convertCount += convertChange;
        periodic.months[monthIndex].totalEarnings += earningsIncrement;
      } else {
        periodic.months.push({
          month,
          leads: Math.max(leadChange, 0),
          convertCount: convertChange,
          totalEarnings: earningsIncrement,
        });
      }

      periodic.totalYearLeads += leadChange;
      periodic.totalYearConversions += convertChange;
      periodic.totalYearEarnings =
        (periodic.totalYearEarnings ?? 0) + earningsIncrement;

      periodic.yearConversionRate =
        periodic.totalYearLeads > 0
          ? (periodic.totalYearConversions / periodic.totalYearLeads) * 100
          : 0;

      await periodic.save();
    }
  }

  async convertToCustomer(leadId: string) {
    const lead = await LeadModel.findById(leadId);
    if (!lead) throw new Error("Lead not found");

    if (lead.status === LeadStatus.CUSTOMER) {
      throw new Error("Lead is already a customer");
    }

    lead.status = LeadStatus.CUSTOMER;
    await lead.save();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    await CompanyModel.findByIdAndUpdate(
      lead.companyId,
      { $inc: { totalConversions: 1 } },
      { new: true }
    );

    await this.updateLeadStats(lead.courseId, year, month, lead.companyId);

    return lead;
  }

  async getLeadsByCompany(companyId: string, search?: string, status?: string) {
    try {
      const matchStage: any = {
        companyId: new Types.ObjectId(companyId),
      };

      const pipeline: PipelineStage[] = [
        /* ------------------ MATCH COMPANY ------------------ */
        { $match: matchStage },

        /* ------------------ CAST IDS ------------------ */
        {
          $addFields: {
            courseIdObj: { $toObjectId: "$courseId" },
            clientObj: { $toObjectId: "$clientId" },
          },
        },

        /* ------------------ LOOKUP CLIENT ------------------ */
        {
          $lookup: {
            from: "Learners",
            localField: "clientObj",
            foreignField: "_id",
            as: "clientDetails",
          },
        },
        {
          $unwind: {
            path: "$clientDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        /* ------------------ LOOKUP ACTIVE COURSES ONLY ------------------ */
        {
          $lookup: {
            from: "courses",
            let: { courseId: "$courseIdObj" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$courseId"] },
                },
              },
              {
                $match: {
                  $or: [
                    { status: { $eq: CourseStatus.SUBMITTED }, },
                    { status: { $exists: false } },
                  ],
                },
              },
              {
                $project: {
                  _id: 1,
                  courseName: 1,
                  price: 1,
                  duration: 1,
                  noOfLeads: 1,
                },
              },
            ],
            as: "courseDetails",
          },
        },

        /* ------------------ DROP LEADS WITH DELETED COURSES ------------------ */
        {
          $unwind: {
            path: "$courseDetails",
            preserveNullAndEmptyArrays: false,
          },
        },

        /* ------------------ FACET ------------------ */
        {
          $facet: {
            leads: [
              ...(search && search.trim()
                ? [
                  {
                    $match: {
                      $or: [
                        {
                          "courseDetails.courseName": new RegExp(search, "i"),
                        },
                        {
                          "clientDetails.name.firstname": new RegExp(
                            search,
                            "i"
                          ),
                        },
                        {
                          "clientDetails.name.lastname": new RegExp(
                            search,
                            "i"
                          ),
                        },
                        {
                          "clientDetails.name.middlename": new RegExp(
                            search,
                            "i"
                          ),
                        },
                        { "clientDetails.email": new RegExp(search, "i") },
                      ],
                    },
                  },
                ]
                : []),

              ...(status && status.trim() ? [{ $match: { status } }] : []),

              { $sort: { createdAt: -1 } },

              {
                $project: {
                  _id: 1,
                  companyId: 1,
                  status: 1,
                  createdAt: 1,

                  "clientDetails._id": 1,
                  "clientDetails.name": 1,
                  "clientDetails.number": 1,
                  "clientDetails.email": 1,

                  "courseDetails._id": 1,
                  "courseDetails.courseName": 1,
                  "courseDetails.price": 1,
                  "courseDetails.duration": 1,
                  "courseDetails.noOfLeads": 1,
                },
              },
            ],

            statistics: [
              {
                $group: {
                  _id: null,
                  totalLeads: { $sum: 1 },
                  convertedLeads: {
                    $sum: {
                      $cond: [{ $eq: ["$status", "Customer"] }, 1, 0],
                    },
                  },
                  activeLeads: {
                    $sum: {
                      $cond: [{ $ne: ["$status", "Customer"] }, 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalLeads: 1,
                  convertedLeads: 1,
                  activeLeads: 1,
                  conversionRate: {
                    $round: [
                      {
                        $cond: [
                          { $eq: ["$totalLeads", 0] },
                          0,
                          {
                            $multiply: [
                              {
                                $divide: ["$convertedLeads", "$totalLeads"],
                              },
                              100,
                            ],
                          },
                        ],
                      },
                      2,
                    ],
                  },
                },
              },
            ],
          },
        },

        /* ------------------ FINAL SHAPE ------------------ */
        {
          $project: {
            leads: 1,
            statistics: { $arrayElemAt: ["$statistics", 0] },
          },
        },
      ];

      const result = await LeadModel.aggregate(pipeline);

      return {
        leads: result[0]?.leads || [],
        statistics: result[0]?.statistics || {
          totalLeads: 0,
          convertedLeads: 0,
          activeLeads: 0,
          conversionRate: 0,
        },
      };
    } catch (error) {
      throw new Error("Error fetching leads: " + error);
    }
  }

  async getLeadsStatsByCourse(courseId: string) {
    try {
      if (!courseId) throw new Error("Course ID is required");

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentDate = today.getDate();
      const courseObjId = new mongoose.Types.ObjectId(courseId);

      const [course, leadsStats, yearlyRaw] = await Promise.all([
        CourseModel.aggregate([
          { $match: { _id: courseObjId } },
          {
            $lookup: {
              from: "companycategories",
              localField: "industry",
              foreignField: "_id",
              as: "industryData",
            },
          },
          {
            $lookup: {
              from: "coursecategories",
              localField: "courseCategory",
              foreignField: "_id",
              as: "courseCategoryData",
            },
          },

          {
            $addFields: {
              industryData: { $arrayElemAt: ["$industryData", 0] },
              courseCategoryData: { $arrayElemAt: ["$courseCategoryData", 0] },
            },
          },
          {
            $project: {
              _id: 1,
              courseName: 1,
              price: 1,
              duration: 1,
              description: 1,
              industryName: "$industryData.name",
              courseCategoryName: "$courseCategoryData.name",
            },
          },
        ]),
        LeadStatsModel.aggregate([
          { $match: { courseId: courseObjId } },

          {
            $facet: {
              todayStats: [
                {
                  $match: {
                    year: currentYear,
                    month: currentMonth,
                    date: currentDate,
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalEarnings: { $sum: "$totalEarnings" },
                    leadCount: { $sum: "$leadCount" },
                    convertCount: { $sum: "$convertCount" },
                    conversionRate: { $avg: "$conversionRate" },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    totalEarnings: 1,
                    leadCount: 1,
                    convertCount: 1,
                    conversionRate: { $round: ["$conversionRate", 2] },
                  },
                },
              ],

              monthlyStats: [
                {
                  $group: {
                    _id: { year: "$year", month: "$month" },
                    totalEarnings: { $sum: "$totalEarnings" },
                    leadCount: { $sum: "$leadCount" },
                    convertCount: { $sum: "$convertCount" },
                    conversionRate: { $avg: "$conversionRate" },
                  },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
                {
                  $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    totalEarnings: 1,
                    leadCount: 1,
                    convertCount: 1,
                    conversionRate: { $round: ["$conversionRate", 2] },
                  },
                },
              ],
            },
          },
        ]),

        PeriodicLeadStatsModel.aggregate([
          { $match: { courseId: courseObjId } },
          {
            $project: {
              year: 1,
              totalYearLeads: 1,
              totalYearConversions: 1,
            },
          },
          { $sort: { year: 1 } },
        ]),
      ]);

      const todayStats = leadsStats?.[0]?.todayStats?.[0] || {
        totalEarnings: 0,
        leadCount: 0,
        convertCount: 0,
        conversionRate: 0,
      };

      if (
        todayStats.leadCount > 0 &&
        todayStats.convertCount >= todayStats.leadCount
      ) {
        todayStats.conversionRate = 100;
      }

      // ----------------------------------------------
      // Monthly Stats Fix
      // ----------------------------------------------
      const monthlyStats = (leadsStats?.[0]?.monthlyStats || []).map(
        (m: any) => {
          let rate = m.conversionRate;
          if (m.leadCount > 0 && m.convertCount >= m.leadCount) {
            rate = 100;
          }
          return { ...m, conversionRate: rate };
        }
      );

      const coursePrice = course?.[0].price || 0;

      const yearlyStats = yearlyRaw.map((y) => {
        let computedRate =
          y.totalYearLeads > 0
            ? Number(
              ((y.totalYearConversions / y.totalYearLeads) * 100).toFixed(2)
            )
            : 0;

        if (y.totalYearConversions >= y.totalYearLeads) computedRate = 100;

        return {
          year: y.year,
          totalYearLeads: y.totalYearLeads || 0,
          totalYearConversions: y.totalYearConversions || 0,
          totalEarnings: (y.totalYearConversions || 0) * coursePrice,
          conversionRate: computedRate,
        };
      });
      const data = {
        courseDetails: {
          _id: course[0]._id,
          courseName: course[0].courseName,
          price: course[0].price,
          duration: course[0].duration,
          industryName: course[0].industryName,
          courseCategoryName: course[0].courseCategoryName,
        },
        todayStats: todayStats,
        monthlyStats: monthlyStats,
        yearlyStats: yearlyStats,
      };
      return data;
    } catch (e: any) {
      console.error("Error retrieving course leads stats:", e);

      return {
        success: false,
        message: e.message || "Error retrieving course leads stats",
      };
    }
  }

  async getOverAllLeadStatsByCompany(companyId: string) {
    try {
      if (!companyId) {
        throw new Error("Company ID is required");
      }

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const stats = await LeadStatsModel.aggregate([
        /* ------------------ MATCH COMPANY + TIME ------------------ */
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            year: currentYear,
            month: currentMonth,
          },
        },

        /* ------------------ GROUP BY COURSE ------------------ */
        {
          $group: {
            _id: "$courseId",
            totalLeads: { $sum: "$leadCount" },
            totalConverted: { $sum: "$convertCount" },
            totalEarnings: { $sum: "$totalEarnings" },
          },
        },

        /* ------------------ LOOKUP ACTIVE COURSES ONLY ------------------ */
        {
          $lookup: {
            from: "courses",
            let: { courseId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$courseId"] },
                },
              },
              {
                $match: {
                  $or: [
                    { status: { $eq: CourseStatus.SUBMITTED } },
                    { status: { $exists: false } },
                  ],
                },
              },
              {
                $project: {
                  _id: 1,
                  courseName: 1,
                },
              },
            ],
            as: "courseInfo",
          },
        },

        /* ------------------ REMOVE STATS WITH DELETED COURSES ------------------ */
        {
          $unwind: {
            path: "$courseInfo",
            preserveNullAndEmptyArrays: false,
          },
        },

        /* ------------------ FINAL PROJECTION ------------------ */
        {
          $project: {
            _id: 0,
            courseId: "$_id",
            courseName: "$courseInfo.courseName",
            leadCount: "$totalLeads",
            convertCount: "$totalConverted",
            totalEarnings: 1,
            conversionRate: {
              $cond: [
                { $eq: ["$totalLeads", 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$totalConverted", "$totalLeads"] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              ],
            },
          },
        },

        /* ------------------ SORT ------------------ */
        { $sort: { leadCount: -1 } },
      ]);

      return {
        month: currentMonth,
        year: currentYear,
        totalCourses: stats.length,
        stats,
      };
    } catch (error) {
      console.error("Error fetching overall lead stats:", error);
      throw new Error("Failed to fetch overall lead stats");
    }
  }

  async assignLead(data: IAssignLeadData) {
    try {
      const { isAssignEqually, leadIds, assignTo, companyId } = data;

      if (!companyId) {
        throw new Error("companyId is required");
      }

      if (isAssignEqually) {
        const salesExecutives = await CounselorModel.find({
          companyId,
          role: Role.COUNSELOR,
        }).select("_id");

        if (salesExecutives.length === 0) {
          throw new Error("No Sales Executives found for this company");
        }

        const leads = await LeadModel.find({
          companyId,
          status: LeadStatus.LEAD,
        }).select("_id");

        if (leads.length === 0) {
          throw new Error("No leads found to assign");
        }

        // ROUND ROBIN DISTRIBUTION
        let execIndex = 0;

        const bulkOps: any[] = [];

        for (let i = 0; i < leads.length; i++) {
          const leadId = leads[i]._id;
          const assignToId = salesExecutives[execIndex]._id;

          bulkOps.push({
            updateOne: {
              filter: { _id: leadId },
              update: { assignTo: assignToId },
            },
          });

          // Move to next sales executive in round-robin order
          execIndex = (execIndex + 1) % salesExecutives.length;
        }

        // Execute bulk update
        await LeadModel.bulkWrite(bulkOps);

        return {
          message: "Leads assigned equally among Sales Executives",
          assignedLeads: leads.length,
          salesExecutives: salesExecutives.length,
        };
      }

      // 2️⃣ CASE B: Manual Assignment (leadIds + assignTo will come)
      if (!assignTo || !leadIds || leadIds.length === 0) {
        throw new Error(
          "assignTo and leadIds are required for manual assignment"
        );
      }

      await LeadModel.updateMany({ _id: { $in: leadIds } }, { assignTo });

      return {
        message: "Leads assigned successfully",
        assignedLeads: leadIds.length,
        assignTo,
      };
    } catch (error: any) {
      throw new Error(error.message || "Error assigning leads");
    }
  }
}

