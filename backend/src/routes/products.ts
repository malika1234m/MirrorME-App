import { Router } from "express";
import {
  createProduct, getMyProducts, updateProduct, deleteProduct, toggleSaveProduct,
} from "../controllers/productController";
import { authenticate } from "../middleware/auth";
import { uploadOutfit } from "../middleware/upload";

const router = Router();
router.use(authenticate);

router.get("/my", getMyProducts);
router.post("/", uploadOutfit, createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.post("/:id/save", toggleSaveProduct);

export default router;
