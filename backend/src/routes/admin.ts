import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import {
  listAllBrands, verifyBrand, rejectBrand, revokeBrand,
  listUsers, grantAdmin, getStats,
} from "../controllers/adminController";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/stats", getStats);
router.get("/brands", listAllBrands);
router.post("/brands/:id/verify", verifyBrand);
router.post("/brands/:id/reject", rejectBrand);
router.post("/brands/:id/revoke", revokeBrand);
router.get("/users", listUsers);
router.post("/users/:id/grant-admin", grantAdmin);

export default router;
