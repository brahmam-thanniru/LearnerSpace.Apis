import { Router } from "express";
import { LikesController } from "./Likes.Controller";

const router = Router();
const likeObj = new LikesController();

// Like a post
router.post("/:postId", (req, res) => likeObj.likePost(req, res));

// Unlike a post
router.post("/unlike/:postId", (req, res) => likeObj.unlikePost(req, res));

// Check if user liked the post
router.get("/check/:postId/:userId", (req, res) =>
  likeObj.checkUserLike(req, res)
);

// Get all likes for a post
router.get("/post/:postId", (req, res) => likeObj.getLikes(req, res));

export default router;
