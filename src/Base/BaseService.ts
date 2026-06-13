// src/services/base.service.ts
import {ReturnModelType} from "@typegoose/typegoose";
import {DocumentType} from "@typegoose/typegoose";

export class BaseService<T> {
  protected model: ReturnModelType<new () => T>;

  constructor(model: ReturnModelType<new () => T>) {
    this.model = model;
  }

  async create(payload: Partial<T>): Promise<DocumentType<T>> {
    return (await this.model.create(payload)) as DocumentType<T>;
  }

  async findById(id: string): Promise<DocumentType<T> | null> {
    return (await this.model.findById(id).exec()) as DocumentType<T> | null;
  }

async findAll(filter: Partial<T> = {}): Promise<DocumentType<T>[]> {
  return (await this.model.find(filter).exec()) as DocumentType<T>[];
}


  async update(
    id: string,
    payload: Partial<T>
  ): Promise<DocumentType<T> | null> {
    return (await this.model
      .findByIdAndUpdate(id, payload, {new: true})
      .exec()) as DocumentType<T> | null;
  }

  async delete(id: string): Promise<DocumentType<T> | null> {
    return (await this.model
      .findByIdAndDelete(id)
      .exec()) as DocumentType<T> | null;
  }
}
