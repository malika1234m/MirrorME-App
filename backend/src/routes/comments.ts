import { Router } from "../utils/asyncRouter";
import { body } from "express-validator";
import { addComment, getComments, deleteComment } from "../controllers/commentController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/:postId", body("content").notEmpty().isLength({ max: 500 }), addComment);
router.get("/:postId", getComments);
router.delete("/:id", deleteComment);

export default router;
