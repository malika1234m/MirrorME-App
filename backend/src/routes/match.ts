import { Router } from "../utils/asyncRouter";
import { matchByPhoto, getMatchHistory } from "../controllers/matchController";
import { authenticate } from "../middleware/auth";
import { uploadForMatch } from "../middleware/upload";

const router = Router();
router.use(authenticate);

router.post("/", uploadForMatch, matchByPhoto);
router.get("/history", getMatchHistory);

export default router;
