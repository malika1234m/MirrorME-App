import { Router } from "../utils/asyncRouter";
import {
  createPost, getFeed, getPost, deletePost, getUserPosts, explorePosts,
} from "../controllers/postController";
import { authenticate } from "../middleware/auth";
import { uploadOutfit } from "../middleware/upload";
import { toggleLike } from "../controllers/likeController";

const router = Router();

router.use(authenticate);

router.get("/feed", getFeed);
router.get("/explore", explorePosts);
router.get("/user/:userId", getUserPosts);   // must be before /:id
router.post("/", uploadOutfit, createPost);
router.get("/:id", getPost);
router.delete("/:id", deletePost);
router.post("/:postId/like", toggleLike);

export default router;
