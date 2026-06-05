import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getWardrobeItems,
  toggleWardrobeItem,
  getBrowseCatalog,
  recommendSize,
  updateMeasurements,
} from "../controllers/wardrobeController";

const router = Router();

router.use(authenticate);

router.get("/", getWardrobeItems);
router.get("/catalog", getBrowseCatalog);
router.post("/size-recommend", recommendSize);
router.patch("/measurements", updateMeasurements);
router.post("/:productId/toggle", toggleWardrobeItem);

export default router;
