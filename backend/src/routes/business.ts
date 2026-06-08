import { Router } from "../utils/asyncRouter";
import {
  registerBusiness, getMyBusiness, getBusiness,
  updateBusiness, toggleFollow, listBusinesses, getFeaturedBusinesses,
  requestVerification,
} from "../controllers/businessController";
import { getBusinessProducts } from "../controllers/productController";
import { authenticate } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";

const router = Router();
router.use(authenticate);

router.get("/", listBusinesses);
router.get("/featured", getFeaturedBusinesses);
router.get("/me", getMyBusiness);
router.post("/register", registerBusiness);
router.patch("/me", uploadAvatar, updateBusiness);
router.post("/me/request-verification", requestVerification);
router.get("/:id", getBusiness);
router.post("/:id/follow", toggleFollow);
router.get("/:id/products", getBusinessProducts);

export default router;
