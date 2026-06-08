import { Router } from "../utils/asyncRouter";
import { body } from "express-validator";
import { ratePost, getPostRating } from "../controllers/ratingController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/:postId", body("score").isInt({ min: 1, max: 10 }), ratePost);
router.get("/:postId", getPostRating);

export default router;
