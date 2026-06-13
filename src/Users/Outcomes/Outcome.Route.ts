import { Router } from "express";
import { OutcomeController } from "./Outcome.Controller";

const router = Router();
const outcome = new OutcomeController();

// CREATE
router.post("/", (req, res) => outcome.handleCreate(req, res));

// READ
router.get("/", (req, res) => outcome.handleGetAll(req, res));
router.get("/featured", (req, res) => outcome.getFeaturedOutcomes(req, res));

// SPECIFIC routes FIRST
router.get("/user/:userId", (req, res) =>
  outcome.getOutcomesByUser(req, res)
);

router.get("/course/:courseId", (req, res) =>
  outcome.getOutcomesByCourse(req, res)
);

router.get("/all/:companyId", (req, res) =>
  outcome.getOutcomesByCompany(req, res)
);

router.get("/company/:id", (req, res) =>
  outcome.getOutcomeByIdCompany(req, res)
);

// ⚠️ GENERIC route LAST
router.get("/:id", (req, res) =>
  outcome.getOutcomeById(req, res)
);

// UPDATE
router.put("/:id", (req, res) => outcome.updateOutcome(req, res));
router.patch("/:id/verify", (req, res) =>
  outcome.verifyOutcome(req, res)
);

// DELETE
router.delete("/:id", (req, res) => outcome.deleteOutcome(req, res));

// POST by course
router.post("/:courseId/post", (req, res) =>
  outcome.postOutcomesByCourse(req, res)
);

export default router;
