import { Router } from "express";
import { PostsController } from "./Posts.Controller";

const router = Router();
const postObj = new PostsController();

router.post("/", (req, res) => postObj.handleCreate(req, res));

router.put("/:postId", (req, res) => postObj.updatePost(req, res));

router.delete("/:postId", (req, res) => postObj.deletePost(req, res));

router.get("/user/:userId", (req, res) => postObj.getPostsByUserId(req, res));

router.get("/category/:category/:userId", (req, res) =>
  postObj.getPostsByCategory(req, res)
);
router.get("/:userId", (req, res) => postObj.getAllPosts(req, res));
export default router;
