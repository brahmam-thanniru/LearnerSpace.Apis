import { BaseService } from "../../../Base/BaseService";
import { CompanyCategory, CompanyCategoryModel, CourseCategory, CourseCategoryModel } from "./Category.Model";
export class CompanyCategoryService extends BaseService<CompanyCategory> {
  constructor() {
    super(CompanyCategoryModel);
  }

  async getAllCategories(): Promise<CompanyCategory[]> {
    return this.model.find().exec();
  }

  async getCategoryById(id: string): Promise<CompanyCategory | null> {
    return this.model.findOne({ _id: id }).exec();
  }

  async createCategory(data: Partial<CompanyCategory>): Promise<CompanyCategory> {
    const name = data.name?.trim();
    const _id = data._id;

    if (!name) throw new Error("Category name is required");
    if (_id) {
      const updated = await this.model.findByIdAndUpdate(
        _id,
        {
          ...data,
        },
        { new: true }
      );

      if (!updated) throw new Error("Category not found");
      return updated;
    }

    const existing = await this.model.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existing) {
      throw new Error("Category with this name already exists");
    }

    const created = new this.model({
      name,
      imageUrl: data.imageUrl,
    });

    return created.save();
  }

  async getCompanyCategoryAsMap(): Promise<Record<string, string>> {
    const categories = await this.model.find().lean();

    const map: Record<string, string> = {};

    categories.forEach((cat) => {
      map[String(cat._id)] = cat.name;
    });

    return map;
  }
}

export class CourseCategoryService extends BaseService<CourseCategory> {
  constructor() {
    super(CourseCategoryModel);
  }

  async getAllCourseCategories(companyCategoryId: string): Promise<CourseCategory[]> {
    return this.model
      .find({ companyCategoryId })
      .sort({ name: 1 })
      .exec();
  }

  async getCourseCategoryById(_id: string): Promise<CourseCategory | null> {
    return this.model.findOne({ _id }).exec();
  }
  async createCourseCategory(data: Partial<CourseCategory>): Promise<CourseCategory> {
    const { _id, name, imageUrl, companyCategoryId } = data;

    if (!companyCategoryId) {
      throw new Error("companyCategoryId is required");
    }
    if (!name?.trim()) {
      throw new Error("Category name is required");
    }

    // ---------------------------------------------
    // 1️⃣ UPDATE FLOW — Only when _id is provided
    // ---------------------------------------------
    if (_id) {
      const updated = await this.model.findByIdAndUpdate(
        _id,
        {
          name,
          imageUrl,
          companyCategoryId,
        },
        { new: true }
      );

      if (!updated) throw new Error("Course category not found");

      return updated;
    }

    // ---------------------------------------------
    // 2️⃣ CREATE FLOW — No _id, so check duplicate
    // ---------------------------------------------
    const existing = await this.model.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      companyCategoryId,
    });

    if (existing) {
      throw new Error("Category with this name already exists under this company");
    }

    // CREATE NEW
    const created = new this.model({
      name,
      imageUrl,
      companyCategoryId,
    });

    return created.save();
  }

  async getCourseCategoryAsMap(companyCategoryId: string): Promise<Record<string, string>> {

    const categories = await this.model.find({ companyCategoryId }).sort({ name: 1 }).lean();
    const map: Record<string, string> = {};
    categories.forEach((cat) => { map[String(cat._id)] = cat.name; });
    return map;
  }

  async getAllCourseCategoryAsMap(): Promise<Record<string, string>> {
    const categories = await this.model
      .find()
      .sort({ name: 1 })
      .lean();

    const map: Record<string, string> = {};

    categories.forEach((cat) => {
      map[String(cat._id)] = cat.name;
    });

    return map;
  }

}
