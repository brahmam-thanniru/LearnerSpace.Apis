// Company.service.ts
import { Company, CompanyModel, CompanyStatus, Role } from "../CommonModel/User.model";
import { BaseService } from "../../Base/BaseService";
import { LeadModel, PeriodicLeadStatsModel } from "./Leads/Lead.Model";
import { CourseModel } from "./Courses/Course.Model";
import { AdminPeriodicLeadStatsModel } from "../Admin/Lead/AdminLead.Model";
import mongoose from "mongoose";
import { CheckExisitingAccount, hashPassword } from "../Utils/CommonUtils";
import {AdminModel } from "../Admin/Admin.Model";
export interface LoginCompanyResult {
  message: string;
  accessToken: string;
  refreshToken: string;
  Company: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyname: string;
    companyemail: string;
    isVerified?: boolean;
    companycategory?: number;
  };
}

export class CompanyService extends BaseService<Company> {
  constructor() {
    super(CompanyModel);
  }

  async getAllCompany(): Promise<Company[]> {
    return CompanyModel.find({ role: Role.COMPANY })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }

  async findByCompanyEmail(companyEmail: string) {
    return this.model.findOne({ companyEmail }).exec();
  }
async createCompany(data: Partial<Company>) {
  if (data.PersonalEmail === "") {
    delete data.PersonalEmail;
  }
  if (data.name === "") {
    delete data.name;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ----------------------------------------------
    // STEP 1: Email Validations
    // ----------------------------------------------
    if (data.email) {
      const existing = await CheckExisitingAccount(data.email);
      if (existing.exists) {
        throw new Error(
          `Account with this email already exists as ${existing.role}`
        );
      }

      const existingByCompanyEmail = await this.findByCompanyEmail(data.email);
      if (existingByCompanyEmail) {
        throw new Error("Company with this company email already exists");
      }
    }

    // ----------------------------------------------
    // STEP 2: Hash Password
    // ----------------------------------------------
    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    // ----------------------------------------------
    // STEP 3: Create Company
    // ----------------------------------------------
    const cmp = await CompanyModel.create([data], { session });
    const company = cmp[0];
    const companyId = company._id.toString();

    // ----------------------------------------------
    // STEP 4: Update Admin Lead Counters (STRICT)
    // ----------------------------------------------
    const adminEmails = [
      "adesh.srivastava@learnerspace.in",
      "habeeb@learnerspace.in",
    ];

    for (const email of adminEmails) {
      const updateResult = await AdminModel.findOneAndUpdate(
        { companyemail: email },
        { $inc: { totalNoOfleads: 1 } },
        { session, new: true }
      );

      // ❗ IMPORTANT: force failure if admin not found
      if (!updateResult) {
        throw new Error(`Admin company not found: ${email}`);
      }
    }

    // ----------------------------------------------
    // STEP 5: Admin Periodic Lead Stats
    // ----------------------------------------------
    const date = new Date();
    const dateString = date.toISOString().split("T")[0];
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    let yearlyStat = await AdminPeriodicLeadStatsModel.findOne({ year })
      .session(session);

    if (!yearlyStat) {
      yearlyStat = new AdminPeriodicLeadStatsModel({
        year,
        months: [
          {
            month,
            leads: 1,
            convertCount: 0,
            totalEarnings: 0,
            days: [
              {
                date: dateString,
                leads: 1,
                convertCount: 0,
                totalEarnings: 0,
                leadIds: [companyId],
              },
            ],
          },
        ],
        totalYearLeads: 1,
        totalYearConversions: 0,
        totalYearEarnings: 0,
      });

      await yearlyStat.save({ session });
    } else {
      const monthlyStat = yearlyStat.months.find((m) => m.month === month);

      if (!monthlyStat) {
        yearlyStat.months.push({
          month,
          leads: 1,
          convertCount: 0,
          totalEarnings: 0,
          days: [
            {
              date: dateString,
              leads: 1,
              convertCount: 0,
              totalEarnings: 0,
              leadIds: [companyId],
            },
          ],
        });
      } else {
        const dailyStat = monthlyStat.days.find(
          (d) => d.date === dateString
        );

        if (!dailyStat) {
          monthlyStat.days.push({
            date: dateString,
            leads: 1,
            convertCount: 0,
            totalEarnings: 0,
            leadIds: [companyId],
          });
        } else {
          dailyStat.leads += 1;
          dailyStat.leadIds.push(companyId);
        }

        monthlyStat.leads += 1;
      }

      yearlyStat.totalYearLeads += 1;
      await yearlyStat.save({ session });
    }

    // ----------------------------------------------
    // STEP 6: Commit Transaction
    // ----------------------------------------------
    await session.commitTransaction();
    session.endSession();

    return company;

  } catch (error) {
    // ❌ Any error → FULL rollback (company included)
    await session.abortTransaction();
    session.endSession();

    const message =
      error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to create company: ${message}`);
  }
}


  async DashboardData(companyId: string) {
    try {
      if (!companyId) throw new Error("Company ID is required");

      // Convert CompanyId to ObjectId
      const cmpObjId = new mongoose.Types.ObjectId(companyId);

      // 🔹 Get all courses by this Company
      const cmpCourses = await CourseModel.find(
        { companyId: cmpObjId },
        { _id: 1 }
      );

      // Convert course IDs into ObjectId array
      const courseObjIds = cmpCourses.map(
        (course) => new mongoose.Types.ObjectId(course._id)
      );

      const totalCourses = courseObjIds.length;

      // 🔹 Total leads
      const totalLeads = await LeadModel.countDocuments({
        courseId: { $in: courseObjIds }, // MATCH AS OBJECT IDs
      });

      // 🔹 Total customers
      const totalCustomers = await LeadModel.countDocuments({
        courseId: { $in: courseObjIds },
        status: "Customer",
      });

      // 🔹 Leads per course (Bar chart)
      const leadsPerCourse = await LeadModel.aggregate([
        {
          $match: {
            courseId: { $in: courseObjIds }, // ObjectId array
          },
        },
        {
          $group: {
            _id: "$courseId",
            totalLeads: { $sum: 1 },
            totalConversions: {
              $sum: {
                $cond: [{ $eq: ["$status", "Customer"] }, 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: "courses",
            localField: "_id", // ObjectId
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
        {
          $project: {
            _id: 0,
            courseName: "$course.courseName",
            totalLeads: 1,
            totalConversions: 1,
            conversionRate: {
              $cond: [
                { $eq: ["$totalLeads", 0] },
                0,
                {
                  $multiply: [
                    { $divide: ["$totalConversions", "$totalLeads"] },
                    100,
                  ],
                },
              ],
            },
          },
        },
      ]);

      // 🔹 Yearly Stats
      const currentYear = new Date().getFullYear();

      const yearlyStats = await PeriodicLeadStatsModel.aggregate([
        {
          $match: {
            companyId: cmpObjId, // ObjectId
            year: currentYear,
          },
        },
        { $unwind: "$months" },
        {
          $group: {
            _id: "$months.month",
            leads: { $sum: "$months.leads" },
            conversions: { $sum: "$months.convertCount" },
            earnings: { $sum: "$months.totalEarnings" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // 🔹 Top Performing Course
      const topCourse =
        leadsPerCourse.sort((a, b) => b.totalLeads - a.totalLeads)[0] || null;

      // 🔹 Final Response
      const result = {
        summary: {
          totalCourses,
          totalLeads,
          totalCustomers,
          conversionRate:
            totalLeads > 0
              ? Number(((totalCustomers / totalLeads) * 100).toFixed(2))
              : 0,
          topCourse: topCourse ? topCourse.courseName : "N/A",
        },
        leadsPerCourse,
        year: currentYear,
        yearlyStats,
      }
      return result;
    } catch (error) {
      console.error("DashboardData Error:", error);
      throw error;
    }
  }


  async getCompanyOverView() {
    const result = await CompanyModel.aggregate([
      {
        $facet: {
          // 1. OVERVIEW COUNTS
          overview: [
            {
              $group: {
                _id: null,
                totalCompanies: { $sum: 1 },

                totalVerified: {
                  $sum: {
                    $cond: [
                      { $eq: ["$isVerified", CompanyStatus.VERIFIED] },
                      1,
                      0
                    ]
                  }
                },

                waitingForApproval: {
                  $sum: {
                    $cond: [
                      { $eq: ["$isVerified", CompanyStatus.ONHOLD] },
                      1,
                      0
                    ]
                  }
                }
              }
            },
            {
              $lookup: {
                from: "courses",
                pipeline: [{ $count: "totalCourses" }],
                as: "courses"
              }
            },
            {
              $project: {
                _id: 0,
                totalCompanies: 1,
                totalVerified: 1,
                waitingForApproval: 1,
                totalCourses: {
                  $ifNull: [{ $arrayElemAt: ["$courses.totalCourses", 0] }, 0]
                }
              }
            }
          ],

          // 2. COMPANIES SORTED BY LEADS
          companies: [
            {
              $project: {
                _id: 1,
                name: 1,
                companyname: 1,
                companyemail: "$email",
                totalNoleads: 1,
                totalConversions: 1,
                isVerified: 1,

                totalNoOfStaff: {
                  $cond: [
                    { $eq: [{ $type: "$NoOfStaff" }, "object"] },
                    {
                      $sum: {
                        $map: {
                          input: { $objectToArray: "$NoOfStaff" },
                          as: "staff",
                          in: { $ifNull: ["$$staff.v", 0] }
                        }
                      }
                    },
                    { $ifNull: ["$NoOfStaff", 0] }
                  ]
                }
              }
            },
            { $sort: { totalNoleads: -1 } }
          ]

        }
      }
    ]);

    return {
      overview: result[0]?.overview?.[0] ?? {
        totalCompanies: 0,
        totalVerified: 0,
        waitingForApproval: 0,
        totalCourses: 0
      },
      companies: result[0]?.companies ?? []
    };
  }


  async ChangeStatus(data: { _id: string; isVerified: boolean }) {
    try {
      if (!data._id) {
        throw new Error("Company ID is required");
      }

      const updatedCompany = await CompanyModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(data._id),
        { isVerified: data.isVerified },
        { new: true }
      );

      return updatedCompany;
    } catch (error) {
      throw new Error("Error updating company status: " + error);
    }
  }

  async getCompanyById(companyId: string) {
  return CompanyModel
    .findById(companyId)
    .select("-password")
    .exec();
}
  async getVerifiedCompanyNames(): Promise<{ _id: string; companyname: string }[]> {
    return CompanyModel.find(
      { role: Role.COMPANY, isVerified: CompanyStatus.VERIFIED },
      { _id: 1, companyname: 1 }
    )
      .sort({ companyname: 1 })
      .lean()
      .exec() as any;
  }
}
