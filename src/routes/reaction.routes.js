import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addOrUpdateReaction,
  getReactionsForPost,
} from "../controllers/reaction.controllers.js";

const router = Router();


router.post("/posts/:postId/reaction",
  verifyJWT,
  addOrUpdateReaction
);

router.get("/posts/:postId/reaction",
  getReactionsForPost
);

export default router;
