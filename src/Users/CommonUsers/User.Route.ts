import { Router } from "express";
import { CommonUserController } from "./User.Controller";

const router = Router();
const user = new CommonUserController();

// Base CRUD routes
router.post("/", (req, res) => user.handleSignup(req, res));
router.get("/", (req, res) => user.handleGetAll(req, res));
router.get("/:id", (req, res) => user.handleGetById(req, res));
router.put("/:id", (req, res) => user.handleUpdate(req, res));
router.post("/login", (req, res) => user.login(req, res));
router.delete("/:id", (req, res) => user.handleDelete(req, res));

// Custom route for verified instructors
// router.get("/verified/list", (req, res) =>
//   instructorController.handleGetVerified(req, res)
// );

export default router;
