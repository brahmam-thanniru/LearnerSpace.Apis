// src/controllers/base.controller.ts
import { Request, Response } from "express";
import { BaseService } from "./BaseService";

export class BaseController<T> {
  protected service: BaseService<T>;

  constructor(service: BaseService<T>) {
    this.service = service;
  }

  async handleCreate(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.create(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async handleGetAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.findAll();
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async handleGetById(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.findById(req.params.id);
      if (!result) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async handleUpdate(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.update(req.params.id, req.body);
      if (!result) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async handleDelete(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.delete(req.params.id);
      if (!result) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      res.status(200).json({ message: "Deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
