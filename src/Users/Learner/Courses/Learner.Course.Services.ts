import { Types } from "mongoose";
import { BaseService } from "../../../Base/BaseService";
import { Course, CourseModel } from "../../Company/Courses/Course.Model";
import { PreferencesService } from "../Preferences/Preferences.Service";
import Fuse from "fuse.js";
import {
  CompanyCategoryModel,
  CourseCategoryModel,
} from "../../Admin/Category/Category.Model";

const SCORE_WEIGHTS = {
  companyCategory: 30,
  courseCategory: 25,
  mode: 15,
  language: 10,
  placement: 10,
  price: 10,
  duration: 5,
  keyword: 5,
  recencyBoost: 5,
  diversityBoost: 5,
  mismatchPenalty: -3,
};
// Build a loose regex like token1.*token2.*token3 (escape tokens)
function buildFuzzyRegex(tokens: string[]) {
  const escaped = tokens.map((t) => escapeRegex(t));
  return new RegExp(escaped.join(".*"), "i");
}

export class LearnerCourseService extends BaseService<Course> {
  private prefService: PreferencesService;

  constructor() {
    super(CourseModel);
    this.prefService = new PreferencesService();
  }
  private async fuseSearch(
    rawQuery: string,
    limit = 20,
    existingQuery: any = {}
  ) {
    // Pull a bounded candidate set from DB to run Fuse in-memory
    const limitForCandidates = Math.max(200, limit * 10);

    const candidates = await CourseModel.aggregate([
      { $match: existingQuery },
      {
        $lookup: {
          from: "Companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $addFields: {
          companyName: { $arrayElemAt: ["$company.companyname", 0] },
        },
      },
      { $project: { company: 0 } },
      { $sort: { createdAt: -1 } },
      { $limit: limitForCandidates },
    ]);

    if (!candidates || candidates.length === 0) return [];

    const fuse = new Fuse(candidates, {
      keys: [
        { name: "courseName", weight: 0.5 },
        { name: "description", weight: 0.25 },
        { name: "skillsCovered", weight: 0.15 },
        { name: "companyName", weight: 0.1 },
      ],
      threshold: 0.4, // tweak: lower -> stricter
      distance: 100,
      minMatchCharLength: 2,
    });

    const fuseRes = fuse.search(rawQuery, { limit });
    return fuseRes.map((r: any) => r.item);
  }
  // Hybrid "similar courses" using embeddings + metadata boosts
  async findSimilarCourses(courseId: string, limit = 10) {
    const course = await CourseModel.findById(courseId).lean();
    if (!course) return [];

    // 1) semantic similarity via embeddings (aiSearch already returns sorted ids)
    const aiCandidates = await this.aiSearch(
      [course.courseName, course.description].join(" "),
      limit * 3
    );

    // 2) metadata-based candidates: same category, shared skills, same company
    const skillMatches = (course.skillsCovered || []).slice(0, 10);
    const metadataQuery: any = {
      _id: { $ne: course._id },
      $or: [
        { courseCategory: course.courseCategory },
        { companyId: course.companyId },
        { skillsCovered: { $in: skillMatches } },
      ],
    };

    const metadataCandidates = await CourseModel.aggregate([
      { $match: metadataQuery },
      {
        $lookup: {
          from: "Companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $addFields: {
          companyName: { $arrayElemAt: ["$company.companyname", 0] },
        },
      },
      { $project: { company: 0 } },
      { $limit: limit * 3 },
    ]);

    // Combine ids and dedupe while preserving order (aiCandidates first)
    const combinedIds = Array.from(
      new Set([
        ...aiCandidates.map(String),
        ...metadataCandidates.map((c) => String(c._id)),
      ])
    ).slice(0, limit * 3);

    // Fetch final course docs in that order
    const finalCourses = await CourseModel.aggregate([
      {
        $match: {
          _id: { $in: combinedIds.map((id) => new Types.ObjectId(id)) },
        },
      },
      {
        $lookup: {
          from: "Companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $addFields: {
          companyName: { $arrayElemAt: ["$company.companyname", 0] },
        },
      },
      { $project: { company: 0 } },
    ]);

    // score each by hybrid metric (embedding rank + metadata overlap)
    const idToIndex = (arr: string[]) =>
      arr.reduce(
        (acc: any, id: string, idx: number) => ((acc[id] = idx), acc),
        {}
      );

    const aiIndex = idToIndex(aiCandidates.map(String));
    const metaIndex = idToIndex(
      metadataCandidates.map((c: any) => String(c._id))
    );

    const scored = finalCourses.map((c: any) => {
      const idStr = String(c._id);
      let score = 0;
      if (aiIndex[idStr] !== undefined) score += 50 - aiIndex[idStr]; // higher if earlier
      if (metaIndex[idStr] !== undefined) score += 30 - metaIndex[idStr];
      if (String(c.courseCategory) === String(course.courseCategory))
        score += 10;
      if (String(c.companyId) === String(course.companyId)) score += 8;
      // shared skills
      const sharedSkills = (c.skillsCovered || []).filter((s: any) =>
        (course.skillsCovered || []).includes(s)
      ).length;
      score += sharedSkills * 3;
      return { ...c, similarityScore: score };
    });

    return scored
      .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  // ------------------ SMART SCORING FUNCTION ------------------
  private scoreCourse(course: any, prefs: any) {
    let score = 0;

    // Company Category
    if (prefs.preferredCompanyCategories?.includes(course.industry)) {
      score += SCORE_WEIGHTS.companyCategory;
    }

    // Course Category
    if (prefs.preferredCourseCategories?.includes(course.courseCategory)) {
      score += SCORE_WEIGHTS.courseCategory;
    }

    // Mode match
    if (prefs.preferredModes?.includes(course.mode)) {
      score += SCORE_WEIGHTS.mode;
    }

    // Language match
    if (prefs.preferredLanguages?.includes(course.language)) {
      score += SCORE_WEIGHTS.language;
    }

    // Placement
    if (prefs.placementRequired === true) {
      if (course.placementAssistance) {
        score += SCORE_WEIGHTS.placement;
      } else {
        score += SCORE_WEIGHTS.mismatchPenalty;
      }
    }

    // Price soft scoring
    if (prefs.minPrice && prefs.maxPrice) {
      const mid = (prefs.minPrice + prefs.maxPrice) / 2;
      const distance = Math.abs(course.price - mid);
      const closeness = Math.max(0, 1 - distance / mid);
      score += closeness * SCORE_WEIGHTS.price;
    }

    // Duration soft scoring
    if (prefs.maxDurationValue > 0) {
      if (course.duration?.unit === prefs.maxDurationUnit) {
        const closeness = Math.max(
          0,
          1 - course.duration.value / prefs.maxDurationValue
        );
        score += closeness * SCORE_WEIGHTS.duration;
      }
    }

    // Keyword token match
    if (prefs.keywordTags?.length && course.description) {
      const descTokens = course.description.toLowerCase().split(/[\s,.-]+/);

      for (const tag of prefs.keywordTags) {
        const tokens = tag.toLowerCase().split(" ");
        if (tokens.some((t: any) => descTokens.includes(t))) {
          score += SCORE_WEIGHTS.keyword;
        }
      }
    }

    // Recency boost
    const monthsOld =
      (Date.now() - new Date(course.createdAt).getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    const recencyFactor = Math.max(0, 1 - monthsOld / 12);
    score += recencyFactor * SCORE_WEIGHTS.recencyBoost;

    // Random diversity boost
    score += Math.random() * SCORE_WEIGHTS.diversityBoost;

    return Math.round(score);
  }

  async getRecommendedCourses(userId: string) {
    const prefs = await this.prefService.getPreferencesByUserId(userId);

    const allCourses = await CourseModel.aggregate([
      {
        $lookup: {
          from: "Companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $addFields: {
          companyName: { $arrayElemAt: ["$company.companyname", 0] },
        },
      },
      { $project: { company: 0 } },
    ]);

    const scoredCourses = allCourses.map((course) => {
      // 🎯 Case 1: personalized
      if (prefs) {
        return {
          ...course,
          score: this.scoreCourse(course, prefs),
        };
      }

      // 🎯 Case 2: fallback (no preferences)
      const monthsOld =
        (Date.now() - new Date(course.createdAt).getTime()) /
        (1000 * 60 * 60 * 24 * 30);

      const recencyScore = Math.max(0, 1 - monthsOld / 12) * 50;
      const popularityScore = (course.noOfLeads || 0) * 0.5;

      return {
        ...course,
        score: Math.round(recencyScore + popularityScore),
      };
    });

    return scoredCourses.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  async getRecommendedCoursesByCompanyCategory(
    companyCategoryNumber: string,
    userId: string
  ) {
    try {
      // 1. Load user preferences
      const prefs: any = await this.prefService.getPreferencesByUserId(userId);
      if (!prefs) throw new Error("No preferences found for this user");

      // 2. Fetch the actual CompanyCategory DOC using number
      const companyCategoryDoc = await CompanyCategoryModel.findOne({
        _id: companyCategoryNumber,
      });

      if (!companyCategoryDoc) throw new Error("Company category not found");

      const categoryObjectId = companyCategoryDoc._id;

      // 3. Fetch all courseCategories under this company category (correct!)
      const subCategories = await CourseCategoryModel.find({
        companyCategoryId: categoryObjectId,
      }).select("_id NoOfCoursesListing");

      if (subCategories.length === 0) return [];

      const subCategoryIds = subCategories.map((c: any) => c._id);

      // 4. Fetch courses under these categories
      const rawCourses = await CourseModel.aggregate([
        {
          $match: {
            courseCategory: { $in: subCategoryIds },
          },
        },
        {
          $lookup: {
            from: "Companies",
            localField: "companyId",
            foreignField: "_id",
            as: "company",
          },
        },
        {
          $addFields: {
            companyName: { $arrayElemAt: ["$company.companyname", 0] },
          },
        },
        { $project: { company: 0 } },
      ]);

      // 5. Score the courses
      const scoredCourses = rawCourses.map((course) => ({
        ...course,
        score: this.scoreCourse(course, prefs),
      }));

      return scoredCourses.sort((a, b) => b.score - a.score).slice(0, 5);
    } catch (error) {
      throw new Error(
        "Error fetching company-category smart courses: " + error
      );
    }
  }

  async getCourses(
    page = 1,
    limit = 20,
    filters: {
      categories?: string[] | null;
      industries?: string[] | null;
      priceMin?: number | null;
      priceMax?: number | null;
      mode?: string | null;
      languages?: string[] | null;
      placementAssistance?: boolean | null;
      instructorId?: string | null;
      userId?: string | null;
      search?: string | null;
    } = {}
  ) {
    try {
      const skip = (page - 1) * limit;

      const query: any = {};

      // NORMAL FILTERS
      if (filters.categories?.length) {
        query.courseCategory = {
          $in: filters.categories.map((id) => new Types.ObjectId(id)),
        };
      }

      if (filters.industries?.length) {
        query.industry = {
          $in: filters.industries.map((id) => new Types.ObjectId(id)),
        };
      }

      if (filters.priceMin != null || filters.priceMax != null) {
        query.price = {};
        if (filters.priceMin != null) query.price.$gte = filters.priceMin;
        if (filters.priceMax != null) query.price.$lte = filters.priceMax;
      }

      if (filters.mode) query.mode = filters.mode;

      if (filters.languages?.length) {
        query.language = { $in: filters.languages };
      }

      if (filters.placementAssistance != null) {
        query.placementAssistance = filters.placementAssistance;
      }

      if (filters.instructorId) {
        query.instructorId = new Types.ObjectId(filters.instructorId);
      }

      // SEARCH PATH (NAME FIRST) - enhanced with fuzzy + fuse fallbacks
      if (filters.search && filters.search.trim() !== "") {
        const rawQuery = filters.search.trim();
        const q = rawQuery.toLowerCase();
        const tokens = q.split(/\s+/).filter(Boolean);

        const nameMatch: any = { ...query };

        if (tokens.length === 1) {
          nameMatch.courseName = {
            $regex: new RegExp(escapeRegex(tokens[0]), "i"),
          };
        } else if (tokens.length > 1) {
          nameMatch.$and = tokens.map((t) => ({
            courseName: { $regex: new RegExp(escapeRegex(t), "i") },
          }));
        }

        let nameResults: any[] = [];
        if (tokens.length > 0) {
          nameResults = await CourseModel.aggregate([
            { $match: nameMatch },
            {
              $lookup: {
                from: "Companies",
                localField: "companyId",
                foreignField: "_id",
                as: "company",
              },
            },
            {
              $addFields: {
                companyName: { $arrayElemAt: ["$company.companyname", 0] },
              },
            },
            { $project: { company: 0 } },
            { $sort: { noOfLeads: -1, createdAt: -1 } },
            { $limit: limit },
          ]);
        }

        if (nameResults.length >= limit) {
          return {
            courses: nameResults,
            total: nameResults.length,
            hasMore: false,
            appliedFilters: { search: rawQuery, mode: "name" },
          };
        }

        // Text-search fallback (your original $text)
        const excludeIds = nameResults.map((c) => c._id);
        let textResults: any[] = [];
        try {
          textResults = await CourseModel.aggregate([
            {
              $match: {
                ...query,
                _id: { $nin: excludeIds },
                $text: { $search: rawQuery },
              },
            },
            {
              $addFields: {
                textScore: { $meta: "textScore" },
              },
            },
            {
              $lookup: {
                from: "Companies",
                localField: "companyId",
                foreignField: "_id",
                as: "company",
              },
            },
            {
              $addFields: {
                companyName: { $arrayElemAt: ["$company.companyname", 0] },
              },
            },
            { $project: { company: 0 } },
            { $sort: { textScore: -1, createdAt: -1 } },
            { $limit: Math.max(0, limit - nameResults.length) },
          ]);
        } catch (e) {
          textResults = [];
        }

        let combined = [...nameResults, ...textResults];

        if (combined.length === 0 && tokens.length > 0) {
          const fuzzyRegex = buildFuzzyRegex(tokens);
          try {
            const fuzzyResults = await CourseModel.aggregate([
              {
                $match: {
                  ...query,
                  courseName: { $regex: fuzzyRegex },
                },
              },
              {
                $lookup: {
                  from: "Companies",
                  localField: "companyId",
                  foreignField: "_id",
                  as: "company",
                },
              },
              {
                $addFields: {
                  companyName: { $arrayElemAt: ["$company.companyname", 0] },
                },
              },
              { $project: { company: 0 } },
              { $sort: { createdAt: -1 } },
              { $limit: limit },
            ]);
            combined = fuzzyResults;
          } catch (err) {
            combined = [];
          }
        }

        if (combined.length === 0) {
          const fuseCandidates = await this.fuseSearch(rawQuery, limit, query);
          if (fuseCandidates.length > 0) {
            return {
              courses: fuseCandidates.slice(0, limit),
              total: fuseCandidates.length,
              hasMore: false,
              appliedFilters: { search: rawQuery, mode: "fuse" },
            };
          }
        }

        if (combined.length === 0) {
          const aiIds = await this.aiSearch(rawQuery, limit);
          if (aiIds.length === 0) {
            return { courses: [], total: 0, hasMore: false };
          }

          const aiCourses = await CourseModel.aggregate([
            { $match: { _id: { $in: aiIds } } },
            {
              $lookup: {
                from: "Companies",
                localField: "companyId",
                foreignField: "_id",
                as: "company",
              },
            },
            {
              $addFields: {
                companyName: { $arrayElemAt: ["$company.companyname", 0] },
              },
            },
            { $project: { company: 0 } },
            { $limit: limit },
          ]);

          return {
            courses: aiCourses,
            total: aiCourses.length,
            hasMore: false,
            appliedFilters: { search: rawQuery, mode: "ai" },
          };
        }

        combined = combined.slice(0, limit);

        return {
          courses: combined,
          total: combined.length,
          hasMore: false,
          appliedFilters: { search: rawQuery, mode: "name+text+fuzzy" },
        };
      }

      const courses = await CourseModel.aggregate([
        { $match: query },

        {
          $lookup: {
            from: "Companies",
            localField: "companyId",
            foreignField: "_id",
            as: "company",
          },
        },

        {
          $addFields: {
            companyName: { $arrayElemAt: ["$company.companyname", 0] },
          },
        },

        { $project: { company: 0 } },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      const total = await CourseModel.countDocuments(query);

      return {
        courses,
        total,
        hasMore: skip + limit < total,
        appliedFilters: query,
      };
    } catch (error) {
      throw new Error("Error fetching courses: " + error);
    }
  }

  private async aiSearch(keyword: string, limit = 20) {
    const { generateEmbedding, cosineSimilarity } = await import(
      "../../Utils/AiEmbedding.js"
    );

    const queryEmbedding = await generateEmbedding(keyword);

    const allCourses = await CourseModel.find(
      { embedding: { $exists: true, $ne: [] } },
      { embedding: 1 }
    );

    const scored = allCourses
      .map((course) => {
        if (!Array.isArray(course.embedding)) return null;
        if (course.embedding.length !== queryEmbedding.length) return null;

        return {
          id: course._id,
          score: cosineSimilarity(queryEmbedding, course.embedding),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s: any) => s.id);
  }
  async getCourseById(id: string) {
    if (!id || !Types.ObjectId.isValid(id)) return null;

    const result = await CourseModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },

      {
        $lookup: {
          from: "Companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company",
        },
      },

      {
        $addFields: {
          companyName: { $arrayElemAt: ["$company.companyname", 0] },
        },
      },

      {
        $project: {
          company: 0,
          embedding: 0, // remove embedding field
        },
      },
    ]);

    return result[0] || null;
  }
}
function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
