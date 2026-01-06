import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    createComment,
    getCommentsByPost,
    editComment,
    deleteComment
} from "../controllers/comments.controllers.js";

const router = Router();

router.post(
    "/:postId",
    verifyJWT,
    createComment
);

router.get(
    "/:postId",
    getCommentsByPost
);

router.patch("/:commentId",
    verifyJWT,
    editComment
);

router.delete(
    "/:commentId",
    verifyJWT,
    deleteComment
);

export default router;
