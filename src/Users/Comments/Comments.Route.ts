import { Router } from "express";
import { CommentsController } from "./Comments.Controller";

const router = Router();
const commentObj = new CommentsController();

router.post("/", (req, res) => commentObj.addComment(req, res));

router.post("/reply/:parentCommentId", (req, res) =>
  commentObj.addReply(req, res)
);

router.get("/post/:postId", (req, res) =>
  commentObj.getCommentsForPost(req, res)
);

router.get("/replies/:commentId", (req, res) =>
  commentObj.getReplies(req, res)
);

router.delete("/:commentId", (req, res) => commentObj.deleteComment(req, res));

export default router;
