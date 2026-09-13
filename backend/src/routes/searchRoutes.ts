import { Router } from "express";
import * as searchController from "../controllers/searchController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", searchController.globalSearch);

export default router;
