import { Router } from "express";
import { LearnerController } from "./Learner.Controller";
import { LeanerCourseController } from "./Courses/Learner.Course.Controller";
import { LeanerCategoryController } from "./Categories/Learner.Categories.Controller";
import { PreferencesController } from "./Preferences/Preferences.Controller";
import reviewsRoutes from "./Reviews/Reviews.Route";
import { authMiddleware } from "../Utils/AuthMiddleWare";

const router = Router();

const learner = new LearnerController();
const course = new LeanerCourseController();
const category = new LeanerCategoryController();
const preferences = new PreferencesController();

/* ===================== USERS ===================== */

router.post("/", (req, res) => learner.handleSignup(req, res));
router.get("/", (req, res) => learner.handleGetAll(req, res));
router.get("/learner/:id", (req, res) => learner.handleGetById(req, res));
router.post("/login", (req, res) => learner.login(req, res));
router.post("/change-password", authMiddleware, (req, res) =>
  learner.handleChangePassword(req, res)
);
/* ===================== COURSES ===================== */

router.get("/getCourses", (req, res) => course.getCourses(req, res));
router.get("/getRecommendedCourses/:userId", (req, res) =>
  course.getRecommendedCourses(req, res)
);
router.get(
  "/getRecommendedCourseByCat/:userId/:companyCategoryId",
  (req, res) => course.getRecommendedCoursesByCompanyCategory(req, res)
);
router.get("/getCourse/:id", (req, res) => course.getCourseById(req, res));

/* ===================== CATEGORIES ===================== */

router.get("/getAllCategories", (req, res) =>
  category.getAllCategories(req, res)
);
router.get("/companyCategoryCount/:companyCategoryId", (req, res) =>
  category.getCompanyCategoryCount(req, res)
);

/* ===================== PREFERENCES ===================== */

router.get("/preferences/:userId", (req, res) =>
  preferences.getUserPreferences(req, res)
);

router.post("/preferences/:userId", (req, res) =>
  preferences.handleCreate(req, res)
);

router.put("/preferences/:userId", (req, res) =>
  preferences.updateUserPreferences(req, res)
);

router.delete("/preferences/:userId/reset", (req, res) =>
  preferences.resetUserPreferences(req, res)
);

/* ===================== REVIEWS ===================== */

router.use("/reviews", reviewsRoutes);

export default router;
