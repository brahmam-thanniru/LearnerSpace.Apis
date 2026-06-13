import { Router } from "express";
import { ReviewsController } from "./Reviews.Controller";

const router = Router();
const reviews = new ReviewsController();

// Create a review
router.post("/", (req, res) => reviews.handleCreate(req, res));

// Get all reviews (admin / internal)
router.get("/", (req, res) => reviews.handleGetAllReviews(req, res));

// Get reviews by COURSE
router.get("/course/:courseId", (req, res) =>
  reviews.getReviewsByCourse(req, res)
);

// Get reviews by USER
router.get("/user/:userId", (req, res) => reviews.getReviewsByUser(req, res));

// Update review
router.put("/:reviewId", (req, res) => reviews.updateReview(req, res));

// Delete review
router.delete("/:reviewId", (req, res) => reviews.deleteReview(req, res));

export default router;
