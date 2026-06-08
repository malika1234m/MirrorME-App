import { Router } from "../utils/asyncRouter";
import { toggleFollow, getFollowers, getFollowing, getProfile } from "../controllers/followController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/profile/:userId", getProfile);
router.post("/:userId/toggle", toggleFollow);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

export default router;
